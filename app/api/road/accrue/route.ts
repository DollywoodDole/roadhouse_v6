/**
 * RoadHouse Capital — Monthly $ROAD Accrual
 * ──────────────────────────────────────────
 * POST /api/road/accrue
 * Headers: { Authorization: Bearer CRON_SECRET }
 *
 * Triggered by GitHub Actions cron on the 1st of each month.
 * Loops all active Stripe subscriptions, accrues $ROAD per tier,
 * and updates Vercel KV. Returns an accrual summary.
 *
 * Always returns 200 — cron should not retry on partial failure.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getMembershipTier } from '@/lib/membership'
import { accrueMonthlyRoad, ACCRUAL } from '@/lib/road-balance'

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(req: NextRequest) {
  // Authenticate the cron caller
  const auth = req.headers.get('authorization')
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json({ error: 'KV store not provisioned' }, { status: 503 })
  }

  const results = {
    processed: 0,
    accrued:   0,
    skipped:   0,
    errors:    [] as string[],
  }

  // Page through all active subscriptions
  let startingAfter: string | undefined
  let hasMore = true

  while (hasMore) {
    const page = await stripe.subscriptions.list({
      status:          'active',
      limit:           100,
      starting_after:  startingAfter,
      expand:          ['data.items.data.price', 'data.customer'],
    })

    hasMore        = page.has_more
    startingAfter  = page.data[page.data.length - 1]?.id

    for (const sub of page.data) {
      const priceId = sub.items.data[0]?.price?.id
      if (!priceId) { results.skipped++; continue }

      const membershipTier = getMembershipTier(priceId)
      if (!membershipTier || !ACCRUAL[membershipTier]) { results.skipped++; continue }

      const customer = sub.customer
      const customerId = typeof customer === 'string' ? customer : customer.id
      const email =
        typeof customer === 'object' && 'email' in customer
          ? (customer.email ?? '')
          : ''

      try {
        await accrueMonthlyRoad(customerId, email, membershipTier)
        results.processed++
        results.accrued += ACCRUAL[membershipTier]
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
