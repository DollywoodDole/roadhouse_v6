'use client'

/**
 * RoadHouse Capital — Connected Wallet Portal Card
 * Renders inside app/portal/page.tsx.
 * Not connected: prompt with connect button.
 * Connected: network indicator, adapter name/icon, full address, copy + register for airdrop.
 */

import { useState, useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Copy, Check, Wallet } from 'lucide-react'
import NetworkIndicator from './NetworkIndicator'

interface Props {
  customerId?: string | null
}

export default function ConnectedWallet({ customerId }: Props) {
  const { publicKey, connected, wallet } = useWallet()
  const { setVisible } = useWalletModal()
  const [copied,         setCopied]         = useState(false)
  const [registered,     setRegistered]     = useState(false)
  const [dashboardReady, setDashboardReady] = useState(false)
  const [regError,       setRegError]       = useState('')
  const registeredRef = useRef(false)

  const copy = async () => {
    if (!publicKey) return
    await navigator.clipboard.writeText(publicKey.toBase58())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Auto-register wallet in KV when connected, then issue session cookie
  useEffect(() => {
    if (!connected || !publicKey || !customerId || registeredRef.current) return
    registeredRef.current = true

    const address = publicKey.toBase58()

    fetch('/api/wallet/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ customerId, walletAddress: address }),
    })
      .then(r => r.json())
      .then(async json => {
        if (!json.ok) {
          setRegError(json.error ?? 'Registration failed')
          return
        }
        setRegistered(true)
        // Issue session cookie so member can navigate directly to dashboard
        const sessionRes = await fetch('/api/auth/wallet', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ publicKey: address }),
        })
        const sessionData = await sessionRes.json()
        if (sessionData.isMember) {
          setDashboardReady(true)
        }
      })
      .catch(() => setRegError('Network error'))
  }, [connected, publicKey, customerId])

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
        {registered && (
          <span className="text-[10px] font-mono text-gold bg-gold/10 px-1.5 py-0.5 rounded">
            Airdrop registered
          </span>
        )}
        {dashboardReady && (
          <span className="text-[10px] font-mono text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
            Session active
          </span>
        )}
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

      {regError && (
        <p className="mt-3 text-xs text-red-400">{regError}</p>
      )}

      {dashboardReady && (
        <a
          href="/dashboard"
          className="inline-block mt-4 px-4 py-2.5 bg-gold text-rh-black text-[11px] font-mono tracking-[0.15em] uppercase hover:bg-gold-light transition-colors"
          style={{ borderRadius: '2px' }}
        >
          Go to Dashboard →
        </a>
      )}
    </div>
  )
}
