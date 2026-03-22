import { NextRequest, NextResponse } from 'next/server'
import { optionalEnv } from '@/lib/env'

const RESEND_API   = 'https://api.resend.com/emails'
const RATE_LIMIT   = 3          // max submissions per window
const RATE_WINDOW  = 60 * 60    // 1 hour in seconds

// ── KV rate-limit helpers (gracefully degrade if KV not provisioned) ──────────

async function getRateLimitKey(ip: string): Promise<string> {
  return `contact:rl:${ip}`
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const url   = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return true  // KV not provisioned — allow through

  try {
    const key = await getRateLimitKey(ip)

    // INCR
    const incrRes = await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
      cache:   'no-store',
    })
    if (!incrRes.ok) return true  // fail open

    const { result: count } = await incrRes.json()

    // Set TTL on first hit
    if (count === 1) {
      await fetch(`${url}/expire/${encodeURIComponent(key)}/${RATE_WINDOW}`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        cache:   'no-store',
      })
    }

    return count <= RATE_LIMIT
  } catch {
    return true  // fail open — never block a real submission due to KV error
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { name, email, type, message, _hp } = await req.json()

    // ── Honeypot — bots fill hidden fields, humans don't ─────────────────────
    if (_hp) {
      // Return 200 to not reveal the trap
      return NextResponse.json({ ok: true })
    }

    // ── Input validation ──────────────────────────────────────────────────────
    if (!name?.trim())
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    if (!email?.trim() || !email.includes('@'))
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
    if (!type || type === 'Select a category')
      return NextResponse.json({ error: 'Inquiry type is required.' }, { status: 400 })
    if (!message?.trim() || message.trim().length < 10)
      return NextResponse.json({ error: 'Message must be at least 10 characters.' }, { status: 400 })

    // ── Rate limiting ─────────────────────────────────────────────────────────
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
               ?? req.headers.get('x-real-ip')
               ?? 'unknown'

    const allowed = await checkRateLimit(ip)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait an hour and try again.' },
        { status: 429 }
      )
    }

    // ── Config ────────────────────────────────────────────────────────────────
    const apiKey    = optionalEnv('RESEND_API_KEY')
    const toEmail   = optionalEnv('NEXT_PUBLIC_CONTACT_EMAIL')
    const fromEmail = optionalEnv('RESEND_FROM_EMAIL', 'hello@roadhouse.capital')

    if (!apiKey) {
      console.error('[contact] RESEND_API_KEY not set — contact form unavailable')
      return NextResponse.json(
        { error: 'Contact form is temporarily unavailable. Please email us directly.' },
        { status: 503 }
      )
    }

    if (!toEmail) {
      console.error('[contact] NEXT_PUBLIC_CONTACT_EMAIL not set')
      return NextResponse.json({ error: 'Contact configuration error.' }, { status: 500 })
    }

    const text = [
      `Name:    ${name}`,
      `Email:   ${email}`,
      `Type:    ${type}`,
      ``,
      message,
    ].join('\n')

    // ── Send notification to Dalton ───────────────────────────────────────────
    const notifyRes = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:     `RoadHouse Inquiry <${fromEmail}>`,
        to:       [toEmail],
        reply_to: email,
        subject:  `RoadHouse Inquiry — ${type}`,
        text,
      }),
    })

    if (!notifyRes.ok) {
      const body = await notifyRes.text()
      console.error('[contact] Resend notify error:', notifyRes.status, body)
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 502 })
    }

    // ── Auto-reply to submitter ───────────────────────────────────────────────
    const replyText = [
      `Hi ${name},`,
      ``,
      `Thanks for reaching out. Your message has been received and Dalton will get back to you directly.`,
      ``,
      `For reference, here's what you sent:`,
      ``,
      `  Category: ${type}`,
      `  Message:  ${message}`,
      ``,
      `— RoadHouse`,
      `  roadhouse.capital`,
    ].join('\n')

    // Fire auto-reply — don't block the response if it fails
    fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    `RoadHouse <${fromEmail}>`,
        to:      [email],
        subject: `Got your message — RoadHouse`,
        text:    replyText,
      }),
    }).catch(err => console.error('[contact] Auto-reply failed:', err))

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('[contact] Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error. Please try again.' }, { status: 500 })
  }
}
