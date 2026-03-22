/**
 * RoadHouse Capital — $ROAD Balance API
 * ─────────────────────────────────────
 * GET /api/road/balance?customerId=cus_xxx
 *
 * Returns the member's off-chain $ROAD balance from Vercel KV.
 * Requires KV_REST_API_URL and KV_REST_API_TOKEN to be set.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRoadBalance } from '@/lib/road-balance'

export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get('customerId')

  if (!customerId || !customerId.startsWith('cus_')) {
    return NextResponse.json({ error: 'Valid Stripe customer ID required' }, { status: 400 })
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json({ error: 'KV store not provisioned' }, { status: 503 })
  }

  try {
    const balance = await getRoadBalance(customerId)
    if (!balance) {
      return NextResponse.json({ error: 'No $ROAD record found' }, { status: 404 })
    }
    return NextResponse.json(balance)
  } catch (err) {
    console.error(JSON.stringify({ evt: 'road.balance.get_failed', error: String(err) }))
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 })
  }
}
