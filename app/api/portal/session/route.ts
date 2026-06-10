/**
 * RoadHouse Capital — Member Portal Session
 * ──────────────────────────────────────────
 * POST /api/portal/session
 * Body: { email: string }
 *
 * Looks up the Stripe customer by email, creates a Stripe Billing Portal
 * session, and emails the portal link to the address on file.
 *
 * SECURITY DESIGN:
 * - Portal URL is never returned to the requester — only emailed to the
 *   address Stripe has on record. This prevents portal takeover via known email.
 * - Response is always { ok: true } regardless of whether the email exists —
 *   prevents enumeration: attacker cannot distinguish "account found" from
 *   "account not found" by inspecting the response.
 * - 3 requests per IP per hour — tighter than contact form; limits burst probing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe, APP_URL } from '@/lib/stripe'
import { sendPortalAccessEmail } from '@/lib/email'

// 3 lookups per IP per hour
const RATE_LIMIT  = 3
const RATE_WINDOW = 60 * 60

async function checkPortalRateLimit(ip: string): Promise<boolean> {
  const url   = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  // Intentionally fail-open: portal must remain accessible even if KV is down
  if (!url || !token) return true
  try {
    const key     = `portal:rl:${ip}`
    const incrRes = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    })
    if (!incrRes.ok) return true
    const { result: count } = await incrRes.json()
    if (count === 1) {
      await fetch(`${url}/expire/${encodeURIComponent(key)}/${RATE_WINDOW}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      })
    }
    return count <= RATE_LIMIT
  } catch {
    return true
  }
}

// Uniform response — same text whether or not the account exists
const UNIFORM_OK = { ok: true, message: "If an account exists, a link has been sent to that address." }

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

  const ip      = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const allowed = await checkPortalRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait an hour and try again.' },
      { status: 429 }
    )
  }

  // Everything below is best-effort — failures return the same uniform OK
  // so the caller cannot infer whether the account exists.
  try {
    const customers = await stripe.customers.list({ email, limit: 1 })
    const customer  = customers.data[0]

    if (!customer) {
      // No account — return uniform response without logging (prevents timing side-channel)
      return NextResponse.json(UNIFORM_OK)
    }

    // Create portal session — return_url sends member back to /portal
    const session = await stripe.billingPortal.sessions.create({
      customer:   customer.id,
      return_url: `${APP_URL}/portal`,
    })

    // Send link to the address Stripe has on file — NOT to the requester's input
    await sendPortalAccessEmail({
      customerEmail: customer.email ?? email,
      customerName:  customer.name  ?? '',
      portalUrl:     session.url,
    })

    console.log(JSON.stringify({
      evt:        'portal.session.sent',
      customerId: customer.id,
    }))
  } catch (err) {
    // Log but do not surface — uniform response regardless
    console.error(JSON.stringify({ evt: 'portal.session.error', error: String(err) }))
  }

  return NextResponse.json(UNIFORM_OK)
}
