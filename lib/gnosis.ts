/**
 * RoadHouse Capital — DAO Treasury (Gnosis Safe)
 * ───────────────────────────────────────────────
 * Fetches treasury balances from the Gnosis Safe API with a 5-minute KV cache.
 * Falls back to hardcoded defaults when NEXT_PUBLIC_TREASURY_WALLET is unset
 * or the Gnosis API is unreachable.
 *
 * KV key schema (cache layer — Gnosis is external API):
 *   treasury:snapshot  → TreasurySnapshot JSON (cached 5 min)
 *   treasury:votes     → GovernanceVote[] (manual admin entry, seed from TreasuryTab)
 *
 * Uses the same Redis client pattern as lib/api/listings.ts.
 */

import { Redis } from '@upstash/redis'

export type TreasurySnapshot = {
  roadBalance:  number
  solBalance:   number
  lastDeposit:  { amount: number; reason: string; daysAgo: number }
  fetchedAt:    string
}

export type GovernanceVote = {
  id:          string
  title:       string
  yesPercent:  number
  noPercent:   number
  voteCount:   number
  daysLeft:    number
  status:      'open' | 'closed'
  snapshotUrl: string
}

// ── Seed data — mirrors TreasuryTab hardcoded values ──────────────────────

const DEFAULT_SNAPSHOT: TreasurySnapshot = {
  roadBalance:  12450,
  solBalance:   4.2,
  lastDeposit:  { amount: 2100, reason: 'NFT royalties', daysAgo: 3 },
  fetchedAt:    new Date().toISOString(),
}

const SEED_VOTES: GovernanceVote[] = [
  {
    id:          'seed-vote-1',
    title:       'Allocate 500 $ROAD to Media Guild Q2 bounty pool',
    yesPercent:  68,
    noPercent:   32,
    voteCount:   47,
    daysLeft:    3,
    status:      'open',
    snapshotUrl: 'https://snapshot.org',
  },
  {
    id:          'seed-vote-2',
    title:       'Approve Lake Trip deposit subsidy for Ranch Hand+',
    yesPercent:  52,
    noPercent:   48,
    voteCount:   31,
    daysLeft:    1,
    status:      'open',
    snapshotUrl: 'https://snapshot.org',
  },
]

// ── Redis client (lazy — same pattern as lib/api/listings.ts) ─────────────

function getRedis(): Redis {
  const url   = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN not set')
  return new Redis({ url, token })
}

// ── Cache helpers ─────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function isFresh(fetchedAt: string): boolean {
  return Date.now() - new Date(fetchedAt).getTime() < CACHE_TTL_MS
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Returns treasury balances.
 * Cache: reads treasury:snapshot from KV; returns if < 5 min old.
 * Live: attempts Gnosis Safe API if NEXT_PUBLIC_TREASURY_WALLET is set.
 * Fallback: returns hardcoded defaults matching TreasuryTab values.
 * TODO M3: parse Gnosis token balances properly —
 *   filter for $ROAD SPL token + SOL native balance
 */
export async function getTreasurySnapshot(): Promise<TreasurySnapshot> {
  try {
    const redis  = getRedis()
    const cached = await redis.get<TreasurySnapshot>('treasury:snapshot')

    if (cached && isFresh(cached.fetchedAt)) return cached

    const walletAddress = process.env.NEXT_PUBLIC_TREASURY_WALLET
    if (!walletAddress) {
      const snapshot = { ...DEFAULT_SNAPSHOT, fetchedAt: new Date().toISOString() }
      await redis.set('treasury:snapshot', snapshot)
      return snapshot
    }

    // Attempt Gnosis Safe API
    // TODO M3: parse token list — filter for $ROAD SPL + SOL native balance
    const res = await fetch(
      `https://safe-transaction-mainnet.safe.global/api/v1/safes/${walletAddress}/balances/`,
      { next: { revalidate: 300 } },
    )

    if (!res.ok) throw new Error(`Gnosis API ${res.status}`)

    // Minimal parse — full parsing deferred to M3
    const snapshot: TreasurySnapshot = {
      ...DEFAULT_SNAPSHOT,
      fetchedAt: new Date().toISOString(),
    }

    await redis.set('treasury:snapshot', snapshot)
    return snapshot
  } catch {
    // API unavailable or Redis error — return defaults without caching
    return { ...DEFAULT_SNAPSHOT, fetchedAt: new Date().toISOString() }
  }
}

/**
 * Returns active governance votes.
 * Seeds KV with 2 hardcoded proposals from TreasuryTab on first call if missing.
 * TODO M3: wire to Snapshot.org API
 *   GET https://hub.snapshot.org/graphql
 *   query proposals by space ID
 */
export async function getGovernanceVotes(): Promise<GovernanceVote[]> {
  try {
    const redis    = getRedis()
    const existing = await redis.get<GovernanceVote[]>('treasury:votes')
    if (existing) return existing
    await redis.set('treasury:votes', SEED_VOTES)
    return SEED_VOTES
  } catch {
    return SEED_VOTES
  }
}
