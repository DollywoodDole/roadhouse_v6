'use client'

/**
 * RoadHouse Capital — Member Dashboard
 * ─────────────────────────────────────
 * Wraps the 6-tab RoadHouse component in a MemberGate.
 * Header bar: wordmark · wallet pill · tier badge · disconnect.
 *
 * WALLET GATING:
 *   Connected via useWallet() — Phantom adapter, devnet.
 *   Wallet context is provided by SolanaWalletProvider in app/layout.tsx.
 *   Modal is opened via useWalletModal() from @solana/wallet-adapter-react-ui.
 *
 * TIER GATING:
 *   memberTier is hardcoded "founding" for now.
 *   TODO: derive from $ROAD token balance via getTokenAccountsByOwner
 */

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import RoadHouse from './RoadHouse'

// ── ConnectPrompt ────────────────────────────────────────────────────────────
// Rendered by MemberGate when connected === false.

function ConnectPrompt() {
  const { setVisible } = useWalletModal()

  return (
    <div className="rh-gate-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&family=Syne:wght@600;700&display=swap');

        .rh-gate-wrapper {
          min-height: 100vh;
          background: #0a0a08;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Space Mono', monospace;
          padding: 2rem;
        }

        .rh-connect-card {
          background: #111009;
          border: 1px solid #2a2318;
          border-radius: 6px;
          padding: 3rem 2.5rem;
          max-width: 420px;
          width: 100%;
          text-align: center;
        }
        .rh-connect-wordmark {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.5rem;
          letter-spacing: 0.2em;
          color: #e8c84a;
          margin-bottom: 2rem;
          display: block;
        }
        .rh-connect-heading {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 3rem;
          letter-spacing: 0.08em;
          color: #e2d9c8;
          margin: 0 0 0.75rem 0;
        }
        .rh-connect-sub {
          font-size: 0.72rem;
          line-height: 1.8;
          color: #8a7d6a;
          margin-bottom: 2rem;
        }
        .rh-connect-btn {
          display: inline-block;
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: #e8c84a;
          color: #0a0a08;
          font-family: 'Space Mono', monospace;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          transition: opacity 0.2s;
          margin-bottom: 1.75rem;
        }
        .rh-connect-btn:hover { opacity: 0.88; }
        .rh-connect-tags {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .rh-connect-tag {
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #4a4238;
          border: 1px solid #2a2318;
          border-radius: 2px;
          padding: 0.25rem 0.5rem;
        }
      `}</style>

      <div className="rh-connect-card">
        {/* Wordmark */}
        <span className="rh-connect-wordmark">ROADHOUSE CAPITAL</span>

        {/* Gate heading */}
        <h1 className="rh-connect-heading">Members Only</h1>

        {/* Subtext */}
        <p className="rh-connect-sub">
          Connect your Phantom wallet to access the dashboard.
        </p>

        {/* Connect button — opens native Phantom wallet modal */}
        <button
          className="rh-connect-btn"
          onClick={() => setVisible(true)}
        >
          Connect Wallet
        </button>

        {/* Tag row */}
        <div className="rh-connect-tags">
          {['Founding Member', '$ROAD Required', 'Solana'].map(tag => (
            <span key={tag} className="rh-connect-tag">{tag}</span>
          ))}
        </div>

        {/* Back link — prevent dead-end for non-wallet visitors */}
        <a
          href="/"
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#4a4238',
            textDecoration: 'none',
            marginTop: '1.5rem',
            display: 'block',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#8a7d6a' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#4a4238' }}
        >
          ← Back to RoadHouse
        </a>
      </div>
    </div>
  )
}

// ── MemberGate ───────────────────────────────────────────────────────────────
// Props:
//   isConnected   (bool)   — wallet connected?
//   memberTier    (string) — e.g. "founding", "partner", "ranch", "regular"
//   requiredTier  (string) — minimum tier to access this view
//   children      — rendered when gate passes

function MemberGate({ isConnected, memberTier, requiredTier, children }) {
  // TODO: fetch $ROAD token balance from publicKey, map to tier, enforce requiredTier
  //   e.g. const balance = await getTokenAccountsByOwner(connection, publicKey, ROAD_MINT_PUBKEY)
  //        const tier = getTierFromBalance(balance)
  //        if (TIER_RANK[tier] < TIER_RANK[requiredTier]) return <ConnectPrompt />
  if (!isConnected) {
    return <ConnectPrompt />
  }
  return <>{children}</>
}

// ── Header bar ───────────────────────────────────────────────────────────────

function DashboardHeader({ walletAddress, memberTier, onDisconnect }) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 1.5rem',
      background: '#0a0a08',
      borderBottom: '1px solid #2a2318',
      fontFamily: 'Space Mono, monospace',
      flexWrap: 'wrap',
      gap: '0.75rem',
    }}>
      {/* Left: wordmark */}
      <span style={{
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: '1.25rem',
        letterSpacing: '0.15em',
        color: '#e8c84a',
      }}>
        ROADHOUSE CAPITAL
      </span>

      {/* Right: wallet pill + tier badge + disconnect */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        flexWrap: 'wrap',
      }}>
        {/* Wallet address pill — truncated 4…4 format */}
        <span style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: '0.65rem',
          color: '#8a7d6a',
          background: '#111009',
          border: '1px solid #2a2318',
          borderRadius: '3px',
          padding: '0.3rem 0.7rem',
          letterSpacing: '0.05em',
        }}>
          {walletAddress}
        </span>

        {/* Tier badge */}
        <span style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: '0.6rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#4af0c8',
          background: 'rgba(74,240,200,0.08)',
          border: '1px solid rgba(74,240,200,0.2)',
          borderRadius: '3px',
          padding: '0.3rem 0.7rem',
        }}>
          {memberTier}
        </span>

        {/* Disconnect button */}
        <button
          onClick={onDisconnect}
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#4a4238',
            background: 'transparent',
            border: '1px solid #2a2318',
            borderRadius: '3px',
            padding: '0.3rem 0.7rem',
            cursor: 'pointer',
            transition: 'color 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#ff5c35'
            e.currentTarget.style.borderColor = 'rgba(255,92,53,0.4)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#4a4238'
            e.currentTarget.style.borderColor = '#2a2318'
          }}
        >
          Disconnect
        </button>
      </div>
    </header>
  )
}

// ── RoadHouseDashboard ───────────────────────────────────────────────────────

export default function RoadHouseDashboard() {
  // Mounted guard — prevents hydration mismatch from useWallet() returning
  // different state on server (connected=false) vs client (real wallet state).
  // All hooks must be called unconditionally first; return null before first render.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { connected, publicKey, disconnect } = useWallet()

  if (!mounted) return null

  // TODO: derive memberTier from $ROAD token balance via getTokenAccountsByOwner
  //   import { getConnection, ROAD_MINT_PUBKEY, getTierFromBalance } from '@/lib/solana'
  //   const accounts = await getConnection().getTokenAccountsByOwner(publicKey, { mint: ROAD_MINT_PUBKEY })
  //   const balance  = parseTokenBalance(accounts)
  //   const tier     = getTierFromBalance(balance)
  const memberTier = 'founding'

  // Truncate publicKey to 4…4 display format
  const walletAddress = publicKey
    ? publicKey.toBase58().slice(0, 4) + '...' + publicKey.toBase58().slice(-4)
    : null

  return (
    <MemberGate
      isConnected={connected}
      memberTier={memberTier}
      requiredTier="founding"
    >
      <div style={{ minHeight: '100vh', background: '#0a0a08' }}>
        <DashboardHeader
          walletAddress={walletAddress}
          memberTier={memberTier.toUpperCase()}
          onDisconnect={disconnect}
        />
        {/* 5-tab main body — memberTier + walletAddress passed for tier display and listings */}
        <RoadHouse
          memberTier={memberTier}
          walletAddress={walletAddress}
        />
      </div>
    </MemberGate>
  )
}
