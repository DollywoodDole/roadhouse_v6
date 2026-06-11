import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import type { MotorsLead } from '@/types/inventory'
import { checkPhoneRateLimit } from '@/lib/motors/ratelimit'

const RESEND_API = 'https://api.resend.com/emails'
const TO_EMAIL   = 'roadhousesyndicate@gmail.com'

function getRedis(): Redis {
  const url   = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN not set')
  return new Redis({ url, token })
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function sendLeadEmail(lead: MotorsLead): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from   = process.env.RESEND_FROM_EMAIL ?? 'hello@roadhouse.capital'

  if (!apiKey) {
    console.warn('[motors/lead] RESEND_API_KEY not set — lead email suppressed')
    return
  }

  const vehicleInterest = lead.vehicleInterest ?? 'not specified'
  const vin             = lead.vin             ?? 'not specified'

  const text = [
    'New vehicle inquiry from motors.roadhouse.capital',
    '',
    `Name:             ${lead.name}`,
    `Phone:            ${lead.phone}`,
    `Vehicle Interest: ${vehicleInterest}`,
    `VIN:              ${vin}`,
    `Lead ID:          ${lead.id}`,
    `Timestamp:        ${lead.submittedAt}`,
    `Source:           motors.roadhouse.capital`,
    '',
    'DL#331386',
  ].join('\n')

  const html = `
    <p><strong>New vehicle inquiry from motors.roadhouse.capital</strong></p>
    <table cellpadding="4" style="border-collapse:collapse;font-family:monospace;font-size:14px">
      <tr><td style="color:#888">Name</td><td>${esc(lead.name)}</td></tr>
      <tr><td style="color:#888">Phone</td><td><a href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a></td></tr>
      <tr><td style="color:#888">Vehicle Interest</td><td>${esc(vehicleInterest)}</td></tr>
      <tr><td style="color:#888">VIN</td><td>${esc(vin)}</td></tr>
      <tr><td style="color:#888">Lead ID</td><td>${esc(lead.id)}</td></tr>
      <tr><td style="color:#888">Timestamp</td><td>${esc(lead.submittedAt)}</td></tr>
      <tr><td style="color:#888">Source</td><td>motors.roadhouse.capital</td></tr>
    </table>
    <p style="color:#888;font-size:12px;margin-top:16px">DL#331386</p>
  `

  const res = await fetch(RESEND_API, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    `RoadHouse Motors <${from}>`,
      to:      [TO_EMAIL],
      subject: `Vehicle Inquiry — ${vehicleInterest}`,
      text,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`[motors/lead] Resend ${res.status}: ${err}`)
  }
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, phone, vehicleInterest, vin } = body as Record<string, unknown>

  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  if (typeof phone !== 'string' || !phone.trim()) {
    return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
  }
  if (name.trim().length > 100) {
    return NextResponse.json({ error: 'Name too long' }, { status: 400 })
  }
  if (phone.trim().length > 30) {
    return NextResponse.json({ error: 'Phone too long' }, { status: 400 })
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '')

  const allowed = await checkPhoneRateLimit(cleanPhone)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Request already submitted. Please wait a moment before trying again.' },
      { status: 429 }
    )
  }

  const id   = globalThis.crypto.randomUUID()
  const lead: MotorsLead = {
    id,
    submittedAt:     new Date().toISOString(),
    name:            name.trim(),
    phone:           cleanPhone,
    vehicleInterest: typeof vehicleInterest === 'string' && vehicleInterest ? vehicleInterest : undefined,
    vin:             typeof vin === 'string' && vin ? vin : undefined,
    status:          'new',
    source:          'vehicle-form',
    deliveryStatus:  'sent',
  }

  const redis = getRedis()
  await redis.set(`motors:leads:${id}`, JSON.stringify(lead))
  await redis.sadd('motors:leads:index', id)

  try {
    await sendLeadEmail(lead)
  } catch (err) {
    console.error('[motors/lead] Email send failed:', err)
    await redis
      .set(`motors:leads:${id}`, JSON.stringify({ ...lead, deliveryStatus: 'failed' }))
      .catch(() => {})
  }

  return NextResponse.json({ success: true })
}
