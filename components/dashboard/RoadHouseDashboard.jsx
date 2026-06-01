'use client'

/**
 * RoadHouse Capital — Member Dashboard
 * ─────────────────────────────────────
 * 3-column shell: 52px icon rail · 220px sidebar · 1fr main content
 * Nav state lives here; passed down as activeNavItem to RoadHouse.jsx
 */

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { useRouter } from 'next/navigation'
import RoadHouse from './RoadHouse'
import { useSessionRefresh } from '@/lib/use-session-refresh'

/**
 * Fetches member tier and $ROAD balance from KV via wallet address.
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
        setProfile({ tier: 'guest', roadBalance: 0, loading: false, error: null })
        console.error('[useMemberProfile]', err.message)
      })

    return () => { cancelled = true }
  }, [connected, publicKey])

  return profile
}

// ── ConnectPrompt ────────────────────────────────────────────────────────────

function ConnectPrompt() {
  const { setVisible } = useWalletModal()

  return (
    <div className="rh-gate-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&family=DM+Mono:wght@300;400;500&display=swap');

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
        <a href="/" className="rh-connect-wordmark">ROADHOUSE CAPITAL</a>
        <div className="rh-connect-tagline">WHERE STANDARDS MATTER</div>

        <h1 className="rh-connect-heading">The Member Dashboard</h1>
        <p className="rh-connect-sub">
          Track $ROAD, claim guild bounties, access experiments, and move through tiers.
          Membership starts at $19.99/mo.
        </p>

        <a href="/#membership" className="rh-connect-btn-join">
          Join RoadHouse →
        </a>

        <div className="rh-connect-sep">
          <div className="rh-connect-sep-line" />
          <span className="rh-connect-sep-label">ALREADY A MEMBER?</span>
          <div className="rh-connect-sep-line" />
        </div>

        <button className="rh-connect-btn-wallet" onClick={() => setVisible(true)}>
          Connect Wallet
        </button>

        <div className="rh-connect-tags">
          {['Phantom', 'Solflare', 'Solana'].map(tag => (
            <span key={tag} className="rh-connect-tag">{tag}</span>
          ))}
        </div>

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

function MemberGate({ isConnected, memberTier, requiredTier, children }) {
  // DEV: guest access enabled — remove this comment and restore the gate before launch
  if (false && !isConnected) {
    return <ConnectPrompt />
  }
  return <>{children}</>
}

// ── Tier maps ─────────────────────────────────────────────────────────────────

const TIER_COLOR_MAP = {
  'regular': '#ede8dc', 'ranch-hand': '#e8c84a', 'partner': '#ff5c35',
  'founding': '#e8c84a', 'steward': '#4af0c8', 'praetor': '#e8c84a',
}

const TIER_LABEL_MAP = {
  'regular': 'Regular', 'ranch-hand': 'Ranch Hand', 'partner': 'Partner',
  'founding': 'Founding', 'steward': 'Steward', 'praetor': 'Praetor',
}

// ── Nav data ──────────────────────────────────────────────────────────────────

const PAGE_MAP = {
  'overview': 'home', 'profile': 'home', 'prop-account': 'home',
  'bounties': 'earn', 'missions': 'earn', 'marketplace': 'earn', 'leaderboard': 'earn',
  'war-room': 'community', 'protocol': 'community', 'events': 'community', 'members': 'community',
  'treasury-overview': 'treasury', 'governance': 'treasury', 'nfts': 'treasury', 'dao-vote': 'treasury',
}

const PAGE_DEFAULTS = {
  home: 'overview', earn: 'bounties', community: 'war-room', treasury: 'treasury-overview',
}

const NAV_SECTIONS = [
  { key: 'home', label: null, items: [
    { key: 'overview',     label: 'Overview' },
    { key: 'profile',      label: 'Profile' },
    { key: 'prop-account', label: 'Prop Account' },
  ]},
  { key: 'earn', label: 'EARN', items: [
    { key: 'bounties',    label: 'Bounties',    badge: '4' },
    { key: 'missions',    label: 'Missions',    reward: '+250' },
    { key: 'marketplace', label: 'Marketplace' },
    { key: 'leaderboard', label: 'Leaderboard' },
  ]},
  { key: 'community', label: 'COMMUNITY', items: [
    { key: 'war-room', label: 'War Room', badge: '3' },
    { key: 'protocol', label: 'Protocol' },
    { key: 'events',   label: 'Events' },
    { key: 'members',  label: 'Members' },
  ]},
  { key: 'treasury', label: 'TREASURY', items: [
    { key: 'treasury-overview', label: 'Overview' },
    { key: 'governance', label: 'Governance', locked: true },
    { key: 'nfts',       label: 'NFTs',       locked: true },
    { key: 'dao-vote',   label: 'DAO Vote',   locked: true },
  ]},
]

// ── IconRail ──────────────────────────────────────────────────────────────────

const RAIL_PAGES = [
  { key: 'home',      icon: 'ti-home'     },
  { key: 'earn',      icon: 'ti-coin'     },
  { key: 'community', icon: 'ti-users'    },
  { key: 'treasury',  icon: 'ti-safe'     },
]

function IconRail({ activePage, onPageChange }) {
  return (
    <div style={{
      width: 52,
      background: '#0d0c0a',
      borderRight: '1px solid #161513',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 14,
      paddingBottom: 14,
      position: 'sticky',
      top: 0,
      height: '100vh',
      boxSizing: 'border-box',
      zIndex: 2,
    }}>
      {/* RH wordmark — vertical */}
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 13,
        letterSpacing: '0.18em',
        color: '#e8c84a',
        writingMode: 'vertical-lr',
        transform: 'rotate(180deg)',
        marginBottom: 18,
        userSelect: 'none',
        lineHeight: 1,
      }}>
        RH
      </div>

      {/* Section buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {RAIL_PAGES.map(p => {
          const isActive = activePage === p.key
          return (
            <button
              key={p.key}
              title={p.key.charAt(0).toUpperCase() + p.key.slice(1)}
              onClick={() => onPageChange(p.key)}
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? '#e8c84a0f' : 'transparent',
                border: `1px solid ${isActive ? '#e8c84a1a' : 'transparent'}`,
                borderRadius: 4,
                color: isActive ? '#e8c84a' : '#5a5550',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = '#ffffff06'
                  e.currentTarget.style.color = '#ede8dc'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#5a5550'
                }
              }}
            >
              <i className={`ti ${p.icon}`} style={{ fontSize: 18 }} />
            </button>
          )
        })}
      </div>

      {/* Settings at bottom */}
      <button
        title="Settings"
        style={{
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: '1px solid transparent',
          borderRadius: 4,
          color: '#5a5550',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#ffffff06'
          e.currentTarget.style.color = '#ede8dc'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = '#5a5550'
        }}
      >
        <i className="ti ti-settings" style={{ fontSize: 18 }} />
      </button>
    </div>
  )
}

