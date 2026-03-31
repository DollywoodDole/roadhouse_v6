/**
 * RoadHouse Capital — Off-Chain $ROAD Balance Tracking
 * ──────────────────────────────────────────────────────
 * Stores member $ROAD balances in Upstash Redis via @upstash/redis SDK.
 *
 * KV key schema:
 *   road:{stripeCustomerId}  →  RoadBalance JSON
 *   wallet:{walletAddress}   →  stripeCustomerId (reverse index)
 *   evt:{stripeEventId}      →  1  (idempotency guard — written by webhook handler)
 */

import { Redis } from '@upstash/redis'

// ── MemberTier — defined inline to avoid circular import with lib/profile.ts ──
// profile.ts imports normaliseTier from this file; importing profile.ts here
// would create a circular dependency. Both definitions are structurally identical.
export type MemberTier =
  | 'guest'
  | 'regular'
  | 'ranch-hand'
  | 'partner'
  | 'steward'
  | 'praetor'

export interface RoadBalance {
  email:            string
  stripeCustomerId: string
  walletAddress?:   string
  balance:          number
  tier:             'guest' | 'regular' | 'ranch' | 'partner' | 'steward' | 'praetor'
  history:          { date: string; amount: number; reason: string }[]
  // ── Profile fields — set via updateProfileFields() ──────────────────────────
  alias?:             string | null
  bio?:               string | null
  avatarUrl?:         string | null
  guild?:             'media' | 'builder' | 'frontier' | 'venture' | null
  joinedAt?:          string
  contributions?:     {
    id:         string
    date:       string
    label:      string
    roadEarned: number
    guildId:    string | null
    verified:   boolean
  }[]
  experimentsJoined?: number
  currentStreak?:     number
}

export const ACCRUAL: Record<string, number> = {
  regular:      100,
  'ranch-hand': 500,
  partner:      2000,
}

// KV key tracking total remaining community $ROAD allocation.
// null (key absent) = no cap enforced (unlimited).
// 0 = depleted — no accruals until topped up.
const COMMUNITY_CAP_KEY = 'road:community-bucket'

// getMembershipTier() returns 'ranch-hand'; RoadBalance.tier uses 'ranch'
const TIER_TO_ROAD_TIER: Record<string, RoadBalance['tier']> = {
  regular:      'regular',
  'ranch-hand': 'ranch',
  partner:      'partner',
}

// ── Redis client (lazy singleton) ─────────────────────────────────────────────

