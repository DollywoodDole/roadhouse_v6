'use client'

import { NETWORK } from '@/lib/solana'

/**
 * Small pulsing badge showing the current Solana network.
 * Renders nothing on mainnet-beta — only visible on devnet.
 */
export default function NetworkIndicator() {
  if (NETWORK === 'mainnet-beta') return null

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-yellow-400/30 bg-yellow-400/5">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-yellow-400" />
      </span>
      <span className="text-[9px] tracking-[0.2em] uppercase font-mono text-yellow-400">
        {NETWORK}
      </span>
    </span>
  )
}
