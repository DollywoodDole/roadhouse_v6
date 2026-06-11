import { NextResponse } from 'next/server'

const MOTORS_ADMIN = 'https://motors.roadhouse.capital/motors/admin'

export async function POST(req: Request) {
  let token = ''
  try {
    const form = await req.formData()
    token = (form.get('token') ?? '').toString().trim()
  } catch {
    return NextResponse.redirect(MOTORS_ADMIN, { status: 303 })
  }

  const secret = process.env.ADMIN_SECRET?.trim()
  if (!secret || token !== secret) {
    return NextResponse.redirect(MOTORS_ADMIN, { status: 303 })
  }

  const res = NextResponse.redirect(MOTORS_ADMIN, { status: 303 })
  res.cookies.set('motors-admin', secret, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
    path:     '/',
  })
  return res
}
