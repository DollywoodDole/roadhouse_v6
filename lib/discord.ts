/**
 * RoadHouse Capital — Discord Role Automation
 * ─────────────────────────────────────────────
 * Grants and revokes Discord roles when Stripe events fire.
 * Called from the webhook route — server-side only.
 *
 * Requires: DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, and role IDs in .env.local
 */

import { requireEnv, optionalEnv } from '@/lib/env'

type DiscordMembership = 'regular' | 'ranch-hand' | 'partner'

const ROLE_MAP: Record<DiscordMembership, string> = {
  regular:      optionalEnv('DISCORD_ROLE_REGULAR'),
  'ranch-hand': optionalEnv('DISCORD_ROLE_RANCH_HAND'),
  partner:      optionalEnv('DISCORD_ROLE_PARTNER'),
}

// Map Stripe price IDs to membership tiers
// Keys are partial matches — Stripe sub metadata carries priceId
function getTierFromPriceId(priceId: string): DiscordMembership | null {
  const { NEXT_PUBLIC_STRIPE_SUB_REGULAR, NEXT_PUBLIC_STRIPE_SUB_RANCH, NEXT_PUBLIC_STRIPE_SUB_PARTNER } = process.env
  if (NEXT_PUBLIC_STRIPE_SUB_REGULAR && priceId === NEXT_PUBLIC_STRIPE_SUB_REGULAR) return 'regular'
  if (NEXT_PUBLIC_STRIPE_SUB_RANCH && priceId === NEXT_PUBLIC_STRIPE_SUB_RANCH) return 'ranch-hand'
  if (NEXT_PUBLIC_STRIPE_SUB_PARTNER && priceId === NEXT_PUBLIC_STRIPE_SUB_PARTNER) return 'partner'
  return null
}

// ── Discord API helper ────────────────────────────────────────────────────────

async function discordRequest(path: string, method: string, body?: object) {
  let token: string
  try {
    token = requireEnv('DISCORD_BOT_TOKEN')
  } catch {
    console.warn('[Discord] DISCORD_BOT_TOKEN not set — skipping role action')
    return null
  }

  const res = await fetch(`https://discord.com/api/v10${path}`, {
    method,
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Discord API error ${res.status}: ${err}`)
  }

  return res.status === 204 ? null : res.json()
}

// ── Look up Discord user by email via Stripe customer ─────────────────────────
// Discord doesn't allow lookup by email — we store the Discord user ID in
// Stripe customer metadata at onboarding time (set DISCORD_USER_ID in metadata).

function getDiscordUserId(stripeMetadata: Record<string, string>): string | null {
  return stripeMetadata?.discord_user_id ?? null
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function grantMembershipRole(
  discordUserId: string,
  tier: DiscordMembership
): Promise<void> {
  const guildId = optionalEnv('DISCORD_GUILD_ID')
  const roleId = ROLE_MAP[tier]

  if (!guildId || !roleId) {
    console.warn(`[Discord] Guild or role not configured for tier "${tier}" — skipping`)
    return
  }

  await discordRequest(
    `/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    'PUT'
  )

  console.log(`[Discord] Granted role ${tier} to user ${discordUserId}`)
}

export async function revokeMembershipRole(
  discordUserId: string,
  tier: DiscordMembership
): Promise<void> {
  const guildId = optionalEnv('DISCORD_GUILD_ID')
  const roleId = ROLE_MAP[tier]

  if (!guildId || !roleId) {
    console.warn(`[Discord] Guild or role not configured for tier "${tier}" — skipping`)
    return
  }

  await discordRequest(
    `/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
    'DELETE'
  )

  console.log(`[Discord] Revoked role ${tier} from user ${discordUserId}`)
}

export async function revokeAllMembershipRoles(discordUserId: string): Promise<void> {
  const tiers: DiscordMembership[] = ['regular', 'ranch-hand', 'partner']
  await Promise.allSettled(tiers.map(t => revokeMembershipRole(discordUserId, t)))
  console.log(`[Discord] Revoked all membership roles from user ${discordUserId}`)
}

// ── Webhook event handlers ────────────────────────────────────────────────────

export async function handleSubscriptionCreated(subscription: any): Promise<void> {
  const discordUserId = getDiscordUserId(subscription.metadata ?? {})
  if (!discordUserId) {
    console.warn('[Discord] No discord_user_id in subscription metadata — cannot grant role')
    return
  }

  const priceId = subscription.items?.data?.[0]?.price?.id
  if (!priceId) return

  const tier = getTierFromPriceId(priceId)
  if (!tier) {
    console.warn(`[Discord] Unknown tier for priceId ${priceId}`)
    return
  }

  await grantMembershipRole(discordUserId, tier)
}

export async function handleSubscriptionCancelled(subscription: any): Promise<void> {
  const discordUserId = getDiscordUserId(subscription.metadata ?? {})
  if (!discordUserId) return

  await revokeAllMembershipRoles(discordUserId)
}

export async function handleSubscriptionUpdated(
  oldSub: any,
  newSub: any
): Promise<void> {
  const discordUserId = getDiscordUserId(newSub.metadata ?? {})
  if (!discordUserId) return

  const oldPriceId = oldSub.items?.data?.[0]?.price?.id
  const newPriceId = newSub.items?.data?.[0]?.price?.id

  if (oldPriceId === newPriceId) return // No tier change

  const oldTier = oldPriceId ? getTierFromPriceId(oldPriceId) : null
  const newTier = newPriceId ? getTierFromPriceId(newPriceId) : null

  if (oldTier) await revokeMembershipRole(discordUserId, oldTier)
  if (newTier) await grantMembershipRole(discordUserId, newTier)
}
