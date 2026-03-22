/**
 * RoadHouse Capital — Off-Chain $ROAD Balance Tracking
 * ──────────────────────────────────────────────────────
 * Stores member $ROAD balances in Vercel KV (Upstash Redis).
 * Uses the raw REST API — no @vercel/kv package required.
 *
 * KV key schema:
 *   road:{stripeCustomerId}  →  JSON string of RoadBalance
 */

export interface RoadBalance {
  email:           string
  stripeCustomerId: string
  walletAddress?:  string
  balance:         number
  tier:            'guest' | 'regular' | 'ranch' | 'partner' | 'steward' | 'praetor'
  history:         { date: string; amount: number; reason: string }[]
}

export const ACCRUAL: Record<string, number> = {
  regular:   100,
  ranchHand: 500,
  partner:   2000,
}

// ── KV tier key normalisation ─────────────────────────────────────────────────
// getMembershipTier() returns 'ranchHand'; RoadBalance.tier uses 'ranch'
const TIER_TO_ROAD_TIER: Record<string, RoadBalance['tier']> = {
  regular:   'regular',
  ranchHand: 'ranch',
  partner:   'partner',
}

// ── Raw KV REST API helpers ───────────────────────────────────────────────────

function kvHeaders() {
  const token = process.env.KV_REST_API_TOKEN
  if (!token) throw new Error('KV_REST_API_TOKEN is not set')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

function kvBaseUrl() {
  const url = process.env.KV_REST_API_URL
  if (!url) throw new Error('KV_REST_API_URL is not set')
  return url
}

async function kvGet(key: string): Promise<string | null> {
  const res = await fetch(`${kvBaseUrl()}/get/${encodeURIComponent(key)}`, {
    headers: kvHeaders(),
    cache:   'no-store',
  })
  if (!res.ok) throw new Error(`KV GET failed: ${res.status}`)
  const json = await res.json()
  return json.result ?? null
}

async function kvSet(key: string, value: string): Promise<void> {
  const res = await fetch(`${kvBaseUrl()}/set/${encodeURIComponent(key)}`, {
    method:  'POST',
    headers: kvHeaders(),
    body:    JSON.stringify(value),
  })
  if (!res.ok) throw new Error(`KV SET failed: ${res.status}`)
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getRoadBalance(stripeCustomerId: string): Promise<RoadBalance | null> {
  const raw = await kvGet(`road:${stripeCustomerId}`)
  if (!raw) return null
  return JSON.parse(raw) as RoadBalance
}

export async function setRoadBalance(balance: RoadBalance): Promise<void> {
  await kvSet(`road:${balance.stripeCustomerId}`, JSON.stringify(balance))
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

  const tier = TIER_TO_ROAD_TIER[membershipTier] ?? 'guest'
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
 * Returns the updated balance.
 */
export async function accrueMonthlyRoad(
  stripeCustomerId: string,
  email:            string,
  membershipTier:   string,
): Promise<RoadBalance> {
  const amount = ACCRUAL[membershipTier] ?? 0
  if (amount === 0) throw new Error(`Unknown or non-accruing tier: ${membershipTier}`)

  const existing = await getRoadBalance(stripeCustomerId)
  const tier = TIER_TO_ROAD_TIER[membershipTier] ?? 'guest'
  const today = new Date().toISOString().slice(0, 10)

  const updated: RoadBalance = existing
    ? {
        ...existing,
        email,
        tier,
        balance: existing.balance + amount,
        history: [
          ...existing.history,
          { date: today, amount, reason: `Monthly accrual — ${tier}` },
        ],
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
