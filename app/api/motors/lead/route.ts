import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const RESEND_API = 'https://api.resend.com/emails'
const TO_EMAIL   = 'roadhousesyndicate@gmail.com'

function getRedis(): Redis {
  const url   = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN not set')
  return new Redis({ url, token })
}

async function sendLeadEmail(params: {
  name: string
  phone: string
  vehicleInterest: string
  vin: string
  timestamp: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from   = process.env.RESEND_FROM_EMAIL ?? 'hello@roadhouse.capital'

  if (!apiKey) {
    console.warn('[motors/lead] RESEND_API_KEY not set — lead email suppressed')
    return
  }

  const text = [
    'New lead from motors.roadhouse.capital',
    '',
    `Name:             ${params.name}`,
    `Phone:            ${params.phone}`,
    `Vehicle Interest: ${params.vehicleInterest}`,
    `VIN:              ${params.vin}`,
    `Timestamp:        ${params.timestamp}`,
    `Source:           motors.roadhouse.capital`,
    '',
    'DL#331386',
  ].join('\n')

  const html = `
    <p><strong>New lead from motors.roadhouse.capital</strong></p>
    <table cellpadding="4" style="border-collapse:collapse;font-family:monospace;font-size:14px">
      <tr><td style="color:#888">Name</td><td>${params.name}</td></tr>
      <tr><td style="color:#888">Phone</td><td><a href="tel:${params.phone}">${params.phone}</a></td></tr>
      <tr><td style="color:#888">Vehicle Interest</td><td>${params.vehicleInterest}</td></tr>
      <tr><td style="color:#888">VIN</td><td>${params.vin}</td></tr>
      <tr><td style="color:#888">Timestamp</td><td>${params.timestamp}</td></tr>
      <tr><td style="color:#888">Source</td><td>motors.roadhouse.capital</td></tr>
    </table>
    <p style="color:#888;font-size:12px;margin-top:16px">DL#331386</p>
  `

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      from:    `RoadHouse Motors <${from}>`,
      to:      [TO_EMAIL],
      subject: `New Motors Lead — ${params.vehicleInterest}`,
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

  // Basic rate limit: reject same phone within 60 seconds
  try {
    const redis    = getRedis()
    const rateKey  = `lead:phone:${cleanPhone}`
    const existing = await redis.get(rateKey)
    if (existing) {
      return NextResponse.json(
        { error: 'Request already submitted. Please wait a moment before trying again.' },
        { status: 429 }
      )
    }
    await redis.set(rateKey, '1', { ex: 60 })
  } catch (err) {
    // KV failure should not block the user — log and continue
    console.error('[motors/lead] KV rate limit check failed:', err)
  }

  const timestamp = new Date().toISOString()

  try {
    await sendLeadEmail({
      name:            name.trim(),
      phone:           cleanPhone,
      vehicleInterest: typeof vehicleInterest === 'string' ? vehicleInterest : 'not specified',
      vin:             typeof vin === 'string' && vin ? vin : 'not specified',
      timestamp,
    })
  } catch (err) {
    console.error('[motors/lead] Email send failed:', err)
    // Still return success — lead was rate-limited/stored; email failure non-blocking
  }

  return NextResponse.json({ success: true })
}
