/**
 * RoadHouse Capital — $ROAD Backfill
 * ────────────────────────────────────
 * POST /api/road/backfill
 * Headers: { Authorization: Bearer CRON_SECRET }
 *
 * Use when ROAD_ACCRUAL_MODE was absent (or wrong) and members missed monthly
 * accruals. Scans all active Stripe subscriptions, computes how many monthly
 * accruals each member should have received based on sub.start_date, compares
 * against existing KV history length, and adds only the missing months.
 *
 * Idempotency: safe to re-run — counts existing history entries to determine
 * how many months are already recorded, and only accrues the delta.
 *
 * Optional body:
 *   { dryRun: true }   — returns plan without writing to KV
 *   { maxMonths: N }   — cap months per member (default: 24 safety ceiling)
 *
 * Returns 200 always — log the response to verify before re-running.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getMembershipTier } from '@/lib/membership'
import { accrueMonthlyRoad, getRoadBalance, ACCRUAL } from '@/lib/road-balance'

export const maxDuration = 300

const CRON_SECRET   = process.env.CRON_SECRET
const SAFETY_CEIL   = 24 // never accrue more than 2 years per member without explicit override

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json({ error: 'KV store not provisioned' }, { status: 503 })
  }

  let dryRun    = false
  let maxMonths = SAFETY_CEIL
  try {
    const body = await req.json()
    if (body?.dryRun)    dryRun    = true
    if (body?.maxMonths) maxMonths = Math.min(Number(body.maxMonths), SAFETY_CEIL)
  } catch {
    // empty body — defaults apply
  }

  const now = Date.now()
  const results = {
    scanned:   0,
    skipped:   0,
    backfilled: 0,
    already_current: 0,
    total_road_added: 0,
    errors:    [] as { customerId: string; reason: string }[],
    plan:      [] as { customerId: string; tier: string; existing: number; owed: number; delta: number }[],
    dryRun,
  }

  let startingAfter: string | undefined
  let hasMore = true

  while (hasMore) {
    const page = await stripe.subscriptions.list({
      status:         'active',
      limit:          100,
      starting_after: startingAfter,
      expand:         ['data.items.data.price', 'data.customer'],
    })

    hasMore       = page.has_more
    startingAfter = page.data[page.data.length - 1]?.id

    for (const sub of page.data) {
      results.scanned++

      const priceId = sub.items.data[0]?.price?.id
      if (!priceId) { results.skipped++; continue }

      const membershipTier = getMembershipTier(priceId)
      if (!membershipTier || !ACCRUAL[membershipTier]) { results.skipped++; continue }

      const customer   = sub.customer
      const customerId = typeof customer === 'string' ? customer : customer.id
      const email      =
        typeof customer === 'object' && 'email' in customer ? (customer.email ?? '') : ''

      // How many monthly accruals has this member earned?
      // Use full calendar months since subscription start — same cadence as the cron.
      const startMs     = sub.start_date * 1000
      const monthsOwed  = Math.min(
        Math.floor((now - startMs) / (30.44 * 24 * 60 * 60 * 1000)) + 1, // +1 for current month
        maxMonths
      )

      // How many accruals does KV already have?
      let existingMonths = 0
      try {
        const kv = await getRoadBalance(customerId)
        // Count only monthly-accrual entries (ignores manual grants, contributions, etc.)
        existingMonths = kv?.history.filter(h => h.reason.startsWith('Monthly accrual')).length ?? 0
      } catch {
        // KV miss — treat as 0 existing
      }

      const delta = Math.max(0, monthsOwed - existingMonths)

      results.plan.push({ customerId, tier: membershipTier, existing: existingMonths, owed: monthsOwed, delta })

      if (delta === 0) {
        results.already_current++
        continue
      }

      if (dryRun) {
        results.backfilled++
        results.total_road_added += delta * (ACCRUAL[membershipTier] ?? 0)
        continue
      }

      // Apply missing months sequentially
      for (let m = 0; m < delta; m++) {
        try {
          const { accrued } = await accrueMonthlyRoad(customerId, email, membershipTier)
          results.total_road_added += accrued
        } catch (err) {
          results.errors.push({ customerId, reason: `month ${m + 1}: ${String(err)}` })
          break // stop this member on first error
        }
      }
      results.backfilled++
    }
  }

  console.log(JSON.stringify({ evt: 'road.backfill.complete', ...results, plan: undefined }))

  return NextResponse.json({
    ok: true,
    date: new Date().toISOString(),
    ...results,
  })
}