// ── VaultPanel ────────────────────────────────────────────────────────────────

function VaultPanel({ roadBalance, walletAddress, memberTier }) {
  const tierColor = TIER_COLOR_MAP[memberTier] ?? '#ede8dc'

  return (
    <div style={{
      background: '#1a1814',
      border: '1px solid #1e1e1c',
      borderRadius: 6,
      margin: '10px 10px 0',
      padding: '10px 12px',
    }}>
      {/* $ROAD Balance */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: '#5a5550', textTransform: 'uppercase' }}>
          $ROAD
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#e8c84a', fontWeight: 500 }}>
          {roadBalance >= 1000
            ? (roadBalance / 1000).toFixed(1) + 'k'
            : (roadBalance ?? 0).toLocaleString()}
        </span>
      </div>

      {/* SOL Wallet */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: '#5a5550', textTransform: 'uppercase' }}>
          Wallet
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: walletAddress ? '#8a7d6a' : '#3a3530' }}>
          {walletAddress ?? 'Not connected'}
        </span>
      </div>

      {/* Prop Account */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #1e1e1c' }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: '#5a5550', textTransform: 'uppercase' }}>
          Prop P&amp;L
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#4af0c8', fontWeight: 500 }}>
          +$682
        </span>
      </div>
    </div>
  )
}

// ── DashboardSidebar ──────────────────────────────────────────────────────────

