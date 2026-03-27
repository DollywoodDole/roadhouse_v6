/**
 * RoadHouse Capital — Member Portal Session
 * ──────────────────────────────────────────
 * POST /api/portal/session
 * Body: { email: string }
 *
 * Looks up the Stripe customer by email, finds their active subscription,
 * creates a Stripe Billing Portal session, and returns member data + portal URL.
 * No auth token required — Stripe's portal is email-gated on their end.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe, APP_URL } from '@/lib/stripe'
import { getMembershipTier, TIER_META } from '@/lib/membership'
import { getRoadBalance } from '@/lib/road-balance'

export async function POST(req: NextRequest) {
  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = body.email?.toLowerCase().trim()
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Find Stripe customer by email
  const customers = await stripe.customers.list({ email, limit: 5 })
  if (customers.data.length === 0) {
    return NextResponse.json(
      { error: 'No membership found for that email. Subscribe at roadhouse.capital.' },
      { status: 404 }
    )
  }

  const customer = customers.data[0]

  // Find active subscription
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status:   'active',
    limit:    1,
    expand:   ['data.items.data.price'],
  })

  const sub = subscriptions.data[0] ?? null

  let tier     = null
  let tierMeta = null
  let roadBalance = 0

  if (sub) {
    const priceId = sub.items.data[0]?.price?.id
    tier     = priceId ? getMembershipTier(priceId) : null
    tierMeta = tier ? TIER_META[tier] : null

    // Try KV first — fall back to subscription-age estimate if not provisioned
    try {
      const kvRecord = await getRoadBalance(customer.id)
      if (kvRecord) {
        roadBalance = kvRecord.balance
      } else if (tier && tierMeta) {
        const monthsActive = Math.floor(
          (Date.now() - sub.start_date * 1000) / (1000 * 60 * 60 * 24 * 30)
        )
        const rateMap: Record<string, number> = { regular: 100, 'ranch-hand': 500, partner: 2000 }
        roadBalance = (monthsActive + 1) * (rateMap[tier] ?? 0)
      }
    } catch {
      // KV not provisioned — fall back to estimate
      if (tier && tierMeta) {
        const monthsActive = Math.floor(
          (Date.now() - sub.start_date * 1000) / (1000 * 60 * 60 * 24 * 30)
        )
        const rateMap: Record<string, number> = { regular: 100, 'ranch-hand': 500, partner: 2000 }
        roadBalance = (monthsActive + 1) * (rateMap[tier] ?? 0)
      }
    }
  }

  // Create Stripe Billing Portal session
  let portalUrl: string | null = null
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer:   customer.id,
      return_url: `${APP_URL}/portal`,
    })
    portalUrl = session.url
  } catch (err) {
    // Non-fatal — portal may not be configured yet
    console.warn(JSON.stringify({ evt: 'portal.session_create_failed', error: String(err) }))
  }

  return NextResponse.json({
    customer: {
      id:        customer.id,
      email:     customer.email,
      name:      customer.name,
      createdAt: customer.created,
    },
    subscription: sub ? {
      id:        sub.id,
      status:    sub.status,
      startDate: sub.start_date,
      currentPeriodEnd: (sub as any).current_period_end,
    } : null,
    tier,
    tierMeta,
    roadBalance,
    portalUrl,
  })
}