function getRedis(): Redis {
  const url   = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN not set')
  return new Redis({ url, token })
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getRoadBalance(stripeCustomerId: string): Promise<RoadBalance | null> {
  return getRedis().get<RoadBalance>(`road:${stripeCustomerId}`)
}

export async function setRoadBalance(balance: RoadBalance): Promise<void> {
  await getRedis().set(`road:${balance.stripeCustomerId}`, balance)
}

/**
 * Creates an initial RoadBalance record for a new member.
 * Called from the Stripe webhook on checkout.session.completed.
 */
export async function initRoadBalance(
  stripeCustomerId: string,
  email:            string,
  membershipTier:   string,
): Promise<RoadBalance> {
  const existing = await getRoadBalance(stripeCustomerId)
  if (existing) return existing

  const tier: RoadBalance['tier'] = TIER_TO_ROAD_TIER[membershipTier] ?? 'guest'
  const balance: RoadBalance = {
    email,
    stripeCustomerId,
    balance: 0,
    tier,
    history: [],
  }
  await setRoadBalance(balance)
  return balance
}

/**
 * Accrues the monthly $ROAD allocation for a single member.
 * Checks the community bucket cap (road:community-bucket) before writing.
 * Returns { accrued, capped } — accrued may be less than the full rate if
 * the bucket has less than the full rate remaining.
 */
export async function accrueMonthlyRoad(
  stripeCustomerId: string,
  email:            string,
  membershipTier:   string,
): Promise<{ accrued: number; capped: boolean }> {
  const amount = ACCRUAL[membershipTier] ?? 0
  if (amount === 0) throw new Error(`Unknown or non-accruing tier: ${membershipTier}`)

  const redis  = getRedis()
  const bucket = await redis.get<number>(COMMUNITY_CAP_KEY) // null = no cap

  if (bucket !== null && bucket <= 0) {
    console.warn(JSON.stringify({ evt: 'road.accrue.cap_depleted', stripeCustomerId }))
    return { accrued: 0, capped: true }
  }

  const grant = (bucket !== null) ? Math.min(amount, bucket) : amount

  const existing = await getRoadBalance(stripeCustomerId)
  const tier: RoadBalance['tier'] = TIER_TO_ROAD_TIER[membershipTier] ?? 'guest'
  const today = new Date().toISOString().slice(0, 10)

  const updated: RoadBalance = existing
    ? {
        ...existing,
        email,
        tier,
        balance: existing.balance + grant,
        history: [...existing.history, { date: today, amount: grant, reason: `Monthly accrual — ${tier}` }],
      }
    : {
        email,
        stripeCustomerId,
        balance: grant,
        tier,
        history: [{ date: today, amount: grant, reason: `Monthly accrual — ${tier}` }],
      }

  const writes: Promise<unknown>[] = [setRoadBalance(updated)]
  if (bucket !== null) writes.push(redis.decrby(COMMUNITY_CAP_KEY, grant))
  await Promise.all(writes)

  return { accrued: grant, capped: grant < amount }
}

/**
 * Registers a Solana wallet address for airdrop at mainnet launch.
 * Also writes a reverse-index key wallet:{address} → stripeCustomerId
 * so getCustomerIdByWallet() can look up a member without scanning all keys.
 */
export async function registerWallet(
  stripeCustomerId: string,
  walletAddress:    string,
): Promise<RoadBalance> {
  const existing = await getRoadBalance(stripeCustomerId)
  if (!existing) throw new Error('No $ROAD balance record found for this customer')

  // Orphan cleanup — delete stale reverse index when member switches wallets
  const prevAddress = existing.walletAddress
  if (prevAddress && prevAddress !== walletAddress) {
    try {
      await getRedis().del(`wallet:${prevAddress}`)
    } catch (err) {
      console.warn('[registerWallet] orphan cleanup failed', { prevAddress, err })
    }
  }

  const updated: RoadBalance = { ...existing, walletAddress }
  await setRoadBalance(updated)
  await getRedis().set(`wallet:${walletAddress}`, stripeCustomerId)
  return updated
}

/**
 * Looks up a Stripe customer ID from a Solana wallet address.
 * Returns null if the wallet has not been registered via registerWallet().
 */
export async function getCustomerIdByWallet(walletAddress: string): Promise<string | null> {
  return getRedis().get<string>(`wallet:${walletAddress}`)
}

/**
 * Merges profile field updates into an existing RoadBalance record.
 * Throws if no record exists for stripeCustomerId.
 */
export async function updateProfileFields(
  stripeCustomerId: string,
  updates: Partial<Pick<RoadBalance, 'alias' | 'bio' | 'avatarUrl' | 'guild'>>,
): Promise<void> {
  const existing = await getRoadBalance(stripeCustomerId)
  if (!existing) throw new Error('No RoadBalance record for ' + stripeCustomerId)
  await setRoadBalance({ ...existing, ...updates })
}

/**
 * Prepends a contribution to the member's history.
 * Keeps a maximum of 50 entries (most recent first).
 * Throws if no record exists for stripeCustomerId.
 */
export async function addContribution(
  stripeCustomerId: string,
  contribution: {
    id:         string
    date:       string
    label:      string
    roadEarned: number
    guildId:    string | null
    verified:   boolean
  },
): Promise<void> {
  const existing = await getRoadBalance(stripeCustomerId)
  if (!existing) throw new Error('No RoadBalance record for ' + stripeCustomerId)
  const contributions = [contribution, ...(existing.contributions ?? [])].slice(0, 50)
  await setRoadBalance({ ...existing, contributions })
}

/**
 * Maps any tier string format to the profile.ts MemberTier (hyphen) format.
 * Bridges three formats used across the codebase:
 *   'ranch'       — KV / road-balance.ts  (TIER_TO_ROAD_TIER output)
 *   'ranchHand'   — lib/solana.ts         (getTierFromBalance output)
 *   'ranch-hand'  — lib/profile.ts        (MemberTier type)
 * MemberTier is defined inline above — not imported from profile.ts
 * to avoid a circular dependency.
 */
export function normaliseTier(raw: string | null | undefined): MemberTier {
  const map: Record<string, MemberTier> = {
    guest:        'guest',
    regular:      'regular',
    ranch:        'ranch-hand',
    ranchHand:    'ranch-hand',
    'ranch-hand': 'ranch-hand',
    partner:      'partner',
    steward:      'steward',
    praetor:      'praetor',
  }
  return map[raw ?? 'guest'] ?? 'guest'
}
