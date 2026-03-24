/**
 * RoadHouse Capital — Transactional Email
 * ────────────────────────────────────────
 * All outbound email via Resend REST API (no SDK — zero extra deps).
 * Silently suppresses if RESEND_API_KEY is not set (logs warning).
 *
 * Required env vars:
 *   RESEND_API_KEY       — Resend API key (server-only)
 *   RESEND_FROM_EMAIL    — Verified sender (default: noreply@roadhouse.capital)
 */

import { optionalEnv } from '@/lib/env'
import { TIER_META, type MembershipTier } from '@/lib/membership'

const RESEND_API = 'https://api.resend.com/emails'

const adminEmail = () =>
  optionalEnv('NEXT_PUBLIC_CONTACT_EMAIL', 'roadhousesyndicate@gmail.com')

const founderEmail = () =>
  optionalEnv('NEXT_PUBLIC_FOUNDER_EMAIL', 'daltonellscheid@gmail.com')

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://roadhouse.capital'

// ── Core send ─────────────────────────────────────────────────────────────────

interface EmailPayload {
  to:       string
  subject:  string
  text:     string
  replyTo?: string
}

async function send(payload: EmailPayload): Promise<void> {
  const apiKey = optionalEnv('RESEND_API_KEY')
  const from   = optionalEnv('RESEND_FROM_EMAIL', 'noreply@roadhouse.capital')

  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — suppressed: "${payload.subject}" → ${payload.to}`)
    return
  }

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:     `RoadHouse Capital <${from}>`,
      to:       [payload.to],
      subject:  payload.subject,
      text:     payload.text,
      ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`[email] Resend ${res.status}: ${err}`)
  }

  console.log(`[email] sent "${payload.subject}" → ${payload.to}`)
}

// ── Welcome email — membership signup ─────────────────────────────────────────

export async function sendWelcomeEmail(params: {
  customerEmail: string
  customerName:  string
  tier:          MembershipTier
}): Promise<void> {
  const meta = TIER_META[params.tier]
  await send({
    to:      params.customerEmail,
    subject: `Welcome to RoadHouse — ${meta.displayName} Membership`,
    text: [
      `${params.customerName || 'Hey'},`,
      ``,
      `Your ${meta.displayName} membership is live.`,
      ``,
      `What you've unlocked:`,
      `  · Discord community access`,
      `  · ${meta.roadPerMonth} in governance tokens per month (accrues to mainnet launch)`,
      `  · ${meta.price} — cancel anytime`,
      ``,
      `Join the Discord and verify your membership:`,
      `https://discord.gg/wwhhKcnQJ3`,
      ``,
      `Manage billing: ${APP_URL}/portal`,
      ``,
      `— Dalton`,
      `RoadHouse Capital · Where Standards Matter`,
    ].join('\n'),
  })
}

// ── Upgrade email — tier change ───────────────────────────────────────────────

export async function sendUpgradeEmail(params: {
  customerEmail: string
  customerName:  string
  oldTier:       MembershipTier
  newTier:       MembershipTier
}): Promise<void> {
  const oldMeta = TIER_META[params.oldTier]
  const newMeta = TIER_META[params.newTier]
  await send({
    to:      params.customerEmail,
    subject: `Membership Upgraded — ${newMeta.displayName}`,
    text: [
      `${params.customerName || 'Hey'},`,
      ``,
      `Your membership has been upgraded from ${oldMeta.displayName} to ${newMeta.displayName}.`,
      ``,
      `What's changed:`,
      `  · ${newMeta.roadPerMonth} in $ROAD per month (was ${oldMeta.roadPerMonth})`,
      `  · ${newMeta.price}`,
      `  · Updated Discord role — you may need to rejoin any newly gated channels`,
      ``,
      `Manage billing: ${APP_URL}/portal`,
      ``,
      `— Dalton`,
      `RoadHouse Capital · Where Standards Matter`,
    ].join('\n'),
    replyTo: adminEmail(),
  })
}

// ── Digital product delivery — to customer ────────────────────────────────────

