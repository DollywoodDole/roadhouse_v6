import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getRoadBalance } from '@/lib/road-balance'

/**
 * GET /api/checkout/session?session_id=cs_...
 *
 * Called by /welcome page immediately after Stripe redirect.
 * Returns enough member context to render the post-checkout landing
 * without requiring the member to authenticate again.
 *
 * Security: session_id is a one-time Stripe token — only the redirected
 * browser possesses it. No additional auth required here.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId || !/^cs_(test_|live_)?[A-Za-z0-9]{20,}$/.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })

    if (session.payment_status === 'unpaid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 })
    }

    const customerId =
      typeof session.customer === 'string'
        ? session.customer
        : (session.customer as { id?: string } | null)?.id

    if (!customerId) {
      return NextResponse.json({ error: 'No customer on session' }, { status: 404 })
    }

    const balance = await getRoadBalance(customerId)

    // RoadBalance.tier uses 'ranch' internally; normalise for display
    const rawTier = balance?.tier ?? (session.metadata?.tier as string) ?? 'regular'

    const displayName: Record<string, string> = {
      regular:      'Regular',
      ranch:        'Ranch Hand',
      'ranch-hand': 'Ranch Hand',
      partner:      'Partner',
      steward:      'Steward',
      praetor:      'Praetor',
    }

    // Canonical tier string for welcome page logic (matches TIER_ICON keys)
    const canonicalTier = rawTier === 'ranch' ? 'ranch-hand' : rawTier

    return NextResponse.json({
      customerId,
      email:        session.customer_details?.email ?? balance?.email ?? null,
      tier:         canonicalTier,
      tierLabel:    displayName[rawTier] ?? rawTier,
      roadBalance:  balance?.balance ?? 0,
      walletLinked: !!balance?.walletAddress,
      portalEmail:  session.customer_details?.email ?? null,
    })
  } catch (err) {
    console.error(JSON.stringify({ evt: 'checkout.session.error', error: String(err) }))
    return NextResponse.json({ error: 'Session lookup failed' }, { status: 500 })
  }
}
