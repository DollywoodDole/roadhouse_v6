/**
 * RoadHouse Capital — Off-Chain $ROAD Balance Tracking
 * ──────────────────────────────────────────────────────
 * Stores member $ROAD balances in Upstash Redis via @upstash/redis SDK.
 *
 * KV key schema:
 *   road:{stripeCustomerId}  →  RoadBalance JSON
 */

import { Redis } from '@upstash/redis'

export interface RoadBalance {
  email:            string
  stripeCustomerId: string
  walletAddress?:   string
  balance:          number
  tier:             'guest' | 'regular' | 'ranch' | 'partner' | 'steward' | 'praetor'
  history:          { date: string; amount: number; reason: string }[]
}

export const ACCRUAL: Record<string, number> = {
  regular:   100,
  ranchHand: 500,
  partner:   2000,
}

// getMembershipTier() returns 'ranchHand'; RoadBalance.tier uses 'ranch'
const TIER_TO_ROAD_TIER: Record<string, RoadBalance['tier']> = {
  regular:   'regular',
  ranchHand: 'ranch',
  partner:   'partner',
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
 */
export async function accrueMonthlyRoad(
  stripeCustomerId: string,
  email:            string,
  membershipTier:   string,
): Promise<RoadBalance> {
  const amount = ACCRUAL[membershipTier] ?? 0
  if (amount === 0) throw new Error(`Unknown or non-accruing tier: ${membershipTier}`)

  const existing = await getRoadBalance(stripeCustomerId)
  const tier: RoadBalance['tier'] = TIER_TO_ROAD_TIER[membershipTier] ?? 'guest'
  const today = new Date().toISOString().slice(0, 10)

  const updated: RoadBalance = existing
    ? {
        ...existing,
        email,
        tier,
        balance: existing.balance + amount,
        history: [...existing.history, { date: today, amount, reason: `Monthly accrual — ${tier}` }],
      }
    : {
        email,
        stripeCustomerId,
        balance: amount,
        tier,
        history: [{ date: today, amount, reason: `Monthly accrual — ${tier}` }],
      }

  await setRoadBalance(updated)
  return updated
}

/**
 * Registers a Solana wallet address for airdrop at mainnet launch.
 */
export async function registerWallet(
  stripeCustomerId: string,
  walletAddress:    string,
): Promise<RoadBalance> {
  const existing = await getRoadBalance(stripeCustomerId)
  if (!existing) throw new Error('No $ROAD balance record found for this customer')

  const updated: RoadBalance = { ...existing, walletAddress }
  await setRoadBalance(updated)
  return updated
}
