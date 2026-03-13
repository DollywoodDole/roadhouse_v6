/**
 * RoadHouse Capital — $ROAD Token Utilities
 * Hooks and helpers for reading $ROAD balance and token-gating
 */

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useEffect, useState } from 'react'
import { getAssociatedTokenAddress, getAccount, TokenAccountNotFoundError } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import {
  ROAD_MINT_PUBKEY,
  ROAD_TOKEN,
  getTierFromBalance,
  TIER_LABELS,
  TierKey,
} from '@/lib/solana'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoadTokenState {
  balance: number          // Human-readable balance (divided by decimals)
  rawBalance: bigint       // Raw on-chain amount
  tier: TierKey
  tierLabel: string
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

// ─── useRoadToken hook ────────────────────────────────────────────────────────

export function useRoadToken(): RoadTokenState {
  const { connection } = useConnection()
  const { publicKey, connected } = useWallet()

  const [balance, setBalance] = useState(0)
  const [rawBalance, setRawBalance] = useState(BigInt(0))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected || !ROAD_MINT_PUBKEY) {
      setBalance(0)
      setRawBalance(0n)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const ata = await getAssociatedTokenAddress(ROAD_MINT_PUBKEY, publicKey)
      const tokenAccount = await getAccount(connection, ata)
      const raw = tokenAccount.amount
      const human = Number(raw) / Math.pow(10, ROAD_TOKEN.decimals)
      setRawBalance(raw)
      setBalance(human)
    } catch (e) {
      if (e instanceof TokenAccountNotFoundError) {
        // Wallet exists but has no $ROAD — normal for new users
        setBalance(0)
        setRawBalance(0n)
      } else {
        console.error('[useRoadToken] fetch error:', e)
        setError('Failed to load $ROAD balance')
      }
    } finally {
      setLoading(false)
    }
  }, [publicKey, connected, connection])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  // Poll balance every 30s while connected
  useEffect(() => {
    if (!connected) return
    const interval = setInterval(fetchBalance, 30_000)
    return () => clearInterval(interval)
  }, [connected, fetchBalance])

  const tier = getTierFromBalance(balance)

  return {
    balance,
    rawBalance,
    tier,
    tierLabel: TIER_LABELS[tier],
    loading,
    error,
    refresh: fetchBalance,
  }
}

// ─── useTokenGate hook ────────────────────────────────────────────────────────

interface TokenGateOptions {
  requiredTier: TierKey
  requiredBalance?: number // override — use exact amount instead of tier
}

export function useTokenGate({ requiredTier, requiredBalance }: TokenGateOptions) {
  const { connected } = useWallet()
  const { balance, tier, loading } = useRoadToken()
  const { TIER_THRESHOLDS } = require('@/lib/solana')

  const required = requiredBalance ?? TIER_THRESHOLDS[requiredTier]
  const hasAccess = connected && balance >= required

  return {
    hasAccess,
    connected,
    balance,
    tier,
    required,
    loading,
  }
}

// ─── Format helpers ───────────────────────────────────────────────────────────

export function formatRoadBalance(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}k`
  return amount.toLocaleString()
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}