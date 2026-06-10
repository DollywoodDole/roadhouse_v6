/**
 * RoadHouse Capital — CSP Violation Report Collector
 * ────────────────────────────────────────────────────
 * POST /api/csp-report
 * Called automatically by the browser when Content-Security-Policy-Report-Only
 * header violations are detected. No auth required (called by the browser).
 *
 * Writes up to 500 recent violations to KV under csp:violations (list, LTRIM'd).
 * Inspect with: GET https://roadhouse.capital/api/csp-report (CRON_SECRET gated).
 *
 * Run Report-Only for 1–2 weeks of real traffic before enforcing.
 * Focus on: script-src, connect-src, frame-src (Stripe, Phantom, Solflare).
 */

import { NextRequest, NextResponse } from 'next/server'

const KV_LIST_KEY = 'csp:violations'
const MAX_STORED  = 500

export async function POST(req: NextRequest) {
  const kvUrl   = process.env.KV_REST_API_URL
  const kvToken = process.env.KV_REST_API_TOKEN

  // Parse violation — browsers send application/csp-report or application/json
  let report: unknown
  try {
    report = await req.json()
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  const violation = (report as { 'csp-report'?: unknown })?.['csp-report'] ?? report

  const entry = JSON.stringify({
    ts:  Date.now(),
    ip:  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown',
    ua:  req.headers.get('user-agent')?.slice(0, 120) ?? '',
    ...(typeof violation === 'object' && violation !== null ? violation : { raw: violation }),
  })

  // Best-effort KV write — never block the browser
  if (kvUrl && kvToken) {
    try {
      // LPUSH + LTRIM keeps list bounded at MAX_STORED newest entries
      await fetch(`${kvUrl}/lpush/${encodeURIComponent(KV_LIST_KEY)}`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${kvToken}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify([entry]),
        cache:   'no-store',
      })
      await fetch(`${kvUrl}/ltrim/${encodeURIComponent(KV_LIST_KEY)}/0/${MAX_STORED - 1}`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${kvToken}` },
        cache:   'no-store',
      })
    } catch {
      // ignore — CSP reporting must never error
    }
  }

  return new NextResponse(null, { status: 204 })
}

// GET: retrieve recent violations (CRON_SECRET gated)
export async function GET(req: NextRequest) {
  const auth   = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const kvUrl   = process.env.KV_REST_API_URL
  const kvToken = process.env.KV_REST_API_TOKEN
  if (!kvUrl || !kvToken) {
    return NextResponse.json({ error: 'KV not provisioned' }, { status: 503 })
  }

  const res = await fetch(
    `${kvUrl}/lrange/${encodeURIComponent(KV_LIST_KEY)}/0/49`,
    { headers: { Authorization: `Bearer ${kvToken}` }, cache: 'no-store' }
  )
  const { result } = await res.json()
  const violations = (result as string[] ?? []).map(s => { try { return JSON.parse(s) } catch { return s } })

  return NextResponse.json({ count: violations.length, violations })
}
