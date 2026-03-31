/**
 * RoadHouse Capital — $ROAD Token Utilities
 * Hooks and helpers for reading $ROAD balance and token-gating
 */

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAssociatedTokenAddress, getAccount, TokenAccountNotFoundError } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import {
  ROAD_MINT_PUBKEY,
  ROAD_TOKEN,
  getTierFromBalance,
  TIER_LABELS,
  TIER_THRESHOLDS,
  TierKey,
} from '@/lib/solana'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RoadTokenState {
  balance:    number          // Human-readable balance (divided by decimals)
  rawBalance: bigint          // Raw on-chain amount
  tier:       TierKey
  tierLabel:  string
  loading:    boolean
  error:      string | null
  refresh:    () => Promise<void>
}

// Backoff intervals (seconds): 30s → 60s → 120s → 300s on consecutive errors
const POLL_INTERVALS = [30, 60, 120, 300]

// ─── useRoadToken hook ────────────────────────────────────────────────────────

export function useRoadToken(): RoadTokenState {
  const { connection }     = useConnection()
  const { publicKey, connected } = useWallet()

  const [balance,    setBalance]    = useState(0)
  const [rawBalance, setRawBalance] = useState(BigInt(0))
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const timerRef   = useRef<ReturnType<typeof setTimeout>>()
  const errCount   = useRef(0)

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected || !ROAD_MINT_PUBKEY || document.hidden) return

    setLoading(true)
    try {
      const ata          = await getAssociatedTokenAddress(ROAD_MINT_PUBKEY, publicKey)
      const tokenAccount = await getAccount(connection, ata)
      const raw          = tokenAccount.amount
      const human        = Number(raw) / Math.pow(10, ROAD_TOKEN.decimals)
      setRawBalance(raw)
      setBalance(human)
      setError(null)
      errCount.current = 0
    } catch (e) {
      if (e instanceof TokenAccountNotFoundError) {
        // Wallet has no $ROAD token account — normal for new members
        setBalance(0)
        setRawBalance(BigInt(0))
        setError(null)
        errCount.current = 0
      } else {
        errCount.current = Math.min(errCount.current + 1, POLL_INTERVALS.length - 1)
        setError('Failed to load $ROAD balance')
        console.error('[useRoadToken] fetch error:', e)
      }
    } finally {
      setLoading(false)
    }
  }, [publicKey, connected, connection])

  useEffect(() => {
    if (!connected || !publicKey) {
      setBalance(0)
      setRawBalance(BigInt(0))
      setError(null)
      errCount.current = 0
      return
    }

    // Recursive setTimeout with exponential backoff on errors
    const schedule = () => {
      const delay = POLL_INTERVALS[errCount.current] * 1000
      timerRef.current = setTimeout(async () => {
        await fetchBalance()
        schedule()
      }, delay)
    }

    // Pause polling when tab is hidden, resume on visibility change
    const onVisibility = () => {
      if (!document.hidden) {
        fetchBalance()
        schedule()
      } else {
        clearTimeout(timerRef.current)
      }
    }

    fetchBalance()
    schedule()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearTimeout(timerRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [connected, publicKey, fetchBalance])

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
  requiredTier:    TierKey
  requiredBalance?: number // override — use exact amount instead of tier threshold
}

export function useTokenGate({ requiredTier, requiredBalance }: TokenGateOptions) {
  const { connected }          = useWallet()
  const { balance, tier, loading } = useRoadToken()

  const required = requiredBalance ?? TIER_THRESHOLDS[requiredTier]

  return useMemo(() => ({
    hasAccess: connected && balance >= required,
    connected,
    balance,
    tier,
    required,
    loading,
  }), [connected, balance, tier, required, loading])
}

// ─── Format helpers ───────────────────────────────────────────────────────────

export function formatRoadBalance(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000)     return `${(amount / 1_000).toFixed(1)}k`
  return amount.toLocaleString()
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}
