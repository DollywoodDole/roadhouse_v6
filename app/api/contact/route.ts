import { NextRequest, NextResponse } from 'next/server'
import { optionalEnv } from '@/lib/env'

const RESEND_API = 'https://api.resend.com/emails'

export async function POST(req: NextRequest) {
  try {
    const { name, email, type, message } = await req.json()

    // ── Input validation ──────────────────────────────────────────────────────
    if (!name?.trim())                   return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    if (!email?.trim() || !email.includes('@')) return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
    if (!type || type === 'Select a category') return NextResponse.json({ error: 'Inquiry type is required.' }, { status: 400 })
    if (!message?.trim() || message.trim().length < 10) return NextResponse.json({ error: 'Message must be at least 10 characters.' }, { status: 400 })

    const apiKey     = optionalEnv('RESEND_API_KEY')
    const toEmail    = optionalEnv('NEXT_PUBLIC_CONTACT_EMAIL')
    const fromEmail  = optionalEnv('RESEND_FROM_EMAIL', 'noreply@roadhouse.capital')

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

    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:     `RoadHouse Inquiry <${fromEmail}>`,
        to:       [toEmail],
        reply_to: email,
        subject:  `RoadHouse Inquiry — ${type}`,
        text,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[contact] Resend error:', res.status, body)
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 502 })
    }

    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('[contact] Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error. Please try again.' }, { status: 500 })
  }
}
