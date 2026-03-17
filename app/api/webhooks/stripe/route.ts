/**
 * RoadHouse Capital — Stripe Webhook Handler
 * ────────────────────────────────────────────
 * Handles all Stripe lifecycle events. Always returns 200 to prevent retries
 * on internal handler errors. Signature verified on every request.
 *
 * Idempotency: module-level Set guards against duplicate events within a single
 * Vercel function instance. For true cross-instance idempotency, replace the
 * Set with Vercel KV:
 *   import { kv } from '@vercel/kv'
 *   const isNew = await kv.set(`evt:${event.id}`, 1, { nx: true, ex: 86400 })
 *   if (!isNew) return NextResponse.json({ received: true, duplicate: true })
 *
 * Stripe dashboard: point webhook endpoint at
 *   https://roadhouse.capital/api/webhooks/stripe
 * Events to enable: checkout.session.completed, customer.subscription.updated,
 *   customer.subscription.deleted, invoice.payment_failed
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, APP_URL } from '@/lib/stripe'
import { requireEnv } from '@/lib/env'
import { getMembershipTier, getProductType, getSponsorshipName } from '@/lib/membership'
import {
  grantMembershipRole,
  handleSubscriptionUpdated,
  handleSubscriptionCancelled,
} from '@/lib/discord'
import {
  sendWelcomeEmail,
  sendMerchFulfillmentEmail,
  sendMerchConfirmationEmail,
  sendEventConfirmationEmail,
  sendSponsorAlertEmail,
  sendSponsorAutoReply,
  sendOffboardingEmail,
  sendPaymentFailedEmail,
} from '@/lib/email'

// ── Idempotency guard ─────────────────────────────────────────────────────────

const _processed = new Set<string>()

function markProcessed(eventId: string): boolean {
  if (_processed.has(eventId)) return false
  _processed.add(eventId)
  // Keep memory bounded to ~1000 events per instance
  if (_processed.size > 1000) {
    const oldest = _processed.values().next().value
    if (oldest) _processed.delete(oldest)
  }
  return true
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  // Signature verification
  let webhookSecret: string
  try {
    webhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET')
  } catch {
    console.error(JSON.stringify({ evt: 'webhook.config_error', error: 'STRIPE_WEBHOOK_SECRET not set' }))
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error(JSON.stringify({ evt: 'webhook.sig_failed', error: err.message }))
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency check
  if (!markProcessed(event.id)) {
    console.log(JSON.stringify({ evt: 'webhook.duplicate', eventId: event.id, type: event.type }))
    return NextResponse.json({ received: true, duplicate: true })
  }

  console.log(JSON.stringify({ evt: 'webhook.received', eventId: event.id, type: event.type }))

  // Dispatch — always return 200 even if handler throws
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await onSubscriptionUpdated(event)
        break

      case 'customer.subscription.deleted':
        await onSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_failed':
        await onPaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        break
    }
  } catch (err) {
    // Log but do NOT re-throw — Stripe must receive 200 or it retries
    console.error(JSON.stringify({
      evt:     'webhook.handler_error',
      eventId: event.id,
      type:    event.type,
      error:   String(err),
    }))
  }

  return NextResponse.json({ received: true })
}

// ── checkout.session.completed ────────────────────────────────────────────────

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Re-fetch with line_items expanded — not included in webhook payload by default
  const expanded = await (stripe as any).checkout.sessions.retrieve(session.id, {
    expand: ['line_items.data.price'],
  })

  const priceId = expanded.line_items?.data?.[0]?.price?.id as string | undefined
  if (!priceId) {
    console.warn(JSON.stringify({ evt: 'checkout.no_price_id', sessionId: session.id }))
    return
  }

  const productType    = getProductType(priceId)
  const customerEmail  = session.customer_details?.email  ?? ''
  const customerName   = session.customer_details?.name   ?? ''
  const customerId     = typeof session.customer === 'string' ? session.customer : ''

  console.log(JSON.stringify({
    evt:          'checkout.completed',
    sessionId:    session.id,
    mode:         session.mode,
    productType,
    priceId,
    customerEmail,
  }))

  // ── Subscription checkout (memberships & sponsorships) ─────────────────────
  if (session.mode === 'subscription') {
    const tier = getMembershipTier(priceId)

    // Assign Discord role if discord_user_id was passed in session metadata
    // (also handled by customer.subscription.created as a fallback)
    const discordUserId = session.metadata?.discord_user_id
    if (discordUserId && tier) {
      await grantMembershipRole(discordUserId, tier)
    }

    if (productType === 'membership' && tier && customerEmail) {
      await sendWelcomeEmail({ customerEmail, customerName, tier })
    }

    if (productType === 'sponsorship' && customerEmail) {
      const subscriptionId = typeof expanded.subscription === 'string'
        ? expanded.subscription
        : expanded.subscription?.id ?? session.id
      const packageName = getSponsorshipName(priceId)

      await Promise.all([
        sendSponsorAlertEmail({
          sponsorEmail:   customerEmail,
          sponsorName:    customerName,
          packageName,
          subscriptionId,
        }),
        sendSponsorAutoReply({
          sponsorEmail: customerEmail,
          sponsorName:  customerName,
          packageName,
        }),
      ])
    }
  }

  // ── One-time payment checkout (merch & events) ─────────────────────────────
  if (session.mode === 'payment') {
    const itemName       = session.metadata?.item    ?? expanded.line_items?.data?.[0]?.description ?? 'Item'
    const size           = session.metadata?.size    ?? 'N/A'
    const shippingAddr   = formatAddress(session.shipping_details)

    if (productType === 'merch' && customerEmail) {
      await Promise.all([
        sendMerchFulfillmentEmail({
          customerName,
          customerEmail,
          itemName,
          size,
          sessionId:       session.id,
          shippingAddress: shippingAddr,
        }),
        sendMerchConfirmationEmail({
          customerEmail,
          customerName,
          itemName,
          size,
          sessionId: session.id,
        }),
      ])
    }

    if (productType === 'event' && customerEmail) {
      await sendEventConfirmationEmail({
        customerEmail,
        customerName,
        eventName: itemName,
        sessionId: session.id,
      })
    }
  }
}

// ── customer.subscription.updated ────────────────────────────────────────────

async function onSubscriptionUpdated(event: Stripe.Event) {
  const newSub   = event.data.object as Stripe.Subscription
  const prevAttrs = event.data.previous_attributes as Partial<Stripe.Subscription> | null

  console.log(JSON.stringify({
    evt:    'subscription.updated',
    subId:  newSub.id,
    status: newSub.status,
  }))

  if (newSub.status === 'active') {
    // Delegates role swap to discord.ts (revokes old, grants new)
    await handleSubscriptionUpdated(prevAttrs ?? {}, newSub)

    // Send welcome email if the tier actually changed
    const newPriceId = newSub.items.data[0]?.price?.id
    const prevItems  = (prevAttrs as any)?.items?.data
    const oldPriceId = prevItems?.[0]?.price?.id

    if (newPriceId && oldPriceId && newPriceId !== oldPriceId) {
      const newTier = getMembershipTier(newPriceId)
      if (newTier) {
        const [email, name] = await Promise.all([
          resolveCustomerEmail(newSub.customer),
          resolveCustomerName(newSub.customer),
        ])
        if (email) await sendWelcomeEmail({ customerEmail: email, customerName: name, tier: newTier })
      }
    }
  } else if (['canceled', 'unpaid', 'past_due'].includes(newSub.status)) {
    await handleSubscriptionCancelled(newSub)
  }
}

// ── customer.subscription.deleted ────────────────────────────────────────────

async function onSubscriptionDeleted(sub: Stripe.Subscription) {
  console.log(JSON.stringify({ evt: 'subscription.deleted', subId: sub.id }))

  await handleSubscriptionCancelled(sub)

  const priceId = sub.items.data[0]?.price?.id
  const tier    = priceId ? getMembershipTier(priceId) : null
  const [email, name] = await Promise.all([
    resolveCustomerEmail(sub.customer),
    resolveCustomerName(sub.customer),
  ])

  if (tier && email) {
    await sendOffboardingEmail({ customerEmail: email, customerName: name, tier })
  }
}

// ── invoice.payment_failed ────────────────────────────────────────────────────

async function onPaymentFailed(invoice: Stripe.Invoice) {
  console.log(JSON.stringify({
    evt:     'invoice.payment_failed',
    invoiceId: invoice.id,
    attempt:   invoice.attempt_count,
  }))

  const [email, name] = await Promise.all([
    resolveCustomerEmail(invoice.customer),
    resolveCustomerName(invoice.customer),
  ])
  if (!email) return

  // Create a Stripe Billing Portal session so customer can update their card
  let portalUrl = `${APP_URL}/portal`
  try {
    const customerId = typeof invoice.customer === 'string'
      ? invoice.customer
      : (invoice.customer as any)?.id
    if (customerId) {
      const portal = await (stripe as any).billingPortal.sessions.create({
        customer:   customerId,
        return_url: APP_URL,
      })
      portalUrl = portal.url
    }
  } catch (err) {
    console.warn(JSON.stringify({ evt: 'portal.create_failed', error: String(err) }))
  }

  await sendPaymentFailedEmail({
    customerEmail: email,
    customerName:  name,
    attemptCount:  invoice.attempt_count ?? 1,
    portalUrl,
  })
}

// ── Utilities ─────────────────────────────────────────────────────────────────

async function resolveCustomer(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): Promise<Stripe.Customer | null> {
  if (!customer) return null
  if (typeof customer === 'object' && 'email' in customer) {
    return customer as Stripe.Customer
  }
  try {
    const c = await (stripe as any).customers.retrieve(customer as string)
    return c.deleted ? null : (c as Stripe.Customer)
  } catch {
    return null
  }
}

async function resolveCustomerEmail(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): Promise<string> {
  const c = await resolveCustomer(customer)
  return c?.email ?? ''
}

async function resolveCustomerName(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): Promise<string> {
  const c = await resolveCustomer(customer)
  return c?.name ?? ''
}

function formatAddress(
  shipping: Stripe.Checkout.Session.ShippingDetails | null | undefined
): string {
  if (!shipping?.address) return ''
  const a = shipping.address
  return [a.line1, a.line2, a.city, a.state, a.postal_code, a.country]
    .filter(Boolean)
    .join(', ')
}
