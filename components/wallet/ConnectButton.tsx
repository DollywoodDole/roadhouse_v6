'use client'

/**
 * RoadHouse Capital — Phantom Connect Button
 * Custom styled wallet connect/disconnect button matching RH aesthetic.
 * Replaces the default @solana/wallet-adapter-react-ui button.
 */

import { useState, useRef, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useRouter } from 'next/navigation'
import { Loader2, Wallet, ChevronDown, Copy, LogOut, ExternalLink } from 'lucide-react'
import { useRoadToken, formatRoadBalance, shortenAddress } from '@/lib/road-token'
import { NETWORK } from '@/lib/solana'

interface ConnectButtonProps {
  compact?: boolean  // sidebar compact mode
  className?: string
}

export default function ConnectButton({ compact = false, className = '' }: ConnectButtonProps) {
  const { publicKey, disconnect, connecting, connected } = useWallet()
  const { setVisible } = useWalletModal()
  const { balance, tierLabel, loading: tokenLoading } = useRoadToken()
  const router = useRouter()

  const handleDisconnect = async () => {
    setMenuOpen(false)
    try { await fetch('/api/auth/wallet', { method: 'DELETE' }) } catch (_) {}
    disconnect()
    router.replace('/login')
  }

  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const copyAddress = async () => {
    if (!publicKey) return
    await navigator.clipboard.writeText(publicKey.toBase58())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const explorerUrl = publicKey
    ? `https://explorer.solana.com/address/${publicKey.toBase58()}${NETWORK === 'devnet' ? '?cluster=devnet' : ''}`
    : '#'

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <button
        onClick={() => setVisible(true)}
        disabled={connecting}
        className={`
          flex items-center gap-2 px-3 py-2 rounded
          border border-gold/30 text-gold hover:border-gold hover:bg-gold/5
          text-[10px] tracking-[0.25em] uppercase font-medium
          transition-all duration-200 disabled:opacity-50
          ${compact ? 'w-full justify-center' : ''}
          ${className}
        `}
      >
        {connecting ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Wallet size={12} />
        )}
        {connecting ? 'Connecting...' : compact ? 'Connect' : 'Connect Wallet'}
      </button>
    )
  }

  // ── Connected ──────────────────────────────────────────────────────────────
  return (
    <div className={`relative ${compact ? 'w-full' : ''}`} ref={menuRef}>
      <button
        onClick={() => setMenuOpen(v => !v)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded
          bg-rh-card border border-gold/20 hover:border-gold/50
          text-[10px] tracking-wider transition-all duration-200
          ${compact ? 'w-full justify-between' : ''}
          ${className}
        `}
      >
        {/* Status dot */}
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
        </span>

        <span className="text-rh-text font-medium">
          {publicKey ? shortenAddress(publicKey.toBase58()) : ''}
        </span>

        {!compact && (
          <>
            <span className="text-rh-faint">·</span>
            <span className="text-gold">
              {tokenLoading ? '...' : `${formatRoadBalance(balance)} $ROAD`}
            </span>
          </>
        )}

        <ChevronDown
          size={10}
          className={`text-rh-muted transition-transform ${menuOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {menuOpen && (
        <div className="
          absolute top-full mt-1 right-0 z-50
          w-64 bg-rh-elevated border border-rh-border rounded-lg
          shadow-2xl shadow-black/60 overflow-hidden
          animate-fade-in
        ">
          {/* Wallet info header */}
          <div className="px-4 py-3 border-b border-rh-border">
            <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint mb-1">Connected Wallet</div>
            <div className="text-[11px] text-rh-text font-medium">
              {publicKey ? shortenAddress(publicKey.toBase58(), 6) : ''}
            </div>
            <div className="text-[9px] text-rh-faint mt-0.5 capitalize">
              {NETWORK} · Phantom
            </div>
          </div>

          {/* $ROAD balance */}
          <div className="px-4 py-3 border-b border-rh-border">
            <div className="flex items-center justify-between">
              <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint">$ROAD Balance</div>
              <div className="text-[10px] text-gold font-medium">
                {tokenLoading ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  formatRoadBalance(balance)
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint">Tier</div>
              <div className="text-[10px] text-rh-text">{tierLabel}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={copyAddress}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] text-rh-muted hover:text-rh-text hover:bg-rh-card transition-colors"
            >
              <Copy size={11} />
              {copied ? 'Copied!' : 'Copy Address'}
            </button>

            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] text-rh-muted hover:text-rh-text hover:bg-rh-card transition-colors"
            >
              <ExternalLink size={11} />
              View on Explorer
            </a>

            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] text-rh-muted hover:text-red-400 hover:bg-rh-card transition-colors"
            >
              <LogOut size={11} />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
