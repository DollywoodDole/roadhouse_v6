import { NextResponse } from 'next/server'

const RESEND_API = 'https://api.resend.com/emails'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, company, email, brief } = body as {
      name?: string
      company?: string
      email?: string
      brief?: string
    }

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }

    const text = [
      `Name:    ${name.trim()}`,
      `Company: ${company?.trim() || '—'}`,
      `Email:   ${email.trim()}`,
      '',
      'Brief:',
      brief?.trim() || '—',
    ].join('\n')

    const res = await fetch(RESEND_API, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from:    'hello@roadhouse.capital',
        to:      'roadhousesyndicate@gmail.com',
        subject: `Studio inquiry — ${company?.trim() || name.trim()}`,
        text,
      }),
    })

    if (!res.ok) {
      console.error('[api/studio/contact] Resend error', res.status, await res.text())
      return NextResponse.json({ error: 'Failed to send.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/studio/contact]', err)
    return NextResponse.json({ error: 'Failed to send.' }, { status: 500 })
  }
}
