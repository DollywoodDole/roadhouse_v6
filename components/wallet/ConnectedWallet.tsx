'use client'

/**
 * RoadHouse Capital — Connected Wallet Portal Card
 * Renders inside app/portal/page.tsx.
 * Not connected: prompt with connect button.
 * Connected: network indicator, adapter name/icon, full address, copy.
 */

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Copy, Check, Wallet } from 'lucide-react'
import NetworkIndicator from './NetworkIndicator'

export default function ConnectedWallet() {
  const { publicKey, connected, wallet } = useWallet()
  const { setVisible } = useWalletModal()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!publicKey) return
    await navigator.clipboard.writeText(publicKey.toBase58())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Not connected ────────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <div className="bg-rh-card border border-rh-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono text-rh-muted uppercase tracking-widest">
            Solana Wallet
          </span>
        </div>
        <p className="text-rh-muted text-sm mb-4 leading-relaxed">
          Connect a Solana wallet to register your address for the $ROAD airdrop at mainnet launch.
        </p>
        <button
          onClick={() => setVisible(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded border border-amber-500/40 bg-amber-500/5 text-amber-400 text-sm hover:border-amber-400 hover:bg-amber-500/10 transition-colors"
        >
          <Wallet size={14} />
          Connect Wallet
        </button>
      </div>
    )
  }

  // ── Connected ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-rh-card border border-rh-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono text-rh-muted uppercase tracking-widest">
          Solana Wallet
        </span>
        <NetworkIndicator />
      </div>

      {/* Adapter name + icon */}
      <div className="flex items-center gap-2.5 mb-4">
        {wallet?.adapter.icon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={wallet.adapter.icon}
            alt={wallet.adapter.name}
            width={20}
            height={20}
            className="rounded"
          />
        )}
        <span className="text-rh-text text-sm font-medium">{wallet?.adapter.name}</span>
        <span className="text-[10px] font-mono text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
          Connected
        </span>
      </div>

      {/* Full address */}
      <div className="mb-4">
        <div className="text-[10px] font-mono text-rh-muted uppercase tracking-widest mb-1.5">
          Address
        </div>
        <div className="font-mono text-xs text-rh-text break-all bg-rh-surface border border-rh-border rounded px-3 py-2.5">
          {publicKey?.toBase58()}
        </div>
      </div>

      {/* Copy button */}
      <button
        onClick={copy}
        className="inline-flex items-center gap-2 px-3 py-2 rounded border border-rh-border text-rh-muted text-xs hover:border-gold/40 hover:text-gold transition-colors"
      >
        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
        {copied ? 'Copied!' : 'Copy full address'}
      </button>
    </div>
  )
}
