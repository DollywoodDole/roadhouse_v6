/**
 * RoadHouse Capital — Membership Tier & Product Type Mapping
 * ────────────────────────────────────────────────────────────
 * Single source of truth for Stripe price ID → tier/product resolution.
 * Used by the webhook handler, Discord role automation, and email routing.
 *
 * All lookups read from process.env at call time so they work correctly
 * in Next.js server components and route handlers.
 */

export type MembershipTier = 'regular' | 'ranchHand' | 'partner'
export type ProductType    = 'membership' | 'merch' | 'event' | 'adventure' | 'sponsorship'

// ── Tier metadata ─────────────────────────────────────────────────────────────

export const TIER_META: Record<MembershipTier, {
  displayName:  string
  price:        string
  roadPerMonth: string
}> = {
  regular:  { displayName: 'Regular',    price: '$19.99/mo CAD',  roadPerMonth: '100 $ROAD'    },
  ranchHand:{ displayName: 'Ranch Hand', price: '$99.99/mo CAD',  roadPerMonth: '500 $ROAD'    },
  partner:  { displayName: 'Partner',    price: '$199.98/mo CAD', roadPerMonth: '2,000 $ROAD'  },
}

// ── Price ID lookup helpers (evaluated at runtime) ────────────────────────────

export function getMembershipTier(priceId: string): MembershipTier | null {
  const {
    NEXT_PUBLIC_STRIPE_SUB_REGULAR,
    NEXT_PUBLIC_STRIPE_SUB_RANCH,
    NEXT_PUBLIC_STRIPE_SUB_PARTNER,
  } = process.env
  if (NEXT_PUBLIC_STRIPE_SUB_REGULAR && priceId === NEXT_PUBLIC_STRIPE_SUB_REGULAR) return 'regular'
  if (NEXT_PUBLIC_STRIPE_SUB_RANCH   && priceId === NEXT_PUBLIC_STRIPE_SUB_RANCH)   return 'ranchHand'
  if (NEXT_PUBLIC_STRIPE_SUB_PARTNER && priceId === NEXT_PUBLIC_STRIPE_SUB_PARTNER) return 'partner'
  return null
}

export type DigitalProductType = 'playbook' | 'toolkit'

export function getDigitalProduct(priceId: string): DigitalProductType | null {
  const { NEXT_PUBLIC_STRIPE_PRICE_PLAYBOOK, NEXT_PUBLIC_STRIPE_PRICE_TOOLKIT } = process.env
  if (NEXT_PUBLIC_STRIPE_PRICE_PLAYBOOK && priceId === NEXT_PUBLIC_STRIPE_PRICE_PLAYBOOK) return 'playbook'
  if (NEXT_PUBLIC_STRIPE_PRICE_TOOLKIT  && priceId === NEXT_PUBLIC_STRIPE_PRICE_TOOLKIT)  return 'toolkit'
  return null
}

export function getProductType(priceId: string): ProductType | null {
  if (getMembershipTier(priceId))  return 'membership'
  if (getDigitalProduct(priceId))  return 'merch'  // digital products routed as merch for fulfillment email

  const merch = new Set([
    process.env.NEXT_PUBLIC_STRIPE_PRICE_TEE,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_HAT,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_HOODIE,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_STICKERS,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_GLASS,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_PHONE,
  ])
  if (merch.has(priceId)) return 'merch'

  const events = new Set([
    process.env.NEXT_PUBLIC_STRIPE_PRICE_SKMT,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_SUMMIT,
  ])
  if (events.has(priceId)) return 'event'

  const adventures = new Set([
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ADV_LAKE,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ADV_SKI,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ADV_MED,
  ])
  if (adventures.has(priceId)) return 'adventure'

  const sponsorships = new Set([
    process.env.NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_TB,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_FR,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_PR,
  ])
  if (sponsorships.has(priceId)) return 'sponsorship'

  return null
}

export function getAdventureName(priceId: string): string {
  const {
    NEXT_PUBLIC_STRIPE_PRICE_ADV_LAKE,
    NEXT_PUBLIC_STRIPE_PRICE_ADV_SKI,
    NEXT_PUBLIC_STRIPE_PRICE_ADV_MED,
  } = process.env
  if (priceId === NEXT_PUBLIC_STRIPE_PRICE_ADV_LAKE) return 'Lake Trip — BC/AB (Summer 2026) · Up to 5 people'
  if (priceId === NEXT_PUBLIC_STRIPE_PRICE_ADV_SKI)  return 'Ski Trip — Panorama or Whitefish (Winter 2026/27) · Up to 4 people'
  if (priceId === NEXT_PUBLIC_STRIPE_PRICE_ADV_MED)  return 'Mediterranean (Summer 2027) · 2 people per pass'
  return 'Adventure'
}

export function getSponsorshipName(priceId: string): string {
  const {
    NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_TB,
    NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_FR,
    NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_PR,
  } = process.env
  if (priceId === NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_TB) return 'Trail Blazer'
  if (priceId === NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_FR) return 'Frontier'
  if (priceId === NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_PR) return 'Praetor'
  return 'Sponsorship'
}
