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
  // Machine: Bearer CRON_SECRET (cron / programmatic tools)
  const header = req.headers.get('authorization') ?? ''
  if (process.env.CRON_SECRET && header === `Bearer ${process.env.CRON_SECRET.trim()}`) return true

  // Human: httpOnly motors-admin cookie (admin panel browser session)
  const cookie = req.cookies.get('motors-admin')?.value
  const secret = process.env.MOTORS_ADMIN_SECRET?.trim()
  return !!(cookie && secret && cookie === secret)
}

const VALID_STATUSES: MotorsLead['status'][] = ['new', 'contacted', 'approved', 'closed', 'dead']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!auth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: { status: MotorsLead['status'] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: `Invalid status: ${body.status}` }, { status: 400 })
  }

  const redis = getRedis()
  const raw   = await redis.get<string>(`motors:leads:${id}`)

  if (!raw) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  const lead: MotorsLead = typeof raw === 'string' ? JSON.parse(raw) : raw
  lead.status = body.status
  await redis.set(`motors:leads:${id}`, JSON.stringify(lead))

  return NextResponse.json({ success: true })
}
