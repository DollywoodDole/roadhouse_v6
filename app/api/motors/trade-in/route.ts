import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import type { MotorsLead, MotorsLeadTradeIn } from '@/types/inventory'
import { checkPhoneRateLimit } from '@/lib/motors/ratelimit'
import { toE164 } from '@/lib/motors/phone'

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

function row(label: string, value: string): string {
  return `<tr><td style="color:#888;padding:4px 12px 4px 0;white-space:nowrap">${label}</td><td style="padding:4px 0">${value}</td></tr>`
}

async function sendTradeInEmail(lead: MotorsLead): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from   = process.env.RESEND_FROM_EMAIL ?? 'hello@roadhouse.capital'
  if (!apiKey) {
    console.warn('[motors/trade-in] RESEND_API_KEY not set — email suppressed')
    return
  }

  const ti = lead.tradeIn!
  const vehicle = `${ti.year} ${ti.make} ${ti.model}${ti.trim ? ` ${ti.trim}` : ''}`
  const subject = `Trade-in Inquiry: ${vehicle} — ${lead.name} (${lead.phone})`

  const text = [
    'New trade-in inquiry from motors.roadhouse.capital',
    '',
    `Name:        ${lead.name}`,
    `Phone:       ${lead.phone}`,
    lead.email   ? `Email:       ${lead.email}` : '',
    `Lead ID:     ${lead.id}`,
    '',
    `Vehicle:     ${vehicle}`,
    `Category:    ${ti.category}`,
    `Mileage:     ${ti.mileage} km`,
    `Condition:   ${ti.condition}`,
    `Ownership:   ${ti.ownership}`,
    ti.postalCode ? `Postal code: ${ti.postalCode}` : '',
    lead.message  ? `Notes:       ${lead.message}` : '',
    ti.upgrade    ? `Upgrade to:  ${ti.upgrade}` : '',
    '',
    `Timestamp:   ${lead.submittedAt}`,
    `Source:      /motors/trade-in`,
    '',
    'DL#331386',
  ].filter(Boolean).join('\n')

  const html = `
    <p><strong>New trade-in inquiry from motors.roadhouse.capital</strong></p>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:monospace;font-size:14px">
      ${row('Name',    esc(lead.name))}
      ${row('Phone',   `<a href="tel:${esc(lead.phone)}">${esc(lead.phone)}</a>`)}
      ${lead.email ? row('Email', `<a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a>`) : ''}
      ${row('Lead ID', esc(lead.id))}
      ${row('Vehicle', esc(vehicle))}
      ${row('Category', esc(ti.category))}
      ${row('Mileage',  `${esc(ti.mileage)} km`)}
      ${row('Condition', esc(ti.condition))}
      ${row('Ownership', esc(ti.ownership))}
      ${ti.postalCode ? row('Postal code', esc(ti.postalCode)) : ''}
      ${lead.message  ? row('Notes', esc(lead.message).replace(/\n/g, '<br>')) : ''}
      ${ti.upgrade    ? row('Upgrade to', esc(ti.upgrade)) : ''}
      ${row('Timestamp', lead.submittedAt)}
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
  if (lead.email) body['reply_to'] = lead.email

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

  const required: Array<[string, string]> = [
    ['category',  'Category is required'],
    ['year',      'Year is required'],
    ['make',      'Make is required'],
    ['model',     'Model is required'],
    ['mileage',   'Mileage is required'],
    ['condition', 'Condition is required'],
    ['ownership', 'Ownership status is required'],
    ['name',      'Name is required'],
    ['phone',     'Phone is required'],
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

  const cleanPhone = toE164(phone)
  if (!cleanPhone) {
    return NextResponse.json({ error: 'Please enter a valid Canadian or US phone number' }, { status: 400 })
  }

  const allowed = await checkPhoneRateLimit(cleanPhone)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Already submitted. Please wait a moment before trying again.' },
      { status: 429 }
    )
  }

  const tradeIn: MotorsLeadTradeIn = {
    category:   (p.category   as string).trim(),
    year:       (p.year       as string).trim(),
    make:       (p.make       as string).trim(),
    model:      (p.model      as string).trim(),
    trim:       typeof p.trim       === 'string' ? p.trim.trim()       : undefined,
    mileage:    (p.mileage    as string).trim(),
    condition:  (p.condition  as string).trim(),
    ownership:  (p.ownership  as string).trim(),
    postalCode: typeof p.postalCode === 'string' ? p.postalCode.trim() : undefined,
    upgrade:    typeof p.upgrade    === 'string' ? p.upgrade.trim()    : undefined,
  }

  const id   = globalThis.crypto.randomUUID()
  const lead: MotorsLead = {
    id,
    submittedAt:    new Date().toISOString(),
    name,
    phone:          cleanPhone,
    email:          typeof p.email === 'string' && p.email.trim() ? p.email.trim() : undefined,
    message:        typeof p.notes === 'string' && p.notes.trim() ? p.notes.trim() : undefined,
    status:         'new',
    source:         'trade-in',
    deliveryStatus: 'sent',
    tradeIn,
  }

  const redis = getRedis()
  await redis.set(`motors:leads:${id}`, JSON.stringify(lead))
  await redis.sadd('motors:leads:index', id)

  try {
    await sendTradeInEmail(lead)
  } catch (err) {
    console.error('[motors/trade-in] Email send failed:', err)
    await redis
      .set(`motors:leads:${id}`, JSON.stringify({ ...lead, deliveryStatus: 'failed' }))
      .catch(() => {})
  }

  return NextResponse.json({ success: true })
}
