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

interface TradeInPayload {
  category: string
  year: string
  make: string
  model: string
  trim?: string
  mileage: string
  condition: string
  postalCode?: string
  notes?: string
  upgrade?: string
  ownership: string
  name: string
  phone: string
  email?: string
}

function row(label: string, value: string): string {
  return `<tr><td style="color:#888;padding:4px 12px 4px 0;white-space:nowrap">${label}</td><td style="padding:4px 0">${value}</td></tr>`
}

async function sendTradeInEmail(p: TradeInPayload & { timestamp: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from   = process.env.RESEND_FROM_EMAIL ?? 'hello@roadhouse.capital'
  if (!apiKey) {
    console.warn('[motors/trade-in] RESEND_API_KEY not set — email suppressed')
    return
  }

  const vehicle = `${p.year} ${p.make} ${p.model}${p.trim ? ` ${p.trim}` : ''}`
  const subject = `Trade-in lead: ${vehicle} — ${p.name} (${p.phone})`

  const text = [
    'New trade-in lead from motors.roadhouse.capital',
    '',
    `Name:        ${p.name}`,
    `Phone:       ${p.phone}`,
    p.email ? `Email:       ${p.email}` : '',
    '',
    `Vehicle:     ${vehicle}`,
    `Category:    ${p.category}`,
    `Mileage:     ${p.mileage} km`,
    `Condition:   ${p.condition}`,
    `Ownership:   ${p.ownership}`,
    p.postalCode ? `Postal code: ${p.postalCode}` : '',
    p.notes      ? `Notes:       ${p.notes}` : '',
    p.upgrade    ? `Upgrade to:  ${p.upgrade}` : '',
    '',
    `Timestamp:   ${p.timestamp}`,
    `Source:      /motors/trade-in`,
    '',
    'DL#331386',
  ].filter((l) => l !== null).join('\n')

  const html = `
    <p><strong>New trade-in lead from motors.roadhouse.capital</strong></p>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:monospace;font-size:14px">
      ${row('Name', p.name)}
      ${row('Phone', `<a href="tel:${p.phone}">${p.phone}</a>`)}
      ${p.email ? row('Email', `<a href="mailto:${p.email}">${p.email}</a>`) : ''}
      ${row('Vehicle', vehicle)}
      ${row('Category', p.category)}
      ${row('Mileage', `${p.mileage} km`)}
      ${row('Condition', p.condition)}
      ${row('Ownership', p.ownership)}
      ${p.postalCode ? row('Postal code', p.postalCode) : ''}
      ${p.notes      ? row('Notes', p.notes.replace(/\n/g, '<br>')) : ''}
      ${p.upgrade    ? row('Upgrade to', p.upgrade) : ''}
      ${row('Timestamp', p.timestamp)}
      ${row('Source', '/motors/trade-in')}
    </table>
    <p style="color:#888;font-size:12px;margin-top:16px">DL#331386</p>
  `

  const body: Record<string, unknown> = {
    from:    `RoadHouse Motors <${from}>`,
    to:      [TO_EMAIL],
    subject,
    text,
    html,
  }
  if (p.email) body['reply_to'] = p.email

  const res = await fetch(RESEND_API, {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`[motors/trade-in] Resend ${res.status}: ${err}`)
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

  const p = body as Record<string, unknown>

  // Required field validation
  const required: Array<[string, string]> = [
    ['category', 'Category is required'],
    ['year',     'Year is required'],
    ['make',     'Make is required'],
    ['model',    'Model is required'],
    ['mileage',  'Mileage is required'],
    ['condition','Condition is required'],
    ['ownership','Ownership status is required'],
    ['name',     'Name is required'],
    ['phone',    'Phone is required'],
  ]
  for (const [field, msg] of required) {
    if (typeof p[field] !== 'string' || !(p[field] as string).trim()) {
      return NextResponse.json({ error: msg }, { status: 400 })
    }
  }

  const name  = (p.name  as string).trim()
  const phone = (p.phone as string).trim()
  if (name.length  > 100) return NextResponse.json({ error: 'Name too long' },  { status: 400 })
  if (phone.length > 30)  return NextResponse.json({ error: 'Phone too long' }, { status: 400 })

  const cleanPhone = phone.replace(/\s+/g, '')

  // Rate limit: 60s per phone number
  try {
    const redis    = getRedis()
    const rateKey  = `tradein:ratelimit:${cleanPhone}`
    const existing = await redis.get(rateKey)
    if (existing) {
      return NextResponse.json(
        { error: 'Already submitted. Please wait a moment before trying again.' },
        { status: 429 }
      )
    }
    await redis.set(rateKey, '1', { ex: 60 })
  } catch (err) {
    // KV failure is non-blocking
    console.error('[motors/trade-in] KV rate limit check failed:', err)
  }

  const payload: TradeInPayload & { timestamp: string } = {
    category:   (p.category   as string).trim(),
    year:       (p.year       as string).trim(),
    make:       (p.make       as string).trim(),
    model:      (p.model      as string).trim(),
    trim:       typeof p.trim       === 'string' ? p.trim.trim()       : undefined,
    mileage:    (p.mileage    as string).trim(),
    condition:  (p.condition  as string).trim(),
    postalCode: typeof p.postalCode === 'string' ? p.postalCode.trim() : undefined,
    notes:      typeof p.notes      === 'string' ? p.notes.trim()      : undefined,
    upgrade:    typeof p.upgrade    === 'string' ? p.upgrade.trim()    : undefined,
    ownership:  (p.ownership  as string).trim(),
    name,
    phone:      cleanPhone,
    email:      typeof p.email === 'string' && p.email.trim() ? p.email.trim() : undefined,
    timestamp:  new Date().toISOString(),
  }

  try {
    await sendTradeInEmail(payload)
  } catch (err) {
    console.error('[motors/trade-in] Email send failed:', err)
    // Email failure is non-blocking — return success regardless (matches /api/motors/lead pattern)
  }

  return NextResponse.json({ success: true })
}