export async function sendDigitalProductEmail(params: {
  customerEmail: string
  customerName:  string
  productName:   string
  sessionId:     string
}): Promise<void> {
  await send({
    to:      params.customerEmail,
    subject: `Your Download — ${params.productName}`,
    text: [
      `${params.customerName || 'Hey'},`,
      ``,
      `Your purchase of ${params.productName} is confirmed.`,
      ``,
      `Order ref: ${params.sessionId}`,
      ``,
      `Dalton will send your download link within 24 hours.`,
      `Questions? ${adminEmail()}`,
      ``,
      `— RoadHouse Capital`,
    ].join('\n'),
    replyTo: adminEmail(),
  })
}

// ── Adventure confirmation — to customer ──────────────────────────────────────

export async function sendAdventureConfirmationEmail(params: {
  customerEmail: string
  customerName:  string
  adventureName: string
  sessionId:     string
}): Promise<void> {
  await send({
    to:      params.customerEmail,
    subject: `Adventure Spot Confirmed — ${params.adventureName}`,
    text: [
      `${params.customerName || 'Hey'},`,
      ``,
      `Your spot for ${params.adventureName} is confirmed.`,
      ``,
      `Order ref: ${params.sessionId}`,
      ``,
      `Full logistics, itinerary, and pre-trip details will be sent`,
      `as the date approaches. Keep an eye on Discord for community`,
      `coordination and group planning.`,
      ``,
      `Discord: https://discord.gg/wwhhKcnQJ3`,
      `Questions: ${adminEmail()}`,
      ``,
      `— Dalton`,
      `RoadHouse Capital · Where Standards Matter`,
    ].join('\n'),
    replyTo: adminEmail(),
  })
}

// ── Merch fulfillment — to admin ──────────────────────────────────────────────

export async function sendMerchFulfillmentEmail(params: {
  customerName:    string
  customerEmail:   string
  itemName:        string
  size:            string
  sessionId:       string
  shippingAddress: string
}): Promise<void> {
  await send({
    to:      founderEmail(),
    subject: `Merch Order — ${params.itemName}`,
    text: [
      `New merch order to fulfill.`,
      ``,
      `Item:     ${params.itemName}`,
      `Size:     ${params.size || 'N/A'}`,
      ``,
      `Customer: ${params.customerName || '—'}`,
      `Email:    ${params.customerEmail}`,
      `Address:  ${params.shippingAddress || 'See Stripe dashboard'}`,
      ``,
      `Stripe Session: ${params.sessionId}`,
      `Dashboard: https://dashboard.stripe.com/payments`,
    ].join('\n'),
    replyTo: params.customerEmail,
  })
}

// ── Merch confirmation — to customer ──────────────────────────────────────────

export async function sendMerchConfirmationEmail(params: {
  customerEmail: string
  customerName:  string
  itemName:      string
  size:          string
  sessionId:     string
}): Promise<void> {
  await send({
    to:      params.customerEmail,
    subject: `Order Confirmed — ${params.itemName}`,
    text: [
      `${params.customerName || 'Hey'},`,
      ``,
      `Your order is confirmed.`,
      ``,
      `Item:  ${params.itemName}`,
      `Size:  ${params.size || 'N/A'}`,
      `Ref:   ${params.sessionId}`,
      ``,
      `Ships within 5–10 business days from Saskatchewan, Canada.`,
      ``,
      `Questions? ${adminEmail()}`,
      ``,
      `— RoadHouse Capital`,
    ].join('\n'),
    replyTo: adminEmail(),
  })
}

// ── Event confirmation — to customer ──────────────────────────────────────────

export async function sendEventConfirmationEmail(params: {
  customerEmail: string
  customerName:  string
  eventName:     string
  sessionId:     string
}): Promise<void> {
  await send({
    to:      params.customerEmail,
    subject: `Ticket Confirmed — ${params.eventName}`,
    text: [
      `${params.customerName || 'Hey'},`,
      ``,
      `Your ticket for ${params.eventName} is confirmed.`,
      ``,
      `Order ref: ${params.sessionId}`,
      ``,
      `Full logistics will be sent closer to the event date.`,
      `Questions: ${adminEmail()}`,
      ``,
      `— RoadHouse Capital`,
    ].join('\n'),
    replyTo: adminEmail(),
  })
}

