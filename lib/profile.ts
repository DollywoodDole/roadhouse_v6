/**
 * RoadHouse Capital — Member Profile
 * ────────────────────────────────────
 * Types, constants, and data access for member profiles.
 *
 * Current state: stub data only.
 * TODO (session 3): replace getProfile with:
 *   1. getTokenAccountsByOwner(connection, publicKey, ROAD_MINT_PUBKEY)
 *      from lib/solana.ts → roadBalance + tier
 *   2. supabase.from('profiles').select().eq('public_key', publicKey)
 *      → alias, bio, avatarUrl, guild, joinedAt, contributions
 * TODO (session 3): replace updateProfile with:
 *   supabase.from('profiles').upsert({
 *     public_key: publicKey, ...updates, updated_at: new Date()
 *   })
 */

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

// ── Stub data ──────────────────────────────────────────────────────────────────

const STUB_PROFILE: Omit<MemberProfile, 'publicKey'> = {
  alias:   'DollywoodDole',
  bio:     'Building RoadHouse in public. Saskatchewan.',
  avatarUrl: null,
  roadBalance: 800,
  tier:    'ranch-hand',
  credentials: [
    {
      id:          '1',
      type:        'founding-nft',
      label:       'Founding Member',
      mintAddress: 'DEMO_MINT_1',
      awardedAt:   '2026-03-01',
    },
  ],
  guild:    'media',
  joinedAt: '2026-03-01',
  contributions: [
    { id: '1', date: '2026-03-24', label: 'Guild content submission',     roadEarned: 200, guildId: 'media',    verified: true },
    { id: '2', date: '2026-03-22', label: 'Referral — new member joined', roadEarned: 100, guildId: 'media',    verified: true },
    { id: '3', date: '2026-03-20', label: 'TikTok script submitted',      roadEarned: 100, guildId: 'media',    verified: true },
    { id: '4', date: '2026-03-18', label: 'Event attendance verified',    roadEarned: 150, guildId: 'frontier', verified: true },
    { id: '5', date: '2026-03-15', label: 'Onboarding complete',          roadEarned: 50,  guildId: null,       verified: true },
  ],
  experimentsJoined: 1,
  currentStreak:     4,
}

// ── Data access ───────────────────────────────────────────────────────────────

export async function getProfile(publicKey: string): Promise<MemberProfile> {
  return { publicKey, ...STUB_PROFILE }
}

export async function updateProfile(
  publicKey: string,
  updates: Partial<Pick<MemberProfile, 'alias' | 'bio' | 'avatarUrl'>>,
): Promise<MemberProfile> {
  console.log('[profile] updateProfile stub — updates received:', { publicKey, updates })
  return {
    publicKey,
    ...STUB_PROFILE,
    alias:     updates.alias     !== undefined ? updates.alias     : STUB_PROFILE.alias,
    bio:       updates.bio       !== undefined ? updates.bio       : STUB_PROFILE.bio,
    avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : STUB_PROFILE.avatarUrl,
  }
}
