'use client'

/**
 * RoadHouse Capital — TokenGate Component
 * Wraps any content behind a $ROAD balance / tier requirement.
 * Shows a styled lock state if the user doesn't qualify.
 */

import { ReactNode } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Loader2, Lock } from 'lucide-react'
import { useTokenGate, formatRoadBalance } from '@/lib/road-token'
import { TierKey, TIER_LABELS, TIER_THRESHOLDS } from '@/lib/solana'
import ConnectButton from './ConnectButton'

interface TokenGateProps {
  requiredTier: TierKey
  children: ReactNode
  // Optional custom lock UI
  lockedMessage?: string
  showBalance?: boolean
}

export default function TokenGate({
  requiredTier,
  children,
  lockedMessage,
  showBalance = true,
}: TokenGateProps) {
  const { connected } = useWallet()
  const { setVisible } = useWalletModal()
  const { hasAccess, balance, loading, required } = useTokenGate({ requiredTier })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-rh-muted">
        <Loader2 size={18} className="animate-spin mr-2" />
        <span className="text-[11px] tracking-widest uppercase">Checking access...</span>
      </div>
    )
  }

  if (hasAccess) return <>{children}</>

  // ── Locked state ─────────────────────────────────────────────────────────
  return (
    <div className="relative overflow-hidden rounded-lg border border-rh-border bg-rh-card">
      {/* Blurred preview of children */}
      <div className="pointer-events-none select-none blur-sm opacity-30 max-h-48 overflow-hidden">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-rh-black/70 backdrop-blur-sm">
        <div className="flex items-center justify-center w-12 h-12 rounded-full border border-gold/30 bg-rh-elevated">
          <Lock size={20} className="text-gold" />
        </div>

        <div className="text-center px-6">
          <div
            className="text-xl font-light italic text-rh-text mb-1"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            {TIER_LABELS[requiredTier]} Access Required
          </div>
          <p className="text-[11px] text-rh-muted leading-relaxed max-w-xs">
            {lockedMessage ??
              `This content requires ${formatRoadBalance(required)} $ROAD. ${
                showBalance && connected
                  ? `You currently hold ${formatRoadBalance(balance)} $ROAD.`
                  : ''
              }`}
          </p>
        </div>

        {!connected ? (
          <ConnectButton />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] text-rh-faint tracking-wider">
              Need {formatRoadBalance(required - balance)} more $ROAD to unlock
            </div>
            <a
              href="#membership"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('membership')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-4 py-2 text-[10px] tracking-widest uppercase border border-gold/30 text-gold hover:bg-gold/5 rounded transition-colors"
            >
              Upgrade Membership
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