// ── Sponsor alert — to admin ───────────────────────────────────────────────────

export async function sendSponsorAlertEmail(params: {
  sponsorEmail:   string
  sponsorName:    string
  packageName:    string
  subscriptionId: string
}): Promise<void> {
  await send({
    to:      adminEmail(),
    subject: `New Sponsor — ${params.packageName} — ${params.sponsorName || params.sponsorEmail}`,
    text: [
      `New sponsorship activated.`,
      ``,
      `Package:      ${params.packageName}`,
      `Sponsor:      ${params.sponsorName || '—'}`,
      `Email:        ${params.sponsorEmail}`,
      `Subscription: ${params.subscriptionId}`,
      ``,
      `Next steps:`,
      `  1. Reply to sponsor with onboarding details and asset specs`,
      `  2. Add logo to stream overlays`,
      `  3. Schedule first activation`,
      ``,
      `Dashboard: https://dashboard.stripe.com/subscriptions/${params.subscriptionId}`,
    ].join('\n'),
    replyTo: params.sponsorEmail,
  })
}

// ── Sponsor auto-reply — to sponsor ───────────────────────────────────────────

export async function sendSponsorAutoReply(params: {
  sponsorEmail: string
  sponsorName:  string
  packageName:  string
}): Promise<void> {
  await send({
    to:      params.sponsorEmail,
    subject: `RoadHouse Partnership Confirmed — ${params.packageName}`,
    text: [
      `${params.sponsorName || 'Hey'},`,
      ``,
      `Your ${params.packageName} sponsorship is confirmed and active.`,
      ``,
      `Dalton will be in touch within 48 hours with onboarding details,`,
      `asset specs, and your first activation schedule.`,
      ``,
      `  · X:    https://x.com/dollywooddole`,
      `  · Kick: https://kick.com/dollywooddole`,
      ``,
      `Manage your subscription: ${APP_URL}/portal`,
      ``,
      `— Dalton Ellscheid`,
      `Praetorian Holdings Corp. · RoadHouse Capital`,
      `${adminEmail()}`,
    ].join('\n'),
    replyTo: adminEmail(),
  })
}

// ── Offboarding — subscription cancelled ──────────────────────────────────────

export async function sendOffboardingEmail(params: {
  customerEmail: string
  customerName:  string
  tier:          MembershipTier
}): Promise<void> {
  const meta = TIER_META[params.tier]
  await send({
    to:      params.customerEmail,
    subject: `Your RoadHouse ${meta.displayName} Membership Has Ended`,
    text: [
      `${params.customerName || 'Hey'},`,
      ``,
      `Your ${meta.displayName} membership has been cancelled.`,
      ``,
      `Discord access and $ROAD accrual stop at the end of the current billing period.`,
      ``,
      `If this was a mistake or you'd like to come back:`,
      `${APP_URL}/#membership`,
      ``,
      `Thanks for being part of it.`,
      ``,
      `— Dalton`,
      `RoadHouse Capital`,
    ].join('\n'),
    replyTo: adminEmail(),
  })
}

// ── Payment failed ─────────────────────────────────────────────────────────────

export async function sendPaymentFailedEmail(params: {
  customerEmail: string
  customerName:  string
  attemptCount:  number
  portalUrl:     string
}): Promise<void> {
  await send({
    to:      params.customerEmail,
    subject: `Action Required — RoadHouse Payment Failed`,
    text: [
      `${params.customerName || 'Hey'},`,
      ``,
      `We couldn't process your RoadHouse membership payment (attempt ${params.attemptCount} of 4).`,
      ``,
      `Update your payment method to keep your access:`,
      `${params.portalUrl}`,
      ``,
      `Stripe will retry automatically. If payment continues to fail your`,
      `membership and Discord access will be suspended.`,
      ``,
      `Questions? ${adminEmail()}`,
      ``,
      `— RoadHouse Capital`,
    ].join('\n'),
    replyTo: adminEmail(),
  })
}
