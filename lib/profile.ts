/**
 * RoadHouse Capital — Member Profile
 * ────────────────────────────────────
 * Types, constants, and data access for member profiles.
 *
 * Storage: Upstash Redis via lib/road-balance.ts — profile fields
 * are stored as optional fields on the RoadBalance KV record.
 *
 * getProfile(publicKey):
 *   1. wallet:{publicKey} → stripeCustomerId  (reverse index)
 *   2. road:{customerId}  → RoadBalance record
 *   3. Build MemberProfile with graceful fallback at every field.
 *      Unregistered wallet (no KV record) → GUEST tier, 0 balance, empty feed.
 *
 * updateProfile(publicKey, updates):
 *   1. wallet:{publicKey} → stripeCustomerId
 *   2. updateProfileFields(customerId, updates) → merge + KV write
 *   3. Re-fetch full profile
 *
 * TODO (M3): wire credentials via Metaplex getAssetsByOwner()
 *   filter by RoadHouse NFT collection address → Credential[]
 * TODO (M3): wire $ROAD balance from on-chain SPL token account
 *   getTokenAccountsByOwner(connection, publicKey, ROAD_MINT_PUBKEY)
 *   → roadBalance + tier derivation via getTierFromBalance()
 */

import {
  getRoadBalance,
  getCustomerIdByWallet,
  updateProfileFields,
  normaliseTier,
} from '@/lib/road-balance'

// ── Types ─────────────────────────────────────────────────────────────────────

export type MemberTier =
  | 'guest'
  | 'regular'
  | 'ranch-hand'
  | 'partner'
  | 'steward'
  | 'praetor'

export type Guild =
  | 'media'
  | 'builder'
  | 'frontier'
  | 'venture'
  | null

export type Credential = {
  id:          string
  type:        'adventure' | 'event' | 'founding-nft' | 'milestone'
  label:       string
  mintAddress: string
  awardedAt:   string
  imageUrl?:   string
}

export type Contribution = {
  id:        string
  date:      string
  label:     string
  roadEarned: number
  guildId:   Guild
  verified:  boolean
}

export type MemberProfile = {
  publicKey:         string
  alias:             string | null
  bio:               string | null
  avatarUrl:         string | null
  roadBalance:       number
  tier:              MemberTier
  credentials:       Credential[]
  guild:             Guild
  joinedAt:          string
  contributions:     Contribution[]
  experimentsJoined: number
  currentStreak:     number
}

// ── Tier constants ─────────────────────────────────────────────────────────────

export const TIER_THRESHOLDS: Record<MemberTier, number> = {
  guest:        0,
  regular:      100,
  'ranch-hand': 500,
  partner:      2_000,
  steward:      10_000,
  praetor:      50_000,
}

export const TIER_DISPLAY: Record<MemberTier, string> = {
  guest:        'GUEST',
  regular:      'REGULAR',
  'ranch-hand': 'RANCH HAND',
  partner:      'PARTNER',
  steward:      'STEWARD',
  praetor:      'PRAETOR',
}

export function getNextTier(tier: MemberTier): MemberTier | null {
  const order: MemberTier[] = [
    'guest', 'regular', 'ranch-hand', 'partner', 'steward', 'praetor',
  ]
  const idx = order.indexOf(tier)
  return idx < order.length - 1 ? order[idx + 1] : null
}

// ── Data access ───────────────────────────────────────────────────────────────

export async function getProfile(publicKey: string): Promise<MemberProfile> {
  // Step 1: wallet address → stripeCustomerId (reverse index)
  const customerId = await getCustomerIdByWallet(publicKey)

  // Step 2: full RoadBalance record (null if wallet never registered)
  const record = customerId
    ? await getRoadBalance(customerId)
    : null

  // Step 3: build profile — graceful fallback at every field.
  // If record is null (wallet not registered via Stripe yet), all optional
  // fields return defaults. Member sees GUEST tier, 0 balance, empty feed.
  return {
    publicKey,
    alias:       record?.alias     ?? null,
    bio:         record?.bio       ?? null,
    avatarUrl:   record?.avatarUrl ?? null,
    roadBalance: record?.balance   ?? 0,
    tier:        normaliseTier(record?.tier),
    credentials: [],
    // TODO M3: fetch NFT credentials via Metaplex
    //   getAssetsByOwner(publicKey) → filter by RoadHouse collection address
    guild:       (record?.guild ?? null) as Guild,
    joinedAt:    record?.joinedAt ?? new Date().toISOString(),
    contributions: (record?.contributions ?? []).map(c => ({
      id:         c.id,
      date:       c.date,
      label:      c.label,
      roadEarned: c.roadEarned,
      guildId:    c.guildId as Guild,
      verified:   c.verified,
    })),
    experimentsJoined: record?.experimentsJoined ?? 0,
    currentStreak:     record?.currentStreak     ?? 0,
  }
}

export async function updateProfile(
  publicKey: string,
  updates: Partial<Pick<MemberProfile, 'alias' | 'bio' | 'avatarUrl'>>,
): Promise<MemberProfile> {
  const customerId = await getCustomerIdByWallet(publicKey)
  if (!customerId) {
    throw new Error(
      'Wallet not registered — complete membership signup to edit profile'
    )
  }

  await updateProfileFields(customerId, {
    alias:     updates.alias     ?? null,
    bio:       updates.bio       ?? null,
    avatarUrl: updates.avatarUrl ?? null,
  })

  // Re-fetch full profile after update
  return getProfile(publicKey)
}
