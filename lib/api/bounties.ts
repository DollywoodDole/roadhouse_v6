/**
 * RoadHouse Capital — Guild Bounty Board
 * ───────────────────────────────────────
 * Stores active bounties + member claim history in Upstash Redis.
 * Uses the same Redis client pattern as lib/api/listings.ts.
 *
 * KV key schema:
 *   bounties:active           → Bounty[] (available bounties)
 *   bounties:claimed:{pubKey} → ClaimedBounty[] (member history, max 50)
 */

import { Redis } from '@upstash/redis'
import { randomUUID } from 'crypto'

export type Bounty = {
  id:         string
  guildId:    string
  label:      string
  roadReward: number
  weekNumber: number
  status:     'open' | 'closed'
}

export type ClaimedBounty = {
  id:        string
  bountyId:  string
  publicKey: string
  claimedAt: string
  status:    'pending' | 'verified' | 'rejected'
}

// ── Seed data — mirrors GuildTab hardcoded bounties ────────────────────────
// weekNumber uses the same live calc as GuildTab: clamped 1–8 from April 1 2026

function currentWeekNumber(): number {
  const sprintStart = new Date('2026-04-01').getTime()
  const rawWeek = Math.ceil((Date.now() - sprintStart) / (7 * 24 * 60 * 60 * 1000))
  return Math.max(1, Math.min(8, rawWeek))
}

const SEED_BOUNTIES: Bounty[] = [
  {
    id:         'seed-b-1',
    guildId:    'media',
    label:      "Clip 3 VOD highlights from this week's stream",
    roadReward: 200,
    weekNumber: currentWeekNumber(),
    status:     'open',
  },
  {
    id:         'seed-b-2',
    guildId:    'media',
    label:      'Translate 1 post to French or Spanish',
    roadReward: 150,
    weekNumber: currentWeekNumber(),
    status:     'open',
  },
  {
    id:         'seed-b-3',
    guildId:    'media',
    label:      'Submit 1 TikTok script draft',
    roadReward: 100,
    weekNumber: currentWeekNumber(),
    status:     'open',
  },
]

// ── Redis client (lazy — same pattern as lib/api/listings.ts) ─────────────

function getRedis(): Redis {
  const url   = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN not set')
  return new Redis({ url, token })
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Returns active bounties filtered by guildId.
 * Seeds KV with 3 hardcoded Media Guild bounties on first call if key is missing.
 * TODO M3: admin route to post new bounties per guild
 */
export async function getActiveBounties(guildId: string): Promise<Bounty[]> {
  const redis    = getRedis()
  const existing = await redis.get<Bounty[]>('bounties:active')

  if (!existing) {
    await redis.set('bounties:active', SEED_BOUNTIES)
    return SEED_BOUNTIES.filter(b => b.guildId === guildId && b.status === 'open')
  }

  return existing.filter(b => b.guildId === guildId && b.status === 'open')
}

/**
 * Claims a bounty for a member.
 * Throws 'Already claimed' if member has already claimed this bounty.
 * Prepends to claim history, caps at 50.
 * Returns the new claim record (status: 'pending').
 * TODO M3: steward verification flow to mark 'verified'
 *   and trigger addContribution() + $ROAD credit
 */
export async function claimBounty(
  publicKey: string,
  bountyId:  string,
): Promise<ClaimedBounty> {
  const redis    = getRedis()
  const claimKey = `bounties:claimed:${publicKey}`
  const existing = await redis.get<ClaimedBounty[]>(claimKey) ?? []

  if (existing.some(c => c.bountyId === bountyId)) {
    throw new Error('Already claimed')
  }

  const claim: ClaimedBounty = {
    id:        randomUUID(),
    bountyId,
    publicKey,
    claimedAt: new Date().toISOString(),
    status:    'pending',
  }

  await redis.set(claimKey, [claim, ...existing].slice(0, 50))
  return claim
}
