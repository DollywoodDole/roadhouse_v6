/**
 * RoadHouse Capital — Solana Configuration
 * All Solana objects are lazy — never instantiated at module load time.
 * This prevents SSR/build crashes since @solana/web3.js is browser-only.
 */

import { clusterApiUrl, PublicKey } from '@solana/web3.js'

export type SolanaNetwork = 'devnet' | 'mainnet-beta'

export const NETWORK: SolanaNetwork =
  (process.env.NEXT_PUBLIC_SOLANA_NETWORK as SolanaNetwork) ?? 'devnet'

function resolveRpc(): string {
  if (process.env.NEXT_PUBLIC_SOLANA_RPC) {
    return process.env.NEXT_PUBLIC_SOLANA_RPC
  }
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return `${window.location.origin}/rpc`
  }
  return clusterApiUrl(NETWORK)
}

export const RPC_ENDPOINT = resolveRpc()

// ── Lazy connection — only created in browser, never at module load ────────────
let _connection: import('@solana/web3.js').Connection | null = null
export function getConnection() {
  if (typeof window === 'undefined') {
    throw new Error('Solana Connection is only available in the browser')
  }
  if (!_connection) {
    const { Connection } = require('@solana/web3.js')
    _connection = new Connection(RPC_ENDPOINT, 'confirmed')
  }
  return _connection!
}

// ─── $ROAD Token ──────────────────────────────────────────────────────────────
export const ROAD_MINT_ADDRESS =
  process.env.NEXT_PUBLIC_ROAD_MINT_ADDRESS ?? ''

export const ROAD_MINT_PUBKEY = ROAD_MINT_ADDRESS
  ? new PublicKey(ROAD_MINT_ADDRESS)
  : null

export const ROAD_TOKEN = {
  symbol:      '$ROAD',
  name:        'RoadHouse Governance Token',
  decimals:    6,
  totalSupply: 1_000_000_000,
  mintAddress: ROAD_MINT_ADDRESS,
} as const

// ─── NFT Collections ──────────────────────────────────────────────────────────
export const NFT_COLLECTIONS = {
  founding:  process.env.NEXT_PUBLIC_NFT_FOUNDING_COLLECTION ?? '',
  regular:   process.env.NEXT_PUBLIC_NFT_REGULAR_COLLECTION  ?? '',
  ranchHand: process.env.NEXT_PUBLIC_NFT_RANCH_COLLECTION    ?? '',
  partner:   process.env.NEXT_PUBLIC_NFT_PARTNER_COLLECTION  ?? '',
} as const

// ─── Membership Tier Thresholds ───────────────────────────────────────────────
export const TIER_THRESHOLDS = {
  guest:     0,
  regular:   100,
  ranchHand: 500,
  partner:   2_000,
  steward:   10_000,
  praetor:   50_000,
} as const

export type TierKey = keyof typeof TIER_THRESHOLDS

export function getTierFromBalance(balance: number): TierKey {
  if (balance >= TIER_THRESHOLDS.praetor)   return 'praetor'
  if (balance >= TIER_THRESHOLDS.steward)   return 'steward'
  if (balance >= TIER_THRESHOLDS.partner)   return 'partner'
  if (balance >= TIER_THRESHOLDS.ranchHand) return 'ranchHand'
  if (balance >= TIER_THRESHOLDS.regular)   return 'regular'
  return 'guest'
}

export const TIER_LABELS: Record<TierKey, string> = {
  guest:     'Guest',
  regular:   'Regular',
  ranchHand: 'Ranch Hand',
  partner:   'Partner',
  steward:   'Steward',
  praetor:   'Praetor',
}

// ─── Treasury ─────────────────────────────────────────────────────────────────
export const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_WALLET ?? ''
export const MULTISIG_WALLET  = process.env.NEXT_PUBLIC_MULTISIG_WALLET  ?? ''