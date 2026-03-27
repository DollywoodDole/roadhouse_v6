/**
 * RoadHouse Capital — Wallet Registration
 * ─────────────────────────────────────────
 * POST /api/wallet/register
 * Body: { customerId: string; walletAddress: string }
 *
 * Registers a Solana wallet address against the member's $ROAD record in KV.
 * Called from the portal when a wallet is connected.
 * Devnet only — no mainnet writes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { registerWallet } from '@/lib/road-balance'

// Basic base58 sanity check — 32–44 alphanumeric chars, no 0/O/I/l
const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export async function POST(req: NextRequest) {
  let body: { customerId?: string; walletAddress?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { customerId, walletAddress } = body

  if (!customerId || !customerId.startsWith('cus_')) {
    return NextResponse.json({ error: 'Valid Stripe customer ID required' }, { status: 400 })
  }

  if (!walletAddress || !BASE58_RE.test(walletAddress)) {
    return NextResponse.json({ error: 'Invalid Solana wallet address' }, { status: 400 })
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json({ error: 'KV store not provisioned' }, { status: 503 })
  }

  try {
    const updated = await registerWallet(customerId, walletAddress)
    console.log(JSON.stringify({
      evt:           'wallet.registered',
      customerId,
      walletAddress: `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`,
    }))
    return NextResponse.json({ ok: true, walletAddress: updated.walletAddress })
  } catch (err) {
    const msg = String(err)
    if (msg.includes('No $ROAD balance record')) {
      return NextResponse.json({ error: 'No membership record found. Complete checkout first.' }, { status: 404 })
    }
    console.error(JSON.stringify({ evt: 'wallet.register_failed', error: msg }))
    return NextResponse.json({ error: 'Failed to register wallet' }, { status: 500 })
  }
}
