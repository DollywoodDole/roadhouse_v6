import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import type { MotorsLead } from '@/types/inventory'
import { checkPhoneRateLimit } from '@/lib/motors/ratelimit'
import { encryptPII, decryptPII } from '@/lib/motors/encrypt'
import { toE164 } from '@/lib/motors/phone'

// 90-day TTL for pre-qualification leads (PIPEDA: retain only while purpose is active).
// Funded deals must be migrated to the DMS before this window closes.
const LEAD_TTL_SECONDS = 90 * 24 * 60 * 60

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

async function sendAdminNotification(lead: MotorsLead, raw: Record<string, string>) {
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
    `Email:          ${lead.email ?? '—'}`,
    `Phone:          ${lead.phone}`,
  ]

  if (raw.dob)           lines.push(`Date of Birth:  ${raw.dob}`)
  if (raw.sin)           lines.push(`SIN:            ${raw.sin}`)
  if (raw.maritalStatus) lines.push(`Marital Status: ${raw.maritalStatus}`)

  if (raw.street) {
    lines.push(``, `── ADDRESS ──────────────────────────────────────────`)
    lines.push(`${raw.street}, ${raw.city}, ${raw.province} ${raw.postalCode}`)
    if (raw.timeAtAddress) lines.push(`Time at Address: ${raw.timeAtAddress}`)
  }

  lines.push(``, `── EMPLOYMENT & INCOME ──────────────────────────────`)
  lines.push(`Status:         ${lead.employmentStatus ?? '—'}`)
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
  if (lead.coSigner)      lines.push(`Co-signer:      ${lead.coSigner}`)

  lines.push(``, `── VEHICLE INTEREST ─────────────────────────────────`)
  lines.push(`Looking for:    ${lead.vehicleInterest || '—'}`)
  if (lead.vin)      lines.push(`VIN:            ${lead.vin}`)
  if (raw.tradeIn)   lines.push(`Trade-in:       ${raw.tradeIn}`)
  if (lead.message)  lines.push(`Notes:          ${lead.message}`)

  lines.push(``, `Admin panel: ${adminUrl}`)

  const subject = lead.vehicleInterest
    ? `Credit App — ${lead.name} — ${lead.vehicleInterest}`
    : `New Lead: ${lead.name} — General Inquiry`

  const res = await fetch(RESEND_API, {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:      `RoadHouse Motors <${MOTORS_FROM}>`,
      to:        [MOTORS_ADMIN],
      subject,
      text:      lines.join('\n'),
      reply_to:  lead.email,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend ${res.status}: ${err}`)
  }
}

async function sendCustomerReceipt(lead: MotorsLead) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !lead.email) return

  const firstName  = lead.name.split(' ')[0]
  const vehicleLine = lead.vehicleInterest ? `\n\nApplied for: ${lead.vehicleInterest}` : ''

  const text = [
    `Hi ${firstName},`,
    ``,
    `We've received your pre-qualification request and will be in touch within 1 business day.${vehicleLine}`,
    ``,
    `Questions? Call us at (306) 381-8222.`,
    ``,
    `— RoadHouse Motors`,
    `Dealer Licence DL331386 · Saskatchewan, Canada`,
    `https://motors.roadhouse.capital`,
  ].join('\n')

  const res = await fetch(RESEND_API, {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    `RoadHouse Motors <${MOTORS_FROM}>`,
      to:      [lead.email],
      subject: `Application received — RoadHouse Motors`,
      text,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`[motors/leads] receipt email: Resend ${res.status}: ${err}`)
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

  // Server-side consent enforcement — never trust the client
  const consent = body.consent === 'true' || (body.consent as unknown) === true
  if (!consent) {
    return NextResponse.json({ error: 'Consent is required to submit this form' }, { status: 400 })
  }

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

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Valid email address required' }, { status: 400 })
  }

  const vehicleInterest = body.vehicleInterest || undefined
  const vin             = body.vin             || undefined
  const creditRange     = body.creditRange ?? body.creditRating ?? ''
  const monthlyIncome   = body.monthlyIncome ??
    (body.annualIncome
      ? `$${Math.round(Number(body.annualIncome) / 12).toLocaleString('en-CA')} CAD/mo`
      : '')
  const message  = (body.message ?? body.notes) || undefined
  const coSigner = body.coSigner || undefined

  const cleanPhone = toE164(phone)
  if (!cleanPhone) {
    return NextResponse.json({ error: 'Please enter a valid Canadian or US phone number' }, { status: 400 })
  }

  const allowed = await checkPhoneRateLimit(cleanPhone)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Request already submitted. Please wait a moment before trying again.' },
      { status: 429 }
    )
  }

  // Collect sensitive PII fields and encrypt before KV write
  const piiFields: Record<string, string> = {}
  for (const k of [
    'dob', 'sin', 'annualIncome', 'street', 'city', 'province', 'postalCode',
    'timeAtAddress', 'employer', 'position', 'timeAtJob', 'maritalStatus',
    'bankruptcy', 'repossession',
  ]) {
    if (body[k]) piiFields[k] = body[k]
  }

  let pii: string | undefined
  if (Object.keys(piiFields).length > 0) {
    try {
      pii = encryptPII(JSON.stringify(piiFields))
    } catch (err) {
      console.warn('[motors/leads] PII encryption skipped (MOTORS_LEAD_ENCRYPTION_KEY not configured):', err instanceof Error ? err.message : err)
    }
  }

  const id: string = globalThis.crypto.randomUUID()
  const lead: MotorsLead = {
    id,
    submittedAt:     new Date().toISOString(),
    name,
    phone:           cleanPhone,
    email,
    vehicleInterest,
    vin,
    creditRange,
    monthlyIncome,
    employmentStatus,
    coSigner,
    message,
    status:          'new',
    source:          'credit-form',
    deliveryStatus:  'sent',
    ...(pii ? { pii } : {}),
  }

  const redis = getRedis()
  await redis.set(`motors:leads:${id}`, JSON.stringify(lead), { ex: LEAD_TTL_SECONDS })
  await redis.sadd('motors:leads:index', id)

  try {
    await sendAdminNotification(lead, body)
  } catch (err) {
    console.error('[motors/leads] admin notification failed:', err)
    await redis
      .set(`motors:leads:${id}`, JSON.stringify({ ...lead, deliveryStatus: 'failed' }), { ex: LEAD_TTL_SECONDS })
      .catch(() => {})
  }

  // Customer receipt — non-blocking; failure does not affect lead save status
  sendCustomerReceipt(lead).catch((err) => {
    console.error('[motors/leads] receipt email fire-and-forget error:', err)
  })

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
      try {
        const lead: MotorsLead & Record<string, unknown> = typeof r === 'string' ? JSON.parse(r) : r
        // Decrypt PII blob and merge fields into admin response
        if (lead.pii) {
          try {
            const decrypted = JSON.parse(decryptPII(lead.pii as string)) as Record<string, string>
            Object.assign(lead, decrypted)
          } catch {
            lead.piiDecryptError = true
          }
        }
        return lead
      } catch {
        return null
      }
    })
    .filter(Boolean)
    .sort((a: MotorsLead, b: MotorsLead) => b.submittedAt.localeCompare(a.submittedAt))

  return NextResponse.json(leads)
}
