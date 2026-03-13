'use client'

/**
 * RoadHouse Capital — Wallet Status Bar
 * Compact component for the sidebar showing tier + $ROAD balance.
 */

import { useWallet } from '@solana/wallet-adapter-react'
import { Loader2 } from 'lucide-react'
import { useRoadToken, formatRoadBalance, shortenAddress } from '@/lib/road-token'
import { TIER_THRESHOLDS, TierKey } from '@/lib/solana'
import ConnectButton from './ConnectButton'

// Tier colour accents
const TIER_COLORS: Record<TierKey, string> = {
  guest:    'text-rh-faint',
  regular:  'text-rh-muted',
  ranchHand:'text-gold-dark',
  partner:  'text-gold',
  steward:  'text-gold-light',
  praetor:  'text-gold-light gold-shimmer',
}

const TIER_ICONS: Record<TierKey, string> = {
  guest:    '◎',
  regular:  '◇',
  ranchHand:'◆',
  partner:  '⬡',
  steward:  '★',
  praetor:  '⚜',
}

export default function WalletStatus() {
  const { publicKey, connected } = useWallet()
  const { balance, tier, tierLabel, loading } = useRoadToken()

  if (!connected) {
    return (
      <div className="px-4 py-3 border-t border-rh-border">
        <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint mb-2">Wallet</div>
        <ConnectButton compact />
      </div>
    )
  }

  const nextTierKeys = Object.keys(TIER_THRESHOLDS) as TierKey[]
  const currentIdx = nextTierKeys.indexOf(tier)
  const nextTier = nextTierKeys[currentIdx + 1] as TierKey | undefined
  const nextThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : null
  const progress = nextThreshold
    ? Math.min((balance / nextThreshold) * 100, 100)
    : 100

  return (
    <div className="px-4 py-3 border-t border-rh-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint">Wallet</div>
        <ConnectButton compact className="!px-2 !py-1 !text-[9px]" />
      </div>

      {/* Address */}
      <div className="text-[10px] text-rh-muted font-mono mb-2">
        {publicKey ? shortenAddress(publicKey.toBase58(), 5) : ''}
      </div>

      {/* Balance */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-[9px] tracking-[0.2em] uppercase text-rh-faint">$ROAD</div>
        <div className="text-[11px] text-gold font-medium">
          {loading ? <Loader2 size={10} className="animate-spin" /> : formatRoadBalance(balance)}
        </div>
      </div>

      {/* Tier */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-[9px] tracking-[0.2em] uppercase text-rh-faint">Tier</div>
        <div className={`text-[11px] font-medium ${TIER_COLORS[tier]}`}>
          {TIER_ICONS[tier]} {tierLabel}
        </div>
      </div>

      {/* Progress to next tier */}
      {nextTier && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[8px] text-rh-faint">→ {tierLabel.replace(tierLabel, '')} next tier</div>
            <div className="text-[8px] text-rh-faint">
              {formatRoadBalance(balance)}/{formatRoadBalance(nextThreshold!)}
            </div>
          </div>
          <div className="h-px bg-rh-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-dark to-gold rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {tier === 'praetor' && (
        <div className="text-[9px] text-center text-gold-light tracking-wider mt-1">
          ⚜ Maximum Tier Achieved
        </div>
      )}
    </div>
  )
}
