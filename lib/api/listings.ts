/**
 * RoadHouse Capital — Member Marketplace Listings
 * ─────────────────────────────────────────────────
 * Stores Offering / Seeking listings in Upstash Redis.
 * Uses the same Redis client pattern as lib/road-balance.ts.
 *
 * KV key schema:
 *   listings:offering  →  Listing[] JSON (newest first, max 100)
 *   listings:seeking   →  Listing[] JSON (newest first, max 100)
 */

import { Redis } from '@upstash/redis'
const randomUUID = () => globalThis.crypto.randomUUID()

export type Listing = {
  id:           string
  type:         'offering' | 'seeking'
  category:     string
  walletAlias:  string
  description:  string
  tierRequired: 'regular' | 'ranch-hand'
  createdAt:    string
}

// ── Seed data — mirrors EconomyTab hardcoded listings ─────────────────────────
// Used to populate KV on first call if keys are empty/missing.

const SEED_LISTINGS: { offering: Listing[]; seeking: Listing[] } = {
  offering: [
    {
      id: 'seed-o-1', type: 'offering', category: 'VIDEO EDITING',
      walletAlias:  '0xAB...3F',
      description:  '30-min Kick clip turnaround, 48hr',
      tierRequired: 'ranch-hand', createdAt: '2026-03-01T00:00:00.000Z',
    },
    {
      id: 'seed-o-2', type: 'offering', category: 'DESIGN',
      walletAlias:  '0xCD...7A',
      description:  'Thumbnail + overlay package',
      tierRequired: 'ranch-hand', createdAt: '2026-03-01T00:00:00.000Z',
    },
    {
      id: 'seed-o-3', type: 'offering', category: 'TRANSLATION',
      walletAlias:  '0xEF...2B',
      description:  'EN→FR, tech/gaming content',
      tierRequired: 'regular', createdAt: '2026-03-01T00:00:00.000Z',
    },
  ],
  seeking: [
    {
      id: 'seed-s-1', type: 'seeking', category: 'DEV',
      walletAlias:  '0x12...9C',
      description:  'Need Solana wallet integration review',
      tierRequired: 'ranch-hand', createdAt: '2026-03-01T00:00:00.000Z',
    },
    {
      id: 'seed-s-2', type: 'seeking', category: 'EVENTS',
      walletAlias:  '0x34...1D',
      description:  'Looking for SK-based event host',
      tierRequired: 'regular', createdAt: '2026-03-01T00:00:00.000Z',
    },
    {
      id: 'seed-s-3', type: 'seeking', category: 'CONTENT',
      walletAlias:  '0x56...8E',
      description:  'VOD clip assistant, 5hrs/week',
      tierRequired: 'regular', createdAt: '2026-03-01T00:00:00.000Z',
    },
  ],
}

// ── Redis client (lazy — same pattern as lib/road-balance.ts) ─────────────────

function getRedis(): Redis {
  const url   = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN not set')
  return new Redis({ url, token })
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns all marketplace listings split by type.
 * Seeds KV with hardcoded sample data on first call if either key is missing.
 * Returns { offering: [], seeking: [] } on any Redis error.
 */
export async function getListings(): Promise<{ offering: Listing[]; seeking: Listing[] }> {
  try {
    const redis = getRedis()
    const [rawOffering, rawSeeking] = await Promise.all([
      redis.get<Listing[]>('listings:offering'),
      redis.get<Listing[]>('listings:seeking'),
    ])

    // Seed missing keys — write only what's absent, return seeded data immediately
    if (!rawOffering || !rawSeeking) {
      await Promise.all([
        !rawOffering ? redis.set('listings:offering', SEED_LISTINGS.offering) : Promise.resolve(),
        !rawSeeking  ? redis.set('listings:seeking',  SEED_LISTINGS.seeking)  : Promise.resolve(),
      ])
      return {
        offering: rawOffering ?? SEED_LISTINGS.offering,
        seeking:  rawSeeking  ?? SEED_LISTINGS.seeking,
      }
    }

    return { offering: rawOffering, seeking: rawSeeking }
    // TODO M3: filter by tier, paginate, sort by createdAt desc
  } catch {
    return { offering: [], seeking: [] }
  }
}

/**
 * Creates a new listing and prepends it to the relevant KV array.
 * Caps the array at 100 entries (newest first).
 */
export async function createListing(
  data: Omit<Listing, 'id' | 'createdAt'>,
): Promise<Listing> {
  const listing: Listing = {
    ...data,
    id:        randomUUID(),
    createdAt: new Date().toISOString(),
  }

  const key     = `listings:${data.type}` as const
  const redis   = getRedis()
  const existing = await redis.get<Listing[]>(key) ?? []
  await redis.set(key, [listing, ...existing].slice(0, 100))

  return listing
  // TODO M3: auth check — verify walletAlias matches connected wallet before writing
  // TODO M3: tier check — verify caller meets tierRequired
}