function DashboardSidebar({ activeNavItem, onNavChange, memberTier, roadBalance, walletAddress }) {
  const tierColor = TIER_COLOR_MAP[memberTier] ?? '#ede8dc'
  const tierLabel = TIER_LABEL_MAP[memberTier] ?? memberTier

  return (
    <div style={{
      width: 220,
      background: '#0f0e0c',
      borderRight: '1px solid #161513',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
      boxSizing: 'border-box',
      zIndex: 2,
    }}>
      {/* Member identity block */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #161513' }}>
        {/* Avatar */}
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${tierColor}22, ${tierColor}08)`,
          border: `1px solid ${tierColor}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 18,
          color: tierColor,
          letterSpacing: '0.05em',
        }}>
          D
        </div>

        {/* Name */}
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: '0.06em', color: '#ede8dc', lineHeight: 1, marginBottom: 3 }}>
          DollywoodDole
        </div>

        {/* Handle + guild */}
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#5a5550', letterSpacing: '0.1em', marginBottom: 8 }}>
          @dollywooddole · Builder Guild
        </div>

        {/* Tier badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: `${tierColor}10`,
          border: `1px solid ${tierColor}30`,
          borderRadius: 3,
          padding: '2px 7px',
        }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: tierColor }}>
            {tierLabel}
          </span>
        </div>
      </div>

      {/* Vault panel */}
      <VaultPanel roadBalance={roadBalance} walletAddress={walletAddress} memberTier={memberTier} />

      {/* Nav sections */}
      <nav style={{ flex: 1, padding: '8px 0 16px', overflowY: 'auto' }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.key} style={{ marginTop: section.label ? 16 : 8 }}>
            {section.label && (
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 8,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#3a3530',
                padding: '0 14px',
                marginBottom: 4,
              }}>
                {section.label}
              </div>
            )}

            {section.items.map(item => {
              const isActive = activeNavItem === item.key
              return (
                <button
                  key={item.key}
                  title={item.locked ? 'Available at M3' : undefined}
                  onClick={item.locked ? e => e.preventDefault() : () => onNavChange(item.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '6px 14px',
                    background: isActive ? '#e8c84a08' : 'transparent',
                    border: 'none',
                    borderLeft: `2px solid ${isActive ? '#e8c84a' : 'transparent'}`,
                    color: item.locked ? '#3a3530' : isActive ? '#e8c84a' : '#8a7d6a',
                    cursor: item.locked ? 'default' : 'pointer',
                    opacity: item.locked ? 0.4 : 1,
                    textAlign: 'left',
                    transition: 'all 0.12s',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={e => {
                    if (!isActive && !item.locked) {
                      e.currentTarget.style.background = '#ffffff04'
                      e.currentTarget.style.color = '#ede8dc'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive && !item.locked) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#8a7d6a'
                    }
                  }}
                >
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.04em' }}>
                    {item.locked ? '⬡ ' : ''}{item.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {item.badge && (
                      <span style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9,
                        color: '#e8c84a',
                        background: '#e8c84a14',
                        border: '1px solid #e8c84a20',
                        borderRadius: 3,
                        padding: '1px 5px',
                      }}>
                        {item.badge}
                      </span>
                    )}
                    {item.reward && (
                      <span style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9,
                        color: '#4af0c8',
                        letterSpacing: '0.05em',
                      }}>
                        {item.reward}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: disconnect */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #161513' }}>
        <a
          href="/"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 9,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#3a3530',
            textDecoration: 'none',
            display: 'block',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#8a7d6a' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#3a3530' }}
        >
          ← Home
        </a>
      </div>
    </div>
  )
}

// ── RoadHouseDashboard ───────────────────────────────────────────────────────

export default function RoadHouseDashboard() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useSessionRefresh()

  const { connected, publicKey, disconnect } = useWallet()
  const { tier: memberTier, roadBalance, loading } = useMemberProfile()
  const router = useRouter()

  // Nav state — lives here, passed down
  const [activeNavItem, setActiveNavItem] = useState('overview')

  if (!mounted) return null

  const walletAddress = publicKey
    ? publicKey.toBase58().slice(0, 4) + '...' + publicKey.toBase58().slice(-4)
    : null

  const handleDisconnect = async () => {
    try { await fetch('/api/auth/wallet', { method: 'DELETE' }) } catch (_) {}
    disconnect()
    router.replace('/login')
  }

  // When clicking a page button in the rail, jump to that page's default nav item
  const activePage = PAGE_MAP[activeNavItem] ?? 'home'
  const handlePageChange = (pageKey) => {
    setActiveNavItem(PAGE_DEFAULTS[pageKey] ?? activeNavItem)
  }

  return (
    <MemberGate isConnected={connected} memberTier={memberTier} requiredTier="founding">
      {/* Tabler icons webfont — used by IconRail */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
      />
      {/* Responsive shell: collapse sidebar at <900px, collapse rail at <600px */}
      <style>{`
        .rh-shell {
          display: grid;
          grid-template-columns: 52px 220px 1fr;
          min-height: 100vh;
          background: #0a0a08;
        }
        @media (max-width: 900px) {
          .rh-shell {
            grid-template-columns: 52px 1fr;
          }
          .rh-shell > :nth-child(2) {
            display: none;
          }
        }
        @media (max-width: 600px) {
          /* TODO: add hamburger / bottom nav to replace rail at this breakpoint */
          .rh-shell {
            grid-template-columns: 1fr;
          }
          .rh-shell > :first-child {
            display: none;
          }
        }
      `}</style>

      {connected && loading ? (
        <div style={{
          minHeight: '100vh',
          background: '#0a0a08',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.65rem',
          letterSpacing: '0.2em',
          color: '#4a4238',
          textTransform: 'uppercase',
        }}>
          Loading…
        </div>
      ) : (
        <div className="rh-shell">
          <IconRail activePage={activePage} onPageChange={handlePageChange} />
          <DashboardSidebar
            activeNavItem={activeNavItem}
            onNavChange={setActiveNavItem}
            memberTier={memberTier}
            roadBalance={roadBalance}
            walletAddress={walletAddress}
          />
          <RoadHouse
            activeNavItem={activeNavItem}
            memberTier={memberTier}
            walletAddress={walletAddress}
            roadBalance={roadBalance}
          />
        </div>
      )}
    </MemberGate>
  )
}
