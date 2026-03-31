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

/**
 * Fetches member tier and $ROAD balance from KV via wallet address.
 * Uses the wallet:{address} → customerId reverse index written by registerWallet().
 * Falls back to 'guest' if wallet is not linked.
 *
 * Replace with useRoadToken() from @/lib/road-token in M3 when the SPL mint
 * is live on mainnet — same interface, drop-in swap.
 */
function useMemberProfile() {
  const { publicKey, connected } = useWallet()
  const [profile, setProfile] = useState({
    tier:        'guest',
    roadBalance: 0,
    loading:     true,
    error:       null,
  })

  useEffect(() => {
    if (!connected || !publicKey) {
      setProfile({ tier: 'guest', roadBalance: 0, loading: false, error: null })
      return
    }

    let cancelled = false

    fetch(`/api/road/balance?walletAddress=${publicKey.toBase58()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setProfile({
          tier:        data.tier ?? 'regular',
          roadBalance: data.balance ?? 0,
          loading:     false,
          error:       null,
        })
      })
      .catch((err) => {
        if (cancelled) return
        // Wallet not linked yet — show guest tier, not an error state
        setProfile({ tier: 'guest', roadBalance: 0, loading: false, error: null })
        console.error('[useMemberProfile]', err.message)
      })

    return () => { cancelled = true }
  }, [connected, publicKey])

  return profile
}

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
          max-width: 440px;
          width: 100%;
        }
        .rh-connect-wordmark {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.1rem;
          letter-spacing: 0.22em;
          color: #e8c84a;
          display: block;
          margin-bottom: 0.4rem;
          text-decoration: none;
        }
        .rh-connect-wordmark:hover { opacity: 0.8; }
        .rh-connect-tagline {
          font-size: 0.58rem;
          letter-spacing: 0.25em;
          color: #4a4238;
          margin-bottom: 2.25rem;
          font-family: 'Space Mono', monospace;
        }
        .rh-connect-heading {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2.75rem;
          letter-spacing: 0.06em;
          color: #e2d9c8;
          margin: 0 0 0.6rem 0;
          line-height: 1;
        }
        .rh-connect-sub {
          font-size: 0.68rem;
          line-height: 1.9;
          color: #8a7d6a;
          margin-bottom: 2rem;
        }
        /* Primary CTA — join */
        .rh-connect-btn-join {
          display: block;
          width: 100%;
          padding: 1rem 1.5rem;
          background: #e8c84a;
          color: #0a0a08;
          font-family: 'Space Mono', monospace;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          transition: opacity 0.2s;
          box-sizing: border-box;
        }
        .rh-connect-btn-join:hover { opacity: 0.88; }
        /* Divider */
        .rh-connect-sep {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 1.75rem 0;
        }
        .rh-connect-sep-line {
          flex: 1;
          height: 1px;
          background: #2a2318;
        }
        .rh-connect-sep-label {
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          color: #4a4238;
          white-space: nowrap;
        }
        /* Secondary CTA — connect wallet */
        .rh-connect-btn-wallet {
          display: block;
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: transparent;
          color: #8a7d6a;
          font-family: 'Space Mono', monospace;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: 1px solid #2a2318;
          border-radius: 3px;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s;
          box-sizing: border-box;
          margin-bottom: 1.5rem;
        }
        .rh-connect-btn-wallet:hover { color: #e2d9c8; border-color: #4a4238; }
        .rh-connect-tags {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 1.75rem;
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
        {/* Wordmark — links home */}
        <a href="/" className="rh-connect-wordmark">ROADHOUSE CAPITAL</a>
        <div className="rh-connect-tagline">WHERE STANDARDS MATTER</div>

        <h1 className="rh-connect-heading">The Member Dashboard</h1>
        <p className="rh-connect-sub">
          Track $ROAD, claim guild bounties, access experiments, and move through tiers.
          Membership starts at $19.99/mo.
        </p>

        {/* Primary CTA — 1 click to membership page, 1 click to Stripe checkout */}
        <a href="/#membership" className="rh-connect-btn-join">
          Join RoadHouse →
        </a>

        {/* Divider */}
        <div className="rh-connect-sep">
          <div className="rh-connect-sep-line" />
          <span className="rh-connect-sep-label">ALREADY A MEMBER?</span>
          <div className="rh-connect-sep-line" />
        </div>

        {/* Secondary CTA — existing members connect wallet */}
        <button
          className="rh-connect-btn-wallet"
          onClick={() => setVisible(true)}
        >
          Connect Wallet
        </button>

        {/* Wallet tags */}
        <div className="rh-connect-tags">
          {['Phantom', 'Solflare', 'Solana'].map(tag => (
            <span key={tag} className="rh-connect-tag">{tag}</span>
          ))}
        </div>

        {/* Back link */}
        <a
          href="/"
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6rem',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#4a4238',
            textDecoration: 'none',
            display: 'block',
            textAlign: 'center',
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
      {/* Left: wordmark → home + back link */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
        <a
          href="/"
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '1.25rem',
            letterSpacing: '0.15em',
            color: '#e8c84a',
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.75' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          ROADHOUSE CAPITAL
        </a>
        <a
          href="/"
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#4a4238',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#8a7d6a' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#4a4238' }}
        >
          ← Home
        </a>
      </div>

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
  const { tier: memberTier, roadBalance, loading } = useMemberProfile()

  if (!mounted) return null

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
      {connected && loading ? (
        <div style={{
          minHeight: '100vh',
          background: '#0a0a08',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Space Mono, monospace',
          fontSize: '0.65rem',
          letterSpacing: '0.2em',
          color: '#4a4238',
          textTransform: 'uppercase',
        }}>
          Loading…
        </div>
      ) : (
        <div style={{ minHeight: '100vh', background: '#0a0a08' }}>
          <DashboardHeader
            walletAddress={walletAddress}
            memberTier={memberTier.toUpperCase()}
            onDisconnect={disconnect}
          />
          {/* 5-tab main body — memberTier + walletAddress + roadBalance passed through */}
          <RoadHouse
            memberTier={memberTier}
            walletAddress={walletAddress}
            roadBalance={roadBalance}
          />
        </div>
      )}
    </MemberGate>
  )
}
