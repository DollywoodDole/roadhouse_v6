import { NextRequest, NextResponse } from 'next/server'
import { stripe, APP_URL } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { priceId, customerEmail } = await req.json()

    if (!priceId) {
      return NextResponse.json({ error: 'priceId is required' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      metadata: {
        source: 'roadhouse-v6',
        type: 'membership',
      },
      subscription_data: {
        metadata: {
          source: 'roadhouse-membership',
          platform: 'roadhouse-v6',
        },
        trial_period_days: 7, // 7-day free trial for new members
      },
      success_url: `${APP_URL}?membership=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}?membership=cancelled`,
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      custom_text: {
        submit: {
          message: 'Welcome to the RoadHouse. Your $ROAD tokens will be credited within 24 hours of payment confirmation.',
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe subscription error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to create subscription session' },
      { status: 500 }
    )
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
  } catch (err: any) {
    console.error('Stripe portal error:', err)
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}
