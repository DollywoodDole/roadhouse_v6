'use client'

/**
 * RoadHouse Capital — Inline Wallet Button
 * Compact connect/disconnect for the portal header and nav bars.
 * Three states: disconnected → connecting → connected (address + disconnect).
 * For the full dropdown with $ROAD balance, use ConnectButton instead.
 */

import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Loader2, Wallet, LogOut } from 'lucide-react'

function shorten(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`
}

export default function WalletButton() {
  const { publicKey, disconnect, connecting, connected } = useWallet()
  const { setVisible } = useWalletModal()

  if (connecting) {
    return (
      <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-amber-500/30 text-amber-400 text-[10px] tracking-wider opacity-70">
        <Loader2 size={11} className="animate-spin" />
        Connecting…
      </button>
    )
  }

  if (connected && publicKey) {
    return (
      <div className="inline-flex items-center gap-1">
        {/* Address — click to switch wallet */}
        <button
          onClick={() => setVisible(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-rh-border bg-rh-card text-rh-text text-[10px] tracking-wider hover:border-gold/40 transition-colors"
        >
          <Wallet size={11} className="text-gold" />
          {shorten(publicKey.toBase58())}
        </button>

        {/* Disconnect */}
        <button
          onClick={() => disconnect()}
          title="Disconnect wallet"
          className="p-1.5 rounded border border-rh-border text-rh-muted hover:text-red-400 hover:border-red-400/30 transition-colors"
        >
          <LogOut size={11} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setVisible(true)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-amber-500/40 bg-amber-500/5 text-amber-400 text-[10px] tracking-wider hover:border-amber-400 hover:bg-amber-500/10 transition-colors"
    >
      <Wallet size={11} />
      Connect Wallet
    </button>
  )
}
