import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { requireEnv } from '@/lib/env'
import {
  handleSubscriptionCreated,
  handleSubscriptionCancelled,
  handleSubscriptionUpdated,
} from '@/lib/discord'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  let webhookSecret: string
  try {
    webhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET')
  } catch {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as any
        console.log('[webhook] Checkout completed:', session.id, '| mode:', session.mode)
        // If this was a subscription checkout, subscription events will follow
        // If one-time (merch/event), handle fulfillment here
        if (session.mode === 'payment') {
          // TODO: Trigger physical fulfillment / event confirmation email
        }
        break
      }

      case 'customer.subscription.created': {
        const sub = event.data.object as any
        console.log('[webhook] Subscription created:', sub.id)
        await handleSubscriptionCreated(sub)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as any
        const prevSub = event.data.previous_attributes as any
        console.log('[webhook] Subscription updated:', sub.id, sub.status)
        if (sub.status === 'active') {
          await handleSubscriptionUpdated(prevSub, sub)
        } else if (['canceled', 'unpaid', 'past_due'].includes(sub.status)) {
          await handleSubscriptionCancelled(sub)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as any
        console.log('[webhook] Subscription deleted:', sub.id)
        await handleSubscriptionCancelled(sub)
        break
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object as any
        console.log('[webhook] Payment failed:', inv.id, '| attempt:', inv.attempt_count)
        // Grace period: revoke after 3 failed attempts
        if (inv.attempt_count >= 3) {
          const subId = inv.subscription
          if (subId) {
            const sub = await stripe.subscriptions.retrieve(subId)
            await handleSubscriptionCancelled(sub)
          }
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const inv = event.data.object as any
        console.log('[webhook] Payment succeeded:', inv.id)
        // $ROAD token accrual hook — add when on-chain distribution is ready
        // TODO: creditRoadTokens(inv.customer_email, inv.subscription)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('[webhook] Handler error:', err)
    // Return 200 anyway — prevents Stripe from retrying on handler errors
    // Log to monitoring instead
    return NextResponse.json({ received: true, warning: 'Handler error — check logs' })
  }

  return NextResponse.json({ received: true })
}
