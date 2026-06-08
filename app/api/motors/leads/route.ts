import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import type { MotorsLead } from '@/types/inventory'

function getRedis(): Redis {
  const url   = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN not set')
  return new Redis({ url, token })
}

function auth(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  return header === `Bearer ${process.env.CRON_SECRET?.trim()}`
}

const RESEND_API   = 'https://api.resend.com/emails'
const MOTORS_FROM  = 'hello@roadhouse.capital'
const MOTORS_ADMIN = 'roadhousesyndicate@gmail.com'

async function sendNotification(lead: MotorsLead, raw: Record<string, string>) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[motors/leads] RESEND_API_KEY not set — email suppressed')
    return
  }

  const submitted = new Date(lead.submittedAt).toLocaleString('en-CA', { timeZone: 'America/Regina' })
  const adminUrl  = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://motors.roadhouse.capital'}/motors/admin`

  const lines: string[] = [
    `NEW LEAD — RoadHouse Motors`,
    `Submitted:      ${submitted} CST`,
    `Lead ID:        ${lead.id}`,
    ``,
    `── CONTACT ──────────────────────────────────────────`,
    `Name:           ${lead.name}`,
    `Email:          ${lead.email}`,
    `Phone:          ${lead.phone}`,
  ]

  if (raw.dob)           lines.push(`Date of Birth:  ${raw.dob}`)
  if (raw.maritalStatus) lines.push(`Marital Status: ${raw.maritalStatus}`)

  if (raw.street) {
    lines.push(``, `── ADDRESS ──────────────────────────────────────────`)
    lines.push(`${raw.street}, ${raw.city}, ${raw.province} ${raw.postalCode}`)
    if (raw.timeAtAddress) lines.push(`Time at Address: ${raw.timeAtAddress}`)
  }

  lines.push(``, `── EMPLOYMENT & INCOME ──────────────────────────────`)
  lines.push(`Status:         ${lead.employmentStatus}`)
  if (raw.employer)    lines.push(`Employer:       ${raw.employer}`)
  if (raw.position)    lines.push(`Position:       ${raw.position}`)
  if (raw.annualIncome)
    lines.push(`Annual Income:  $${Number(raw.annualIncome).toLocaleString('en-CA')} CAD`)
  else if (lead.monthlyIncome)
    lines.push(`Monthly Income: ${lead.monthlyIncome}`)
  if (raw.timeAtJob)   lines.push(`Time at Job:    ${raw.timeAtJob}`)

  lines.push(``, `── FINANCIAL ────────────────────────────────────────`)
  if (lead.creditRange)   lines.push(`Credit Profile: ${lead.creditRange}`)
  if (raw.downPayment)    lines.push(`Down Payment:   $${Number(raw.downPayment).toLocaleString('en-CA')} CAD`)
  if (raw.monthlyPayment) lines.push(`Monthly Housing: $${Number(raw.monthlyPayment).toLocaleString('en-CA')} CAD`)
  if (raw.bankruptcy)     lines.push(`Bankruptcy:     ${raw.bankruptcy}`)
  if (raw.repossession)   lines.push(`Repossession:   ${raw.repossession}`)
  if (raw.coSigner)       lines.push(`Co-signer:      ${raw.coSigner}`)

  lines.push(``, `── VEHICLE INTEREST ─────────────────────────────────`)
  lines.push(`Looking for:    ${lead.vehicleInterest || '—'}`)
  if (raw.tradeIn)   lines.push(`Trade-in:       ${raw.tradeIn}`)
  if (lead.message)  lines.push(`Notes:          ${lead.message}`)

  lines.push(``, `Admin panel: ${adminUrl}`)

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:     `RoadHouse Motors <${MOTORS_FROM}>`,
      to:       [MOTORS_ADMIN],
      subject:  `New Lead: ${lead.name} — ${lead.vehicleInterest ?? 'General Inquiry'}`,
      text:     lines.join('\n'),
      reply_to: lead.email,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend ${res.status}: ${err}`)
  }
}

// ── POST /api/motors/leads ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Accept full credit form body OR simplified lead body
  const firstName = body.firstName ?? ''
  const lastName  = body.lastName  ?? ''
  const name      = (body.name ?? `${firstName} ${lastName}`).trim()
  const phone     = body.phone
  const email     = body.email
  const employmentStatus = body.employmentStatus ?? ''

  if (!name || !phone || !email || !employmentStatus) {
    return NextResponse.json(
      { error: 'Missing required fields: name, phone, email, employmentStatus' },
      { status: 400 },
    )
  }

  const vehicleInterest = body.vehicleInterest || undefined
  const creditRange     = body.creditRange ?? body.creditRating ?? ''
  const monthlyIncome   = body.monthlyIncome ??
    (body.annualIncome
      ? `$${Math.round(Number(body.annualIncome) / 12).toLocaleString('en-CA')} CAD/mo`
      : '')
  const message = (body.message ?? body.notes) || undefined

  // Rate limit: 60s per phone number (matches /api/motors/lead pattern)
  const cleanPhone = phone.replace(/\s+/g, '')
  try {
    const redis    = getRedis()
    const rateKey  = `leads:ratelimit:${cleanPhone}`
    const existing = await redis.get(rateKey)
    if (existing) {
      return NextResponse.json(
        { error: 'Request already submitted. Please wait a moment before trying again.' },
        { status: 429 }
      )
    }
    await redis.set(rateKey, '1', { ex: 60 })
  } catch (err) {
    // KV failure is non-blocking
    console.error('[motors/leads] KV rate limit check failed:', err)
  }

  const id: string = globalThis.crypto.randomUUID()
  const lead: MotorsLead = {
    id,
    submittedAt: new Date().toISOString(),
    name,
    phone,
    email,
    vehicleInterest,
    creditRange,
    monthlyIncome,
    employmentStatus,
    message,
    status: 'new',
    source: 'credit-form',
  }

  const redis = getRedis()
  await redis.set(`motors:leads:${id}`, JSON.stringify(lead))
  await redis.sadd('motors:leads:index', id)

  try {
    await sendNotification(lead, body)
  } catch (err) {
    console.error('[motors/leads] notification email failed:', err)
    // Lead is persisted — don't block the user on email failure
  }

  return NextResponse.json({ success: true, id })
}

// ── GET /api/motors/leads ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const redis = getRedis()
  const ids   = (await redis.smembers('motors:leads:index')) as string[]

  if (!ids.length) return NextResponse.json([])

  const raw = await redis.mget<(string | null)[]>(...ids.map(id => `motors:leads:${id}`))

  const leads = raw
    .map(r => {
      if (!r) return null
      try { return typeof r === 'string' ? JSON.parse(r) : r } catch { return null }
    })
    .filter(Boolean)
    .sort((a: MotorsLead, b: MotorsLead) => b.submittedAt.localeCompare(a.submittedAt))

  return NextResponse.json(leads)
}
