/**
 * RoadHouse Capital — $ROAD Balance API
 * ─────────────────────────────────────
 * GET /api/road/balance?customerId=cus_xxx
 *
 * Returns the member's off-chain $ROAD balance from Vercel KV.
 * Requires KV_REST_API_URL and KV_REST_API_TOKEN to be set.
 */

/**
 * RoadHouse Capital — $ROAD Balance API
 * ─────────────────────────────────────
 * GET /api/road/balance?customerId=cus_xxx
 * GET /api/road/balance?walletAddress=<solana pubkey>
 *
 * Returns the member's off-chain $ROAD balance from Vercel KV.
 * walletAddress path uses the wallet:{address} → customerId reverse index
 * and returns only non-sensitive fields (balance + tier).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRoadBalance, getCustomerIdByWallet } from '@/lib/road-balance'

export async function GET(req: NextRequest) {
  const customerId    = req.nextUrl.searchParams.get('customerId')
  const walletAddress = req.nextUrl.searchParams.get('walletAddress')

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json({ error: 'KV store not provisioned' }, { status: 503 })
  }

  // Resolve customerId from wallet address if that's what was passed
  let resolvedCustomerId = customerId

  if (!resolvedCustomerId && walletAddress) {
    try {
      const linked = await getCustomerIdByWallet(walletAddress)
      if (!linked) {
        return NextResponse.json({ error: 'Wallet not linked' }, { status: 404 })
      }
      resolvedCustomerId = linked
    } catch (err) {
      console.error(JSON.stringify({ evt: 'road.balance.wallet_lookup_failed', error: String(err) }))
      return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 })
    }
  }

  if (!resolvedCustomerId || !resolvedCustomerId.startsWith('cus_')) {
    return NextResponse.json({ error: 'customerId or walletAddress required' }, { status: 400 })
  }

  try {
    const balance = await getRoadBalance(resolvedCustomerId)
    if (!balance) {
      return NextResponse.json({ error: 'No $ROAD record found' }, { status: 404 })
    }
    // walletAddress lookup is unauthenticated — return only non-sensitive fields
    if (!customerId) {
      return NextResponse.json({ balance: balance.balance, tier: balance.tier })
    }
    return NextResponse.json(balance)
  } catch (err) {
    console.error(JSON.stringify({ evt: 'road.balance.get_failed', error: String(err) }))
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 })
  }
}
