import { NextRequest, NextResponse } from 'next/server'

const RESEND_API = 'https://api.resend.com/emails'
const MOTORS_FROM  = 'hello@roadhouse.capital'
const MOTORS_ADMIN = 'roadhousesyndicate@gmail.com'

interface CreditApplication {
  firstName: string
  lastName: string
  email: string
  phone: string
  dob: string
  maritalStatus: string
  street: string
  city: string
  province: string
  postalCode: string
  timeAtAddress: string
  employmentStatus: string
  employer: string
  position: string
  annualIncome: string
  timeAtJob: string
  downPayment: string
  monthlyPayment: string
  bankruptcy: string
  repossession: string
  creditRating: string
  coSigner: string
  vehicleInterest: string
  tradeIn: string
  notes: string
}

async function sendEmail(payload: {
  to: string
  subject: string
  text: string
  replyTo?: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[motors/credit] RESEND_API_KEY not set — email suppressed')
    return
  }

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `RoadHouse Motors <${MOTORS_FROM}>`,
      to: [payload.to],
      subject: payload.subject,
      text: payload.text,
      ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend ${res.status}: ${err}`)
  }
}

export async function POST(req: NextRequest) {
  let body: CreditApplication
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const required = ['firstName', 'lastName', 'email', 'phone', 'street', 'city', 'province', 'postalCode', 'employmentStatus', 'annualIncome']
  for (const field of required) {
    if (!body[field as keyof CreditApplication]) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
    }
  }

  const name = `${body.firstName} ${body.lastName}`
  const submitted = new Date().toLocaleString('en-CA', { timeZone: 'America/Regina' })

  const adminText = [
    `NEW CREDIT APPLICATION — RoadHouse Motors`,
    `Submitted: ${submitted} CST`,
    ``,
    `── PERSONAL ─────────────────────────────────────────`,
    `Name:           ${name}`,
    `Email:          ${body.email}`,
    `Phone:          ${body.phone}`,
    `Date of Birth:  ${body.dob || '—'}`,
    `Marital Status: ${body.maritalStatus || '—'}`,
    ``,
    `── ADDRESS ──────────────────────────────────────────`,
    `Street:         ${body.street}`,
    `City:           ${body.city}`,
    `Province:       ${body.province}`,
    `Postal Code:    ${body.postalCode}`,
    `Time at Address:${body.timeAtAddress || '—'}`,
    ``,
    `── EMPLOYMENT ───────────────────────────────────────`,
    `Status:         ${body.employmentStatus}`,
    `Employer:       ${body.employer || '—'}`,
    `Position:       ${body.position || '—'}`,
    `Annual Income:  $${Number(body.annualIncome).toLocaleString('en-CA')} CAD`,
    `Time at Job:    ${body.timeAtJob || '—'}`,
    ``,
    `── FINANCIAL ────────────────────────────────────────`,
    `Down Payment:   $${Number(body.downPayment || 0).toLocaleString('en-CA')} CAD`,
    `Monthly Pmt:    $${Number(body.monthlyPayment || 0).toLocaleString('en-CA')} CAD`,
    `Bankruptcy:     ${body.bankruptcy || '—'}`,
    `Repossession:   ${body.repossession || '—'}`,
    `Credit Rating:  ${body.creditRating || '—'}`,
    `Co-signer:      ${body.coSigner || '—'}`,
    ``,
    `── VEHICLE INTEREST ─────────────────────────────────`,
    `Looking for:    ${body.vehicleInterest || '—'}`,
    `Trade-in:       ${body.tradeIn || '—'}`,
    `Notes:          ${body.notes || '—'}`,
  ].join('\n')

  const applicantText = [
    `Hi ${body.firstName},`,
    ``,
    `We've received your credit application and will be in touch within one business day.`,
    ``,
    `Your application summary:`,
    `  Vehicle interest:  ${body.vehicleInterest || 'Not specified'}`,
    `  Down payment:      $${Number(body.downPayment || 0).toLocaleString('en-CA')} CAD`,
    ``,
    `In the meantime, feel free to browse our current inventory:`,
    `https://motors.roadhouse.capital/inventory`,
    ``,
    `Questions? Reply to this email or call us at (306) 381-8222.`,
    ``,
    `— RoadHouse Motors`,
    `Dealer Licence DL331386 · Saskatchewan, Canada`,
  ].join('\n')

  try {
    await Promise.all([
      sendEmail({
        to: MOTORS_ADMIN,
        subject: `Credit Application — ${name}`,
        text: adminText,
        replyTo: body.email,
      }),
      sendEmail({
        to: body.email,
        subject: 'RoadHouse Motors — Application Received',
        text: applicantText,
        replyTo: MOTORS_ADMIN,
      }),
    ])
  } catch (err) {
    console.error('[motors/credit] email send failed:', err)
    return NextResponse.json({ error: 'Failed to send application. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
