/**
 * RoadHouse Capital — Monthly $ROAD Accrual
 * ──────────────────────────────────────────
 * POST /api/road/accrue
 * Headers: { Authorization: Bearer CRON_SECRET }
 *
 * Two modes, determined by request body:
 *
 * STRIPE SCAN MODE (GitHub Actions cron, empty body):
 *   Loops all active Stripe subscriptions, accrues $ROAD per tier.
 *
 * BATCH MODE (Apps Script ops webhook, body = { week, accruals[] }):
 *   Accepts a pre-computed batch from the ops layer.
 *   Body: { week: "YYYY-WNN", accruals: [{ customerId, amount, tier }] }
 *   Returns: { processed, capped, errors[], week }
 *
 * Always returns 200 — cron should not retry on partial failure.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getMembershipTier } from '@/lib/membership'
import { accrueMonthlyRoad, getRoadBalance, ACCRUAL } from '@/lib/road-balance'

const CRON_SECRET = process.env.CRON_SECRET

// Controls which caller is active. Default 'stripe' keeps the GitHub Actions cron live
// until the ops backfill is verified. Set to 'ops' in Vercel env to switch to the
// Apps Script webhook path and disable the cron. Never have both active simultaneously.
const MODE = (process.env.ROAD_ACCRUAL_MODE ?? 'stripe') as 'stripe' | 'ops'

interface AccrualItem {
  customerId: string
  amount:     number
  tier:       string
}

interface BatchPayload {
  week:     string
  accruals: AccrualItem[]
}

export async function POST(req: NextRequest) {
  // Authenticate the cron caller
  const auth = req.headers.get('authorization')
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json({ error: 'KV store not provisioned' }, { status: 503 })
  }

  // Detect mode — batch if body contains accruals[], Stripe scan if empty body
  let batchPayload: BatchPayload | null = null
  try {
    const body = await req.json()
    if (body && typeof body === 'object' && Array.isArray((body as BatchPayload).accruals)) {
      batchPayload = body as BatchPayload
    }
  } catch {
    // Empty body → Stripe scan mode
  }

  const isBatchRequest = batchPayload !== null

  // Mode guard — prevents double-accrual if both callers are simultaneously active
  if (isBatchRequest && MODE !== 'ops') {
    console.error(
      '[road/accrue] Batch request received but ROAD_ACCRUAL_MODE=stripe. ' +
      'Set ROAD_ACCRUAL_MODE=ops in Vercel env after verifying the ops backfill.'
    )
    return NextResponse.json(
      {
        error:       'Accrual mode mismatch',
        detail:      'Server is in stripe mode but received an ops batch payload. ' +
                     'Set ROAD_ACCRUAL_MODE=ops in Vercel to enable ops webhook path.',
        currentMode: MODE,
      },
      { status: 409 }
    )
  }

  if (!isBatchRequest && MODE !== 'stripe') {
    console.error(
      '[road/accrue] Stripe scan request received but ROAD_ACCRUAL_MODE=ops. ' +
      'The GitHub Actions cron should be disabled when ops mode is active.'
    )
    return NextResponse.json(
      {
        error:       'Accrual mode mismatch',
        detail:      'Server is in ops mode but received a stripe scan request (empty body). ' +
                     'Disable the GitHub Actions cron workflow to stop this caller.',
        currentMode: MODE,
      },
      { status: 409 }
    )
  }

  if (isBatchRequest) {
    return handleBatch(batchPayload!)
  }

  return handleStripeScan()
}

// ── Batch mode (ops layer webhook) ────────────────────────────────────────────

async function handleBatch(payload: BatchPayload): Promise<NextResponse> {
  const { week, accruals } = payload

  if (!week || !/^\d{4}-W\d{2}$/.test(week) || !Array.isArray(accruals) || accruals.length === 0) {
    return NextResponse.json({ error: 'week (YYYY-WNN) and accruals[] required' }, { status: 400 })
  }

  let processed = 0
  let cappedCount = 0
  const errors: { index: number; customerId: string; reason: string }[] = []

  await Promise.allSettled(
    accruals.map(async (item, i) => {
      const { customerId, tier } = item

      if (!customerId || !/^cus_[A-Za-z0-9]{14,}$/.test(customerId)) {
        errors.push({ index: i, customerId: customerId ?? '', reason: 'Invalid customerId format' })
        return
      }

      const membershipTier = getMembershipTier(tier) ?? tier // tier string passthrough if not a price ID
      if (!ACCRUAL[membershipTier]) {
        errors.push({ index: i, customerId, reason: `Unrecognised tier: ${tier}` })
        return
      }

      try {
        // Look up existing profile for email — avoids clearing stored email
        const existing = await getRoadBalance(customerId)
        const email = existing?.email ?? ''
        const result = await accrueMonthlyRoad(customerId, email, membershipTier)
        processed++
        if (result.capped) cappedCount++
      } catch (err) {
        errors.push({ index: i, customerId, reason: String(err) })
        console.error(JSON.stringify({ evt: 'road.accrue.batch_item_failed', customerId, error: String(err) }))
      }
    })
  )

  console.log(JSON.stringify({ evt: 'road.accrue.batch_complete', week, processed, capped: cappedCount, errors: errors.length }))

  return NextResponse.json({ processed, capped: cappedCount, errors, week })
}

// ── Stripe scan mode (GitHub Actions cron) ────────────────────────────────────

async function handleStripeScan(): Promise<NextResponse> {
  const results = {
    processed: 0,
    accrued:   0,
    skipped:   0,
    errors:    [] as string[],
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
      const priceId = sub.items.data[0]?.price?.id
      if (!priceId) { results.skipped++; continue }

      const membershipTier = getMembershipTier(priceId)
      if (!membershipTier || !ACCRUAL[membershipTier]) { results.skipped++; continue }

      const customer   = sub.customer
      const customerId = typeof customer === 'string' ? customer : customer.id
      const email =
        typeof customer === 'object' && 'email' in customer
          ? (customer.email ?? '')
          : ''

      try {
        const result = await accrueMonthlyRoad(customerId, email, membershipTier)
        results.processed++
        results.accrued += result.accrued
      } catch (err) {
        results.errors.push(`${customerId}: ${String(err)}`)
        console.error(JSON.stringify({ evt: 'road.accrue.member_failed', customerId, error: String(err) }))
      }
    }
  }

  console.log(JSON.stringify({ evt: 'road.accrue.complete', ...results }))

  return NextResponse.json({
    ok:   true,
    date: new Date().toISOString(),
    ...results,
  })
}
