import { NextRequest, NextResponse } from 'next/server'
import { stripe, APP_URL } from '@/lib/stripe'
import { getMembershipTier } from '@/lib/membership'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { priceId, discordUserId } = body as { priceId?: string; discordUserId?: string }

    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json({ error: 'priceId required' }, { status: 400 })
    }

    // Resolve tier from priceId for metadata — default to 'regular' if env var
    // lookup fails (Stripe will reject invalid priceIds independently)
    const tier = getMembershipTier(priceId) ?? 'regular'
    const metadata: Record<string, string> = { tier }
    if (discordUserId && /^\d{17,20}$/.test(discordUserId)) {
      // Snowflake format validation — prevents injection into metadata
      metadata.discord_user_id = discordUserId
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      subscription_data: {
        trial_period_days: 7,
        metadata,
      },
      // Redirect to /welcome — guides member through wallet connect step
      success_url: `${APP_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${APP_URL}/#membership`,
      billing_address_collection: 'auto',
      allow_promotion_codes:    true,
      custom_text: {
        submit: {
          message: 'Welcome to the RoadHouse. Your membership tier activates immediately. $ROAD accumulation begins with your first billing cycle.',
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create subscription session'
    console.error(JSON.stringify({ evt: 'subscription.error', error: message }))
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET: Redirect to Stripe Customer Portal for managing subscriptions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customer_id')

    if (!customerId) {
      return NextResponse.json({ error: 'customer_id is required' }, { status: 400 })
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: APP_URL,
    })

    return NextResponse.redirect(portalSession.url)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create portal session'
    console.error(JSON.stringify({ evt: 'portal.error', error: message }))
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
