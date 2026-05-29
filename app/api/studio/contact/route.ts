import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    await resend.emails.send({
      from:    'hello@roadhouse.capital',
      to:      'roadhousesyndicate@gmail.com',
      subject: `Studio inquiry — ${company?.trim() || name.trim()}`,
      text: [
        `Name:    ${name.trim()}`,
        `Company: ${company?.trim() || '—'}`,
        `Email:   ${email.trim()}`,
        '',
        'Brief:',
        brief?.trim() || '—',
      ].join('\n'),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/studio/contact]', err)
    return NextResponse.json({ error: 'Failed to send.' }, { status: 500 })
  }
}
