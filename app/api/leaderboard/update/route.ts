import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

/**
 * POST /api/leaderboard/update
 *
 * Called by weeklyLeaderboard() in RoadHouseOS.js after each Monday run.
 * Writes the top-10 leaderboard to KV so the Guild tab in the dashboard
 * can read it directly — same data the Discord post uses, no Sheets API needed.
 *
 * KV keys written:
 *   leaderboard:current  → { week, top10, updatedAt }   (no TTL — always current)
 *   leaderboard:YYYY-WNN → same payload                 (52-week archive, 400d TTL)
 *
 * Auth: CRON_SECRET Bearer token (same as /api/road/accrue)
 */

interface LeaderboardEntry {
  rank:        number
  memberId:    string
  handle:      string
  score:       number
  tier:        string
  weeklyDelta: number
}

interface LeaderboardPayload {
  week:  string
  top10: LeaderboardEntry[]
}

function getRedis(): Redis {
  const url   = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN not set')
  return new Redis({ url, token })
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: LeaderboardPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { week, top10 } = payload

  if (!week || !/^\d{4}-W\d{2}$/.test(week) || !Array.isArray(top10)) {
    return NextResponse.json({ error: 'week (YYYY-WNN) and top10[] required' }, { status: 400 })
  }

  const record = {
    week,
    top10:     top10.slice(0, 10),
    updatedAt: new Date().toISOString(),
  }

  const redis = getRedis()
  await Promise.all([
    redis.set('leaderboard:current', record),
    redis.set(`leaderboard:${week}`, record, { ex: 60 * 60 * 24 * 400 }),
  ])

  console.log(JSON.stringify({ evt: 'leaderboard.update', week, entries: top10.length }))

  return NextResponse.json({ ok: true, week, entries: top10.length })
}

/**
 * GET /api/leaderboard/update?week=YYYY-WNN
 *
 * Read path for the dashboard Guild tab.
 * Omit week param to get the current leaderboard.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const week = searchParams.get('week')

  const key =
    week && /^\d{4}-W\d{2}$/.test(week)
      ? `leaderboard:${week}`
      : 'leaderboard:current'

  const data = await getRedis().get(key)

  if (!data) {
    return NextResponse.json({ error: 'No leaderboard data yet' }, { status: 404 })
  }

  return NextResponse.json(data)
}
