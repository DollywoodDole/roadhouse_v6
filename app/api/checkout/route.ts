import { NextRequest, NextResponse } from 'next/server'
import { stripe, APP_URL } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { priceId, metadata = {} } = await req.json()

    if (!priceId) {
      return NextResponse.json({ error: 'priceId is required' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        ...metadata,
        source: 'roadhouse-v6',
      },
      success_url: `${APP_URL}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}?checkout=cancelled`,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['CA', 'US', 'GB', 'AU', 'NZ'],
      },
      phone_number_collection: { enabled: false },
      custom_text: {
        submit: {
          message: 'RoadHouse — Where Standards Matter. Ships from Saskatchewan, Canada.',
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session'
    console.error(JSON.stringify({ evt: 'checkout.error', error: message }))
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
