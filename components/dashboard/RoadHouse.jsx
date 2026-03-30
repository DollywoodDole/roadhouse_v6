'use client'

/**
 * RoadHouse — 5-Tab Member Dashboard Component
 * ─────────────────────────────────────────────
 * Design system: Space Mono + Bebas Neue + Syne
 * CSS vars scoped to .rh-dash: --bg, --accent (gold), --accent2 (red), --accent3 (teal)
 * Grain overlay inherited from body.grain in globals.css — not re-declared here.
 *
 * Tabs: MY ROADHOUSE · ECONOMY · DESCI · GUILD · TREASURY
 */

import { useState, useEffect } from 'react'
import {
  getProfile,
  updateProfile,
  TIER_THRESHOLDS,
  TIER_DISPLAY,
  getNextTier,
} from '@/lib/profile'
import { getListings, createListing } from '@/lib/api/listings'
import { getActiveExperiment, submitDailyEntry, getAggregateStats } from '@/lib/api/experiments'
import { getActiveBounties, claimBounty } from '@/lib/api/bounties'
import { getTreasurySnapshot, getGovernanceVotes } from '@/lib/gnosis'

// ── Tab definitions ──────────────────────────────────────────────────────────

const TABS = ['MY ROADHOUSE', 'ECONOMY', 'DESCI', 'GUILD', 'TREASURY']

// ── Shared sub-components ────────────────────────────────────────────────────

function Card({ children, accent }) {
  const borderColor = accent === 'gold'  ? 'var(--accent)'
                    : accent === 'red'   ? 'var(--accent2)'
                    : accent === 'teal'  ? 'var(--accent3)'
                    : '#2a2318'
  return (
    <div className="rh-card" style={{ borderColor }}>
      {children}
    </div>
  )
}

function Label({ children, color }) {
  const c = color === 'gold'  ? 'var(--accent)'
          : color === 'red'   ? 'var(--accent2)'
          : color === 'teal'  ? 'var(--accent3)'
          : '#8a7d6a'
  return (
    <span className="rh-label" style={{ color: c }}>
      {children}
    </span>
  )
}

function SectionHead({ children }) {
  return <h2 className="rh-section-head">{children}</h2>
}

function Divider() {
  return <div className="rh-divider" />
}

// ── MemberProfileCard + helpers ──────────────────────────────────────────────
// Token map: gold→var(--accent)  bg→var(--bg)  panel→#111110
//            border→#1e1e1c      warm→#ede8dc  muted→#5a5550
//            green→#4b7c50       red→var(--accent2)

function ProfileXPBar({ value, max, color, height = 4, showLabel = false }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 9, color: '#5a5550', letterSpacing: '0.15em', fontFamily: "'Space Mono', monospace" }}>
            {value.toLocaleString()} XP
          </span>
          <span style={{ fontSize: 9, color: '#5a5550', fontFamily: "'Space Mono', monospace" }}>
            {max.toLocaleString()} XP
          </span>
        </div>
      )}
      <div style={{ height, background: '#1e1e1c', borderRadius: 0, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color || 'var(--accent)',
          transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.4)' }} />
        </div>
      </div>
    </div>
  )
}

function ProfileStatBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 9, letterSpacing: '0.18em', color: '#5a5550', fontFamily: "'Space Mono', monospace" }}>{label}</span>
        <span style={{ fontSize: 9, color: color || '#ede8dc', fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{value}</span>
      </div>
      <ProfileXPBar value={value} max={100} color={color} height={2} />
    </div>
  )
}

function MemberProfileCard({ profile, balance, tier, tierName, nextTier, nextBalance }) {
  // XP and Signal Score — TODO: wire from KV (not yet in road:{customerId} schema)
  const xp      = 1840
  const xpNext  = 2000
  const signal  = 847
  const initials = (profile?.alias ?? tierName ?? 'RH').slice(0, 2).toUpperCase()
  const handle   = profile?.alias
    ? `@${profile.alias.toLowerCase().replace(/\s+/g, '')}`
    : null

  return (
    <div style={{
      background: '#111110',
      border: '1px solid #1e1e1c',
      borderRadius: 3,
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 0 40px rgba(232,200,74,0.08)',
    }}>
      {/* Top gradient border */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }} />

      {/* Gold glow overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at top left, rgba(232,200,74,0.08) 0%, transparent 60%)',
      }} />

      {/* Corner accent */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 0, height: 0,
        borderLeft: '40px solid transparent',
        borderTop: '40px solid var(--accent)',
        opacity: 0.15,
      }} />

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, #7A6030, var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, color: 'var(--bg)', fontWeight: 900,
            fontFamily: "'Bebas Neue', sans-serif",
            borderRadius: 2,
            boxShadow: '0 0 20px rgba(232,200,74,0.12)',
          }}>
            {initials}
          </div>
          <div style={{
            position: 'absolute', bottom: -4, right: -4,
            background: '#111110', border: '1px solid var(--accent)',
            padding: '1px 5px', fontSize: 8, letterSpacing: '0.1em',
            color: 'var(--accent)', fontFamily: "'Space Mono', monospace",
          }}>
            LVL 1
          </div>
        </div>

        {/* Name & tier */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2, flexWrap: 'wrap' }}>
            <div style={{
              fontSize: 20, letterSpacing: '0.08em', color: '#ede8dc',
              fontFamily: "'Bebas Neue', sans-serif", lineHeight: 1,
            }}>
              {profile?.alias ?? tierName}
            </div>
            <span style={{
              fontSize: 9, letterSpacing: '0.18em',
              fontFamily: "'Space Mono', monospace", fontWeight: 700,
              padding: '3px 8px',
              border: '1px solid var(--accent)',
              color: 'var(--accent)', borderRadius: 2,
              background: 'rgba(232,200,74,0.08)',
            }}>
              {tierName}
            </span>
          </div>
          {handle && (
            <div style={{ fontSize: 10, color: '#5a5550', fontFamily: "'Space Mono', monospace", letterSpacing: '0.12em', marginBottom: 12 }}>
              {handle}
            </div>
          )}

          {/* XP bar — TODO: wire xp/xpNext from KV */}
          <div style={{ marginBottom: 8 }}>
            <ProfileXPBar value={xp} max={xpNext} showLabel />
          </div>
          <div style={{ fontSize: 9, color: '#5a5550', fontFamily: "'Space Mono', monospace", letterSpacing: '0.12em' }}>
            {(xpNext - xp).toLocaleString()} XP TO NEXT LEVEL
          </div>
        </div>

        {/* Signal Score — TODO: wire signal from KV */}
        <div style={{
          flexShrink: 0, textAlign: 'center',
          padding: '12px 16px',
          border: '1px solid #2a2a28',
          borderRadius: 2,
        }}>
          <div style={{
            fontSize: 32, fontFamily: "'Bebas Neue', sans-serif",
            color: 'var(--accent)', lineHeight: 1, letterSpacing: '-0.02em',
          }}>
            {signal}
          </div>
          <div style={{ fontSize: 8, letterSpacing: '0.2em', color: '#5a5550', fontFamily: "'Space Mono', monospace", marginTop: 4 }}>
            SIGNAL
          </div>
          <div style={{ fontSize: 8, color: '#4b7c50', fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
            ▲ +12 TODAY
          </div>
        </div>

        {/* $ROAD Balance — live from KV */}
        <div style={{
          flexShrink: 0, textAlign: 'center',
          padding: '12px 16px',
          border: '1px solid #2a2a28',
          borderRadius: 2,
        }}>
          <div style={{
            fontSize: 24, fontFamily: "'Space Mono', monospace", fontWeight: 700,
            color: '#ede8dc', lineHeight: 1,
          }}>
            {balance.toLocaleString()}
          </div>
          <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'var(--accent)', fontFamily: "'Space Mono', monospace", marginTop: 4 }}>
            $ROAD
          </div>
          <div style={{ fontSize: 8, color: '#5a5550', fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
            ACCRUING
          </div>
        </div>
      </div>

      {/* Stat bars — TODO: wire body/wealth/network/style from KV */}
      <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #1e1e1c' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 24px' }}>
          <ProfileStatBar label="BODY"    value={68} color="#4b7c50" />
          <ProfileStatBar label="WEALTH"  value={74} color="var(--accent)" />
          <ProfileStatBar label="NETWORK" value={55} color="#3a5a7c" />
          <ProfileStatBar label="STYLE"   value={61} color="#8b6ab8" />
        </div>
      </div>

      {/* Upgrade CTA — shown when there is a next tier */}
      {nextTier && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #1e1e1c', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <a
            href="/#membership"
            style={{
              display: 'inline-block',
              fontFamily: "'Space Mono', monospace",
              fontSize: 9, letterSpacing: '0.18em', fontWeight: 700,
              color: 'var(--accent)', textDecoration: 'none',
              border: '1px solid rgba(232,200,74,0.3)',
              padding: '8px 14px', borderRadius: 2,
              background: 'rgba(232,200,74,0.05)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,200,74,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(232,200,74,0.05)' }}
          >
            UPGRADE TO {TIER_DISPLAY[nextTier] ?? nextTier.toUpperCase()} →
          </a>
          <span style={{ fontSize: 8, color: '#5a5550', fontFamily: "'Space Mono', monospace" }}>
            {(nextBalance - balance).toLocaleString()} $ROAD needed
          </span>
        </div>
      )}
    </div>
  )
}

// TODO: M3 — wire to missions:{customerId} KV key
const DAILY_MISSIONS = [
  { id: 1, label: 'Log a workout',                 category: 'BODY',    xp: 50,  done: false },
  { id: 2, label: 'Complete 1 track lesson',        category: 'MIND',    xp: 40,  done: false },
  { id: 3, label: 'Make one income-producing move', category: 'WEALTH',  xp: 75,  done: false },
  { id: 4, label: 'Engage with a member post',      category: 'NETWORK', xp: 25,  done: false },
  { id: 5, label: 'Post a win or update',           category: 'SIGNAL',  xp: 30,  done: false },
]

const MISSION_CATEGORY_COLOR = {
  BODY:    '#4b7c50',
  MIND:    '#3a5a7c',
  WEALTH:  'var(--accent)',
  NETWORK: '#8b6ab8',
  SIGNAL:  'var(--accent2)',
}

// TODO: M3 — reqMet should derive from real tier comparison, not hardcoded
const UNLOCK_COLORS = { COMPOUND: '#4b7c50', EVENT: 'var(--accent)', TRAVEL: '#3a5a7c', ACCESS: '#8b6ab8' }

const UNLOCKS = [
  { id: 1, label: 'Waskesiu Compound — Spring Access', type: 'COMPOUND', date: 'MAY 2025',    req: 'RANCH HAND', reqMet: true,  locked: false, href: '/compound'                 },
  { id: 2, label: 'Private Dinner — Saskatoon Node',   type: 'EVENT',    date: 'APR 2025',    req: 'RANCH HAND', reqMet: true,  locked: false, href: '/#events'                  },
  { id: 3, label: 'Mediterranean Trip — 8 Seats',      type: 'TRAVEL',   date: 'JUL 2025',    req: 'PARTNER',    reqMet: false, locked: true,  href: '/adventures/mediterranean' },
  { id: 4, label: 'Whistler Ski Weekend',               type: 'TRAVEL',   date: 'FEB 2026',    req: 'PARTNER',    reqMet: false, locked: true,  href: '/adventures/ski-trip'      },
  { id: 5, label: 'Lake Trip — Summer 2026',            type: 'TRAVEL',   date: 'SUMMER 2026', req: 'REGULAR',    reqMet: true,  locked: false, href: '/adventures/lake-trip'     },
]

// TODO: M3 — wire track progress and XP from tracks:{customerId} KV key
const TRACKS = [
  { id: 'fitness', label: 'BODY',   sub: 'Performance & Conditioning', level: 7, xp: 2340, color: '#4b7c50',        icon: '⬡', progress: 72, members: 184, locked: false },
  { id: 'finance', label: 'WEALTH', sub: 'Capital & Deal Flow',        level: 5, xp: 1620, color: 'var(--accent)', icon: '◉', progress: 55, members: 241, locked: false },
  { id: 'build',   label: 'BUILD',  sub: 'Ventures & Systems',         level: 4, xp: 980,  color: '#3a5a7c',        icon: '◈', progress: 38, members: 97,  locked: false },
  { id: 'style',   label: 'STYLE',  sub: 'Identity & Aesthetics',      level: 2, xp: 310,  color: '#8b6ab8',        icon: '◇', progress: 22, members: 128, locked: false },
  { id: 'cars',    label: 'DRIVE',  sub: 'Machines & Culture',         level: 1, xp: 0,    color: '#8b3a30',        icon: '△', progress: 0,  members: 73,  locked: true  },
]

function DailyMissions() {
  const [missions, setMissions] = useState(DAILY_MISSIONS)
  const completed = missions.filter(m => m.done).length
  const xpEarned  = missions.filter(m => m.done).reduce((acc, m) => acc + m.xp, 0)

  function toggle(id) {
    setMissions(ms => ms.map(m => m.id === id ? { ...m, done: !m.done } : m))
  }

  return (
    <div style={{
      background: '#111110',
      border: '1px solid #1e1e1c',
      borderRadius: 3,
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top gradient border */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '0.06em', color: '#ede8dc', lineHeight: 1 }}>
            DAILY OPERATIONS
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: '#5a5550', letterSpacing: '0.15em', marginTop: 3 }}>
            {completed}/{missions.length} COMPLETE
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, color: 'var(--accent)', fontWeight: 700 }}>
            +{xpEarned} XP
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: '#5a5550', letterSpacing: '0.1em', marginTop: 2 }}>
            EARNED TODAY
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <ProfileXPBar value={completed} max={missions.length} color="var(--accent)" height={2} />
      </div>

      {/* Mission list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {missions.map(m => {
          const catColor = MISSION_CATEGORY_COLOR[m.category] || '#5a5550'
          return (
            <div
              key={m.id}
              onClick={() => toggle(m.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px',
                border: `1px solid ${m.done ? 'rgba(232,200,74,0.25)' : '#1e1e1c'}`,
                background: m.done ? 'rgba(232,200,74,0.04)' : 'transparent',
                borderRadius: 2, cursor: 'pointer',
                position: 'relative', overflow: 'hidden',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => { if (!m.done) e.currentTarget.style.borderColor = '#2a2a28' }}
              onMouseLeave={e => { if (!m.done) e.currentTarget.style.borderColor = '#1e1e1c' }}
            >
              {/* Left accent bar */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
                background: m.done ? 'var(--accent)' : '#2a2a28',
                transition: 'background 0.2s',
              }} />

              {/* Checkbox */}
              <div style={{
                width: 18, height: 18, flexShrink: 0,
                border: `1px solid ${m.done ? 'var(--accent)' : '#2a2a28'}`,
                background: m.done ? 'var(--accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: 'var(--bg)', fontWeight: 900, borderRadius: 1,
                transition: 'all 0.2s',
              }}>
                {m.done ? '✓' : ''}
              </div>

              {/* Label + category */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11, color: m.done ? '#5a5550' : '#ede8dc',
                  letterSpacing: '0.02em',
                  textDecoration: m.done ? 'line-through' : 'none',
                  transition: 'color 0.2s',
                }}>
                  {m.label}
                </div>
                <div style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 8, color: catColor,
                  letterSpacing: '0.2em', fontWeight: 700,
                  marginTop: 2,
                }}>
                  {m.category}
                </div>
              </div>

              {/* XP reward */}
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10, fontWeight: 700,
                color: m.done ? 'var(--accent)' : '#5a5550',
                transition: 'color 0.2s',
              }}>
                +{m.xp} XP
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer — TODO: M3 — reset timer from KV TTL, streak from road:{customerId}.streak */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid #1e1e1c' }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: '#5a5550', letterSpacing: '0.15em' }}>
          RESETS IN 14:22:07
        </div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: '#4b7c50', letterSpacing: '0.15em', fontWeight: 700 }}>
          ▲ 4-DAY STREAK ACTIVE
        </div>
      </div>
    </div>
  )
}

function Unlocks() {
  return (
    <div style={{ padding: '1.25rem 1.5rem', background: '#111110', border: '1px solid #1e1e1c', borderRadius: 4 }}>
      {/* Header */}
      <div style={{ fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#6a6560', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 14 }}>
        Access &amp; Unlocks
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {UNLOCKS.map(u => {
          const color = UNLOCK_COLORS[u.type] || '#5a5550'
          return (
            <div
              key={u.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px',
                border: `1px solid ${u.locked ? '#1e1e1c' : color + '50'}`,
                background: u.locked ? 'transparent' : `${color}0A`,
                borderRadius: 2, position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Left type bar */}
              <div style={{ width: 3, alignSelf: 'stretch', flexShrink: 0, background: u.locked ? '#1e1e1c' : color, borderRadius: 1 }} />

              {/* Lock overlay */}
              {u.locked && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,8,0.45)', backdropFilter: 'blur(1px)', pointerEvents: 'none' }} />
              )}

              {/* Content */}
              <div style={{ flex: 1, filter: u.locked ? 'blur(0.5px)' : 'none' }}>
                <div style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: u.locked ? '#5a5550' : '#ede8dc', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 4 }}>
                  {u.label}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 8, letterSpacing: '0.15em', color: color, border: `1px solid ${color}`, borderRadius: 2, padding: '1px 5px', fontFamily: "'Space Mono', monospace" }}>
                    {u.type}
                  </span>
                  <span style={{ fontSize: 9, color: '#5a5550', fontFamily: "'Space Mono', monospace" }}>{u.date}</span>
                </div>
              </div>

              {/* CTA or lock */}
              <div style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
                {u.locked ? (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 8, color: 'var(--accent2)', fontFamily: "'Space Mono', monospace", letterSpacing: '0.15em' }}>🔒 REQUIRES</div>
                    <div style={{ fontSize: 9, color: 'var(--accent2)', fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{u.req}</div>
                  </div>
                ) : (
                  <a
                    href={u.href}
                    style={{ display: 'inline-block', padding: '6px 14px', fontSize: 9, letterSpacing: '0.15em', fontFamily: "'Space Mono', monospace", fontWeight: 700, border: `1px solid ${color}`, color: color, background: 'transparent', borderRadius: 1, textDecoration: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${color}18` }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    REGISTER →
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Upgrade callout */}
      <div style={{ marginTop: 14, padding: '12px 14px', border: '1px solid rgba(232,200,74,0.2)', background: 'rgba(232,200,74,0.04)', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--accent)', fontFamily: "'Space Mono', monospace", letterSpacing: '0.15em', fontWeight: 700 }}>UNLOCK PARTNER TIER</div>
          <div style={{ fontSize: 9, color: '#5a5550', fontFamily: "'Space Mono', monospace", marginTop: 2 }}>Mediterranean Trip + Whistler unlocked at Partner</div>
        </div>
        <a
          href="/#membership"
          style={{ padding: '6px 14px', fontSize: 9, letterSpacing: '0.15em', fontFamily: "'Space Mono', monospace", fontWeight: 700, border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent', borderRadius: 1, textDecoration: 'none', cursor: 'pointer' }}
        >
          HOW →
        </a>
      </div>
    </div>
  )
}

// ── Tab 1: MY ROADHOUSE ──────────────────────────────────────────────────────

// Next-move prompt keyed by tier — TODO: replace with live guild bounty from lib/api/bounties.ts
const NEXT_MOVE_BY_TIER = {
  guest:        'Subscribe to join the community and start earning $ROAD.',
  regular:      'Submit a guild contribution to unlock Ranch Hand tier.',
  'ranch-hand': 'A Deal Syndicate proposal is open for review.',
  partner:      'Review open governance proposals on Snapshot.',
  steward:      'Sign the pending treasury multisig proposal.',
  praetor:      'Board meeting scheduled — check your calendar.',
}

function Tracks() {
  const [active, setActive] = useState('fitness')

  return (
    <div style={{ padding: '1.25rem 1.5rem', background: '#111110', border: '1px solid #1e1e1c', borderRadius: 4 }}>
      {/* Header */}
      <div style={{ fontSize: 9, letterSpacing: '0.35em', textTransform: 'uppercase', color: '#6a6560', fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 14 }}>
        Tracks &amp; Pathways
      </div>

      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {TRACKS.map(t => (
          <button
            key={t.id}
            onClick={() => !t.locked && setActive(t.id)}
            style={{
              padding: '6px 14px',
              border: `1px solid ${active === t.id ? t.color : '#1e1e1c'}`,
              background: active === t.id ? `${t.color}18` : 'transparent',
              color: t.locked ? '#5a5550' : (active === t.id ? t.color : '#5a5550'),
              fontSize: 9, letterSpacing: '0.18em', fontFamily: "'Space Mono', monospace", fontWeight: 700,
              cursor: t.locked ? 'not-allowed' : 'pointer',
              borderRadius: 1, transition: 'all 0.15s',
              opacity: t.locked ? 0.5 : 1,
            }}
          >
            {t.locked ? '⬡ ' : ''}{t.label}
          </button>
        ))}
      </div>

      {/* Track cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TRACKS.map(t => {
          const isActive = active === t.id
          return (
            <div
              key={t.id}
              onClick={() => !t.locked && setActive(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px',
                border: `1px solid ${isActive ? t.color + '60' : '#1e1e1c'}`,
                background: isActive ? `${t.color}0C` : 'transparent',
                borderRadius: 2, cursor: t.locked ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
                opacity: t.locked ? 0.45 : 1,
              }}
            >
              {/* Left accent */}
              {isActive && (
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: t.color, boxShadow: `2px 0 8px ${t.color}60` }} />
              )}

              {/* Icon */}
              <div style={{
                width: 36, height: 36, flexShrink: 0, borderRadius: 2,
                background: isActive ? `${t.color}20` : '#111110',
                border: `1px solid ${isActive ? t.color + '40' : '#1e1e1c'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: t.color,
              }}>
                {t.icon}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontFamily: "'Space Mono', monospace", color: isActive ? t.color : '#ede8dc', fontWeight: 700, letterSpacing: '0.1em' }}>
                    {t.label}
                  </span>
                  <span style={{ fontSize: 8, color: '#5a5550', fontFamily: "'Space Mono', monospace" }}>
                    LVL {t.level}
                  </span>
                  {t.locked && (
                    <span style={{ fontSize: 8, letterSpacing: '0.15em', color: 'var(--accent2)', border: '1px solid var(--accent2)', borderRadius: 2, padding: '1px 5px', fontFamily: "'Space Mono', monospace" }}>
                      LOCKED · PARTNER+
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: '#5a5550', fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>
                  {t.sub}
                </div>
                <ProfileXPBar value={t.progress} max={100} color={t.color} height={2} />
              </div>

              {/* XP + members */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: '#5a5550', fontWeight: 700 }}>
                  {t.xp.toLocaleString()}
                </div>
                <div style={{ fontSize: 8, color: '#5a5550', fontFamily: "'Space Mono', monospace", letterSpacing: '0.1em' }}>
                  XP · {t.members} ACTIVE
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Format ISO date string "2026-03-24" → "Mar 24"
function fmtDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function MyRoadHouseTab({ memberTier, walletAddress }) {
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Edit modal state
  const [editOpen,     setEditOpen]     = useState(false)
  const [editAlias,    setEditAlias]    = useState('')
  const [editBio,      setEditBio]      = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [saving,       setSaving]       = useState(false)
  const [saveMsg,      setSaveMsg]      = useState(null)

  useEffect(() => {
    if (!walletAddress) { setProfileLoading(false); return }
    setProfileLoading(true)
    getProfile(walletAddress)
      .then(p => { setProfile(p); setProfileLoading(false) })
      .catch(() => setProfileLoading(false))
  }, [walletAddress])

  // Pre-fill edit fields from current profile whenever modal opens
  useEffect(() => {
    if (editOpen && profile) {
      setEditAlias(profile.alias ?? '')
      setEditBio(profile.bio ?? '')
      setEditAvatarUrl(profile.avatarUrl ?? '')
    }
  }, [editOpen, profile])

  // Derive display values — profile.tier takes precedence over wrapper prop
  const tier       = profile?.tier ?? memberTier ?? 'guest'
  const tierName   = TIER_DISPLAY[tier] ?? tier.toUpperCase()
  const balance    = profile?.roadBalance ?? 0
  const nextTier   = getNextTier(tier)
  const nextBalance = nextTier ? TIER_THRESHOLDS[nextTier] : TIER_THRESHOLDS[tier]
  const progress   = nextTier ? Math.min(100, (balance / nextBalance) * 100) : 100
  const nextMove   = NEXT_MOVE_BY_TIER[tier] ?? 'Check the Guild board for active bounties.'

  return (
    <div className="rh-tab-body">
      {/* Member profile card — visual layer above tier block; reuses existing profile fetch */}
      {!profileLoading && (
        <>
          <MemberProfileCard
            profile={profile}
            balance={balance}
            tier={tier}
            tierName={tierName}
            nextTier={nextTier}
            nextBalance={nextBalance}
          />
          <Divider />
          <DailyMissions />
          <Divider />
          <Tracks />
          <Divider />
          <Unlocks />
          <Divider />
        </>
      )}

      <SectionHead>My RoadHouse</SectionHead>

      {/* Tier status block — replaced by loading state while fetch resolves */}
      {profileLoading ? (
        <div style={{ color: '#8a7d6a', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1rem 0' }}>
          Loading profile...
        </div>
      ) : (
        <Card>
          <Label color="gold">Tier Status</Label>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: 'var(--accent)', letterSpacing: '0.06em' }}>
              {tierName}
            </span>
            <span className="rh-muted" style={{ fontSize: '0.68rem' }}>
              {nextTier
                ? `${balance.toLocaleString()} / ${nextBalance.toLocaleString()} $ROAD → ${TIER_DISPLAY[nextTier] ?? nextTier.toUpperCase()}`
                : 'MAX TIER'}
            </span>
          </div>
          <div style={{ background: '#2a2318', borderRadius: 2, height: 6 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
          <button
            onClick={() => setEditOpen(true)}
            style={{
              marginTop: '0.75rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--accent)',
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.625rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Edit Profile →
          </button>
        </Card>
      )}

      {/* Edit profile panel — renders below tier block when editOpen */}
      {editOpen && (
        <div style={{
          background: '#111009',
          border: '1px solid #2a2318',
          padding: '1.5rem',
          marginTop: '1rem',
          opacity: 1,
          transition: 'opacity 0.2s ease',
        }}>
          <Label color="gold">Edit Profile</Label>

          {/* Field 1 — Alias */}
          <div style={{ marginTop: '1rem' }}>
            <Label>Display Name</Label>
            <input
              type="text"
              value={editAlias}
              onChange={e => setEditAlias(e.target.value.slice(0, 32))}
              placeholder="How members see you"
              style={{
                width: '100%', background: '#1a1712', border: '1px solid #2a2318',
                color: '#e2d9c8', fontFamily: "'Space Mono', monospace",
                fontSize: '0.75rem', padding: '0.625rem 0.875rem',
                outline: 'none', boxSizing: 'border-box', marginTop: '0.4rem',
              }}
            />
            <div style={{ fontSize: '0.625rem', color: '#4a4238', marginTop: '0.25rem' }}>
              32 characters max
            </div>
          </div>

          {/* Field 2 — Bio */}
          <div style={{ marginTop: '1rem' }}>
            <Label>Bio</Label>
            <textarea
              value={editBio}
              onChange={e => setEditBio(e.target.value.slice(0, 160))}
              placeholder="160 characters max"
              rows={3}
              style={{
                width: '100%', background: '#1a1712', border: '1px solid #2a2318',
                color: '#e2d9c8', fontFamily: "'Space Mono', monospace",
                fontSize: '0.75rem', padding: '0.625rem 0.875rem',
                resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                marginTop: '0.4rem',
              }}
            />
            <div style={{
              fontSize: '0.625rem',
              color: (160 - editBio.length) < 20 ? 'var(--accent2)' : '#4a4238',
              marginTop: '0.25rem',
            }}>
              {160 - editBio.length} remaining
            </div>
          </div>

          {/* Field 3 — Avatar URL */}
          <div style={{ marginTop: '1rem' }}>
            <Label>Avatar URL</Label>
            <input
              type="url"
              value={editAvatarUrl}
              onChange={e => setEditAvatarUrl(e.target.value)}
              placeholder="https://..."
              style={{
                width: '100%', background: '#1a1712', border: '1px solid #2a2318',
                color: '#e2d9c8', fontFamily: "'Space Mono', monospace",
                fontSize: '0.75rem', padding: '0.625rem 0.875rem',
                outline: 'none', boxSizing: 'border-box', marginTop: '0.4rem',
              }}
            />
            <div style={{ fontSize: '0.625rem', color: '#4a4238', marginTop: '0.25rem' }}>
              Direct image link · 400×400px recommended
            </div>
          </div>

          {/* Save message */}
          {saveMsg && (
            <div style={{ fontSize: '0.68rem', color: 'var(--accent3)', marginTop: '0.75rem' }}>
              {saveMsg}
            </div>
          )}

          {/* Button row */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              disabled={saving}
              onClick={() => {
                setSaving(true)
                updateProfile(walletAddress, {
                  alias:     editAlias     || null,
                  bio:       editBio       || null,
                  avatarUrl: editAvatarUrl || null,
                })
                  .then(updated => {
                    setProfile(updated)
                    setSaveMsg('Profile updated')
                    setSaving(false)
                    setTimeout(() => { setSaveMsg(null); setEditOpen(false) }, 2000)
                  })
                  .catch(() => {
                    setSaveMsg('Save failed — try again')
                    setSaving(false)
                  })
              }}
              style={{
                background: saving ? 'rgba(232,200,74,0.5)' : 'var(--accent)',
                color: '#0a0a08',
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.625rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                padding: '0.625rem 1.5rem',
                border: 'none',
                cursor: saving ? 'default' : 'pointer',
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? 'SAVING...' : 'SAVE'}
            </button>

            <button
              disabled={saving}
              onClick={() => setEditOpen(false)}
              style={{
                background: 'transparent',
                border: '1px solid #2a2318',
                color: '#8a7d6a',
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.625rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                padding: '0.625rem 1.5rem',
                cursor: saving ? 'default' : 'pointer',
                opacity: saving ? 0.5 : 1,
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      <Divider />

      {/* Contribution feed */}
      <Card>
        <Label>Recent Contributions</Label>
        {/* TODO: replace with lib/api/contributions.ts */}
        <div className="rh-stack-list">
          {(profile?.contributions ?? []).slice(0, 5).map(c => (
            <div key={c.id} className="rh-stack-item">
              <span className="rh-stack-name" style={{ color: '#4a4238', minWidth: '3.5rem' }}>{fmtDate(c.date)}</span>
              <span className="rh-stack-role" style={{ flex: 1 }}>{c.label}</span>
              <span style={{ fontSize: '0.6rem', color: c.verified ? 'var(--accent3)' : '#4a4238', marginRight: '0.3rem' }}>●</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--accent3)', whiteSpace: 'nowrap' }}>+{c.roadEarned} $ROAD</span>
            </div>
          ))}
        </div>
        {/* DeSci stats line */}
        {profile && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.68rem', color: '#8a7d6a' }}>
            {profile.experimentsJoined} experiment{profile.experimentsJoined !== 1 ? 's' : ''} joined · {profile.currentStreak}-day reporting streak
          </div>
        )}
      </Card>

      <Divider />

      {/* Next action prompt */}
      <Card accent="teal">
        <Label color="teal">Your Next Move</Label>
        {/* TODO: derive from tier + active guild bounties */}
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#e2d9c8', marginTop: '0.25rem' }}>
          {nextMove}
        </div>
      </Card>

      <Divider />

      {/* Treasury pulse — slim row */}
      {/* TODO: wire to lib/gnosis.ts */}
      <Card>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <span className="rh-label" style={{ marginBottom: 0, display: 'inline' }}>DAO Treasury</span>
            {' '}
            <span style={{ fontSize: '0.72rem', color: 'var(--accent)' }}>12,450 $ROAD · 4.2 SOL</span>
          </div>
          <span className="rh-muted" style={{ fontSize: '0.65rem' }}>
            Last deposit: +2,100 $ROAD · NFT royalties · 3 days ago
          </span>
        </div>
      </Card>
    </div>
  )
}

// ── Tab 2: ECONOMY ───────────────────────────────────────────────────────────

function EconomyTab({ walletAddress }) {
  const [listings,        setListings]        = useState({ offering: [], seeking: [] })
  const [listingsLoading, setListingsLoading] = useState(true)
  const [postMsg,         setPostMsg]         = useState(null)

  useEffect(() => {
    setListingsLoading(true)
    getListings()
      .then(data => { setListings(data); setListingsLoading(false) })
      .catch(() => setListingsLoading(false))
  }, [])

  return (
    <div className="rh-tab-body">
      <SectionHead>Member Marketplace</SectionHead>

      {listingsLoading ? (
        <div style={{ color: '#8a7d6a', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '1rem 0' }}>
          Loading marketplace...
        </div>
      ) : (
        <div className="rh-grid-2">
          {/* Offering column */}
          <Card>
            <Label color="teal">Offering</Label>
            <div className="rh-stack-list">
              {listings.offering.map((l, i) => (
                <div key={l.id} style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #1a1712', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.2rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--accent3)', border: '1px solid rgba(74,240,200,0.2)', borderRadius: 2, padding: '0.1rem 0.4rem' }}>
                      {l.category}
                    </span>
                    <span style={{ fontSize: '0.62rem', color: '#4a4238' }}>
                      {i === 0 ? (walletAddress ?? l.walletAlias) : l.walletAlias}
                    </span>
                  </div>
                  <span className="rh-stack-role">{l.description}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Seeking column */}
          <Card>
            <Label color="gold">Seeking</Label>
            <div className="rh-stack-list">
              {listings.seeking.map(l => (
                <div key={l.id} style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #1a1712', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.2rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--accent)', border: '1px solid rgba(232,200,74,0.2)', borderRadius: 2, padding: '0.1rem 0.4rem' }}>
                      {l.category}
                    </span>
                    <span style={{ fontSize: '0.62rem', color: '#4a4238' }}>{l.walletAlias}</span>
                  </div>
                  <span className="rh-stack-role">{l.description}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Post a Listing — no <form>, div + onClick */}
      <div
        onClick={() => {
          createListing({
            type:         'offering',
            category:     'GENERAL',
            walletAlias:  walletAddress ?? 'Anonymous',
            description:  'New listing — edit coming in M3',
            tierRequired: 'ranch-hand',
          }).then(newListing => {
            setListings(prev => ({
              ...prev,
              offering: [newListing, ...prev.offering],
            }))
            setPostMsg('Listing submitted — pending review')
            setTimeout(() => setPostMsg(null), 3000)
          }).catch(() => {
            setPostMsg('Failed to post — try again')
            setTimeout(() => setPostMsg(null), 3000)
          })
        }}
        role="button"
        style={{
          border: '1px solid var(--accent)', borderRadius: 3, padding: '0.75rem',
          textAlign: 'center', cursor: 'pointer', fontFamily: 'Space Mono, monospace',
          fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--accent)', marginTop: '0.75rem', transition: 'background 0.2s',
        }}
      >
        Post a Listing
      </div>

      {postMsg && (
        <div style={{ color: 'var(--accent3)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '12px' }}>
          {postMsg}
        </div>
      )}

      <p className="rh-muted" style={{ fontSize: '0.65rem', textAlign: 'center', marginTop: '0.75rem' }}>
        Ranch Hand+ to post · Regular to browse
      </p>
    </div>
  )
}

// ── Tab 3: DESCI ─────────────────────────────────────────────────────────────

function DeSciTab({ walletAddress }) {
  const [experiment,   setExperiment]   = useState(null)
  const [stats,        setStats]        = useState(null)
  const [expLoading,   setExpLoading]   = useState(true)
  const [bedtime,      setBedtime]      = useState('')
  const [waketime,     setWaketime]     = useState('')
  const [energyScore,  setEnergyScore]  = useState(5)
  const [submitting,   setSubmitting]   = useState(false)
  const [submitMsg,    setSubmitMsg]    = useState(null)

  useEffect(() => {
    Promise.all([getActiveExperiment(), getAggregateStats()])
      .then(([exp, agg]) => {
        setExperiment(exp)
        setStats(agg)
        setExpLoading(false)
      })
      .catch(() => setExpLoading(false))
  }, [])

  const inputStyle = {
    background: '#111009', border: '1px solid #2a2318', color: '#e2d9c8',
    fontFamily: 'Space Mono, monospace', fontSize: '0.72rem',
    padding: '0.5rem 0.75rem', borderRadius: 3, width: '100%',
    outline: 'none', boxSizing: 'border-box',
  }

  const handleSubmit = () => {
    setSubmitting(true)
    submitDailyEntry(walletAddress ?? 'anonymous', {
      date:        new Date().toISOString().split('T')[0],
      bedtime,
      waketime,
      energyScore: Number(energyScore),
    }).then(() => {
      setSubmitMsg('Entry recorded')
      setStats(prev => prev ? { ...prev, totalEntries: prev.totalEntries + 1 } : prev)
      setTimeout(() => setSubmitMsg(null), 3000)
    }).catch(e => {
      setSubmitMsg(e.message === 'Already submitted today'
        ? 'Already submitted today'
        : 'Submit failed — try again')
      setTimeout(() => setSubmitMsg(null), 3000)
    }).finally(() => setSubmitting(false))
  }

  return (
    <div className="rh-tab-body">
      <SectionHead>Active Protocols</SectionHead>

      {/* Active experiment card */}
      <Card accent="red">
        {expLoading ? (
          <div className="rh-muted" style={{ fontSize: '0.72rem', padding: '2rem 0', textAlign: 'center' }}>
            LOADING EXPERIMENT...
          </div>
        ) : (
          <>
            <span style={{
              fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--accent2)', border: '1px solid rgba(255,92,53,0.3)',
              borderRadius: 2, padding: '0.2rem 0.5rem',
              marginBottom: '0.75rem', display: 'inline-block',
            }}>
              Week {experiment?.weekCurrent ?? 2} of {experiment?.weekTotal ?? 4}
            </span>

            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.25rem', letterSpacing: '0.06em', color: '#e2d9c8', margin: '0.25rem 0' }}>
              {experiment?.title ?? 'Sleep Optimisation Sprint'}
            </div>
            <p className="rh-body" style={{ marginBottom: '0.5rem' }}>
              {experiment?.description ?? '10pm–6am protocol. Track bedtime, wake time, energy.'}
            </p>
            <p className="rh-muted" style={{ fontSize: '0.65rem', marginBottom: '1rem' }}>
              {stats?.totalEntries ?? 23} members reporting this week
            </p>

            {/* Aggregate bars */}
            <div style={{ marginBottom: '1rem' }}>
              {[
                { label: 'AVG ENERGY SCORE', value: stats?.avgEnergyScore ?? 7.2, max: 10 },
                { label: 'AVG SLEEP HOURS',  value: stats?.avgSleepHours  ?? 7.8, max: 9  },
              ].map(b => (
                <div key={b.label} style={{ marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span className="rh-label" style={{ marginBottom: 0, display: 'inline', fontSize: '0.6rem' }}>{b.label}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--accent3)' }}>{b.value} / {b.max}</span>
                  </div>
                  <div style={{ background: '#2a2318', borderRadius: 2, height: 5 }}>
                    <div style={{ width: `${(b.value / b.max) * 100}%`, height: '100%', background: 'var(--accent3)', borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Data submission — div + onClick, no <form> tag */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div>
                <Label>Bedtime</Label>
                <input type="time" value={bedtime} onChange={e => setBedtime(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <Label>Wake Time</Label>
                <input type="time" value={waketime} onChange={e => setWaketime(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <Label>Energy 1–10</Label>
                <input type="number" min="1" max="10" value={energyScore} onChange={e => setEnergyScore(e.target.value)} placeholder="7" style={inputStyle} />
              </div>
            </div>

            <div
              onClick={submitting ? undefined : handleSubmit}
              role="button"
              style={{
                background: 'var(--accent)', color: '#0a0a08',
                fontFamily: 'Space Mono, monospace', fontSize: '0.7rem',
                fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '0.75rem', textAlign: 'center', borderRadius: 3,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1, transition: 'opacity 0.2s',
              }}
            >
              {submitting ? 'Submitting...' : "Submit Today's Entry"}
            </div>

            {submitMsg && (
              <div style={{
                marginTop: '0.5rem', fontSize: '0.68rem', textAlign: 'center',
                color: submitMsg === 'Entry recorded' ? 'var(--accent3)' : 'var(--accent2)',
              }}>
                {submitMsg}
              </div>
            )}
          </>
        )}
      </Card>

      <Divider />

      {/* Upcoming experiments */}
      <Card>
        <Label>Upcoming</Label>
        <div className="rh-stack-item" style={{ marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '0.6rem', color: '#4a4238', border: '1px solid #2a2318', borderRadius: 2, padding: '0.1rem 0.4rem', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
            PLANNED
          </span>
          <span className="rh-stack-role">Applied Tech: 3D print material stress test · Starts May 2026</span>
        </div>
        <div className="rh-stack-item" style={{ marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--accent3)', border: '1px solid rgba(74,240,200,0.2)', borderRadius: 2, padding: '0.1rem 0.4rem', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
            VOTING
          </span>
          <span className="rh-stack-role">Economic: 30-day micro-business sprint · Vote open on Snapshot</span>
        </div>
        {/* TODO: wire to lib/snapshot.ts getActiveProposals() */}
        <a href="https://snapshot.org" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: 'var(--accent3)', textDecoration: 'none' }}>
          Vote on next experiment →
        </a>
      </Card>
    </div>
  )
}

// ── Tab 4: GUILD ─────────────────────────────────────────────────────────────

function GuildTab({ walletAddress }) {
  // Live week indicator — clamped 1–8 relative to sprint start April 1 2026
  // Before April 1 2026: clamps to WEEK 1
  // After week 8 end: clamps to WEEK 8
  const sprintStart = new Date('2026-04-01').getTime()
  const rawWeek = Math.ceil((Date.now() - sprintStart) / (7 * 24 * 60 * 60 * 1000))
  const currentWeek = Math.max(1, Math.min(8, rawWeek))

  const phaseNames = {
    1: 'Foundation & Setup',
    2: 'Wallet Integration',
    3: 'Dashboard Core',
    4: 'Guild Activation',
    5: 'DeSci Layer',
    6: 'Treasury Connect',
    7: 'Economy Board',
    8: 'M2 Review',
  }

  const [bounties,        setBounties]        = useState([])
  const [bountiesLoading, setBountiesLoading] = useState(true)
  const [claimMsg,        setClaimMsg]        = useState(null)
  const [claimedIds,      setClaimedIds]      = useState([])

  useEffect(() => {
    getActiveBounties('media')
      .then(b => { setBounties(b); setBountiesLoading(false) })
      .catch(() => setBountiesLoading(false))
  }, [])

  const handleClaim = (bountyId) => {
    claimBounty(walletAddress ?? 'anonymous', bountyId)
      .then(() => {
        setClaimedIds(prev => [...prev, bountyId])
        setClaimMsg('Bounty claimed — pending steward review')
        setTimeout(() => setClaimMsg(null), 3000)
      })
      .catch(e => {
        setClaimMsg(e.message)
        setTimeout(() => setClaimMsg(null), 3000)
      })
  }

  const milestones = [
    {
      label: 'M1 — Web2 Perfect', period: 'April 2026', status: 'complete',
      items: [
        'Stripe price IDs locked', 'Webhook handler: full lifecycle',
        'Discord bot: role gating + /verify', 'Transactional emails via Resend',
        'Member portal /portal', 'Merch checkout + size metadata',
        'KV $ROAD tracking', 'Wallet connect polished',
      ],
    },
    {
      label: 'M2 — Web3 Architecture', period: 'May 2026', status: 'active',
      items: [
        '$ROAD tokenomics spec + legal opinion', 'Squads multisig devnet deploy',
        'DAO governance spec: Snapshot + Aragon', 'Founding NFT: Candy Machine v3 spec',
        'SK incorporation',
      ],
    },
    {
      label: 'M3 — Adventure NFTs + DAO', period: 'June 2026', status: 'upcoming',
      items: [
        'Adventure #001–003 pages', '/adventures hub',
        'Four guilds + /guilds page', 'Claude orchestrator agent',
      ],
    },
  ]

  return (
    <div className="rh-tab-body">
      {/* Live week indicator */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '4rem', lineHeight: 1, color: 'var(--accent)', letterSpacing: '0.04em' }}>
          WEEK {currentWeek} OF 8
        </div>
        <div className="rh-muted" style={{ fontSize: '0.72rem', marginTop: '0.25rem' }}>
          {phaseNames[currentWeek]}
        </div>
      </div>

      {/* Guild assignment block */}
      {/* TODO: wire to member profile */}
      <Card>
        <Label>Your Guild</Label>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#e2d9c8', marginBottom: '0.25rem' }}>
          Media Guild
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <span className="rh-muted" style={{ fontSize: '0.65rem' }}>KPI: Monthly Reach</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--accent3)' }}>Recruiting</span>
        </div>

        <Label>Active Bounties</Label>
        <div className="rh-stack-list" style={{ marginBottom: '1rem' }}>
          {bountiesLoading ? (
            <div className="rh-muted" style={{ fontSize: '0.72rem', padding: '0.5rem 0' }}>
              LOADING BOUNTIES...
            </div>
          ) : (
            bounties.map(b => {
              const claimed = claimedIds.includes(b.id)
              return (
                <div key={b.id} className="rh-stack-item">
                  <span
                    role="checkbox"
                    aria-checked={claimed}
                    onClick={claimed ? undefined : () => handleClaim(b.id)}
                    style={{
                      fontSize: '0.7rem', color: claimed ? 'var(--accent3)' : '#4a4238',
                      flexShrink: 0, cursor: claimed ? 'default' : 'pointer',
                    }}
                  >
                    {claimed ? '[✓]' : '[ ]'}
                  </span>
                  <span className="rh-stack-role" style={{ flex: 1 }}>{b.label}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                    +{b.roadReward} $ROAD
                  </span>
                </div>
              )
            })
          )}
        </div>

        {claimMsg && (
          <div style={{ fontSize: '0.68rem', color: 'var(--accent3)', marginBottom: '0.75rem' }}>
            {claimMsg}
          </div>
        )}

        <div
          onClick={() => {}}
          // Claiming is per-bounty — click the checkbox on each row
          role="button"
          style={{
            border: '1px solid #2a2318', borderRadius: 3, padding: '0.6rem',
            textAlign: 'center', cursor: 'pointer', fontFamily: 'Space Mono, monospace',
            fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase',
            color: '#8a7d6a',
          }}
        >
          Claim a Bounty
        </div>
      </Card>

      <Divider />

      {/* Execution timeline — M1 complete (muted), M2 active (gold), M3 upcoming */}
      {milestones.map(m => {
        const titleColor = m.status === 'complete' ? '#4a4238'
                         : m.status === 'active'   ? 'var(--accent)'
                         : '#e2d9c8'
        const prefix = m.status === 'complete' ? '✓ ' : ''
        return (
          <Card key={m.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.1rem', letterSpacing: '0.05em', color: titleColor }}>
                {prefix}{m.label}
              </span>
              <span className="rh-label" style={{ color: titleColor, marginBottom: 0 }}>{m.period}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {m.items.map(item => (
                <div key={item} style={{ fontSize: '0.68rem', color: m.status === 'complete' ? '#4a4238' : '#8a7d6a' }}>
                  {item}
                </div>
              ))}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// ── Tab 5: TREASURY ──────────────────────────────────────────────────────────

function TreasuryTab({ memberTier }) {
  const isFullTreasury = memberTier === 'steward' || memberTier === 'praetor'

  const [snapshot,        setSnapshot]        = useState(null)
  const [votes,           setVotes]           = useState([])
  const [treasuryLoading, setTreasuryLoading] = useState(true)

  useEffect(() => {
    Promise.all([getTreasurySnapshot(), getGovernanceVotes()])
      .then(([snap, v]) => {
        setSnapshot(snap)
        setVotes(v)
        setTreasuryLoading(false)
      })
      .catch(() => setTreasuryLoading(false))
  }, [])

  return (
    <div className="rh-tab-body">
      <SectionHead>DAO Treasury</SectionHead>

      {treasuryLoading ? (
        <div className="rh-muted" style={{ fontSize: '0.72rem', padding: '2rem 0', textAlign: 'center' }}>
          LOADING TREASURY...
        </div>
      ) : (
        <>
          {/* 3 metric cards */}
          <div className="rh-grid-3">
            <Card>
              <Label>$ROAD Balance</Label>
              <div className="rh-stat-value">{(snapshot?.roadBalance ?? 12450).toLocaleString()} $ROAD</div>
              <div className="rh-stat-note">Pre-launch · Vercel KV</div>
            </Card>
            <Card>
              <Label>SOL Balance</Label>
              <div className="rh-stat-value">{snapshot?.solBalance ?? 4.2} SOL</div>
              <div className="rh-stat-note">Devnet treasury wallet</div>
            </Card>
            <Card>
              <Label>Last Deposit</Label>
              <div className="rh-stat-value">
                +{(snapshot?.lastDeposit?.amount ?? 2100).toLocaleString()} $ROAD
              </div>
              <div className="rh-stat-note">
                {snapshot?.lastDeposit?.reason ?? 'NFT royalties'} · {snapshot?.lastDeposit?.daysAgo ?? 3} days ago
              </div>
            </Card>
          </div>

          <Divider />

          {/* Active governance votes */}
          {votes.map(v => {
            const badgeColor  = v.daysLeft <= 1 ? 'var(--accent2)' : 'var(--accent3)'
            const badgeBorder = v.daysLeft <= 1 ? 'rgba(255,92,53,0.2)' : 'rgba(74,240,200,0.2)'
            return (
              <Card key={v.id}>
                <span style={{
                  fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: badgeColor, border: `1px solid ${badgeBorder}`,
                  borderRadius: 2, padding: '0.15rem 0.45rem',
                  display: 'inline-block', marginBottom: '0.6rem',
                }}>
                  OPEN · {v.daysLeft} {v.daysLeft === 1 ? 'DAY' : 'DAYS'} LEFT
                </span>
                <p className="rh-body" style={{ margin: '0 0 0.75rem', color: '#e2d9c8', fontSize: '0.78rem' }}>
                  {v.title}
                </p>

                {/* Vote bars */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {[
                    { label: 'YES', pct: v.yesPercent, color: 'var(--accent3)' },
                    { label: 'NO',  pct: v.noPercent,  color: '#4a4238' },
                  ].map(bar => (
                    <div key={bar.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.6rem', letterSpacing: '0.12em', color: bar.color }}>{bar.label}</span>
                        <span style={{ fontSize: '0.6rem', color: bar.color }}>{bar.pct}%</span>
                      </div>
                      <div style={{ background: '#2a2318', borderRadius: 2, height: 4 }}>
                        <div style={{ width: `${bar.pct}%`, height: '100%', background: bar.color, borderRadius: 2 }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="rh-muted" style={{ fontSize: '0.62rem' }}>{v.voteCount} votes</span>
                  <a href={v.snapshotUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.68rem', color: 'var(--accent3)', textDecoration: 'none' }}>
                    Vote on Snapshot →
                  </a>
                </div>
              </Card>
            )
          })}

          <Divider />

          {/* Reinvestment split */}
          <Card>
            <Label>Reinvestment Split</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.25rem' }}>
              {[
                { label: 'DAO Treasury', pct: '50%' },
                { label: 'Operations',   pct: '25%' },
                { label: 'Projects',     pct: '15%' },
                { label: 'Founder',      pct: '10%' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: '0.5rem', background: '#0a0a08', borderRadius: 3 }}>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.4rem', color: 'var(--accent)', letterSpacing: '0.04em' }}>
                    {s.pct}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#4a4238', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Access note — isFullTreasury gate preserved exactly */}
      <p className="rh-muted" style={{ fontSize: '0.65rem', marginTop: '0.75rem', textAlign: 'center', color: isFullTreasury ? 'var(--accent3)' : undefined }}>
        {isFullTreasury
          ? 'Full treasury ledger — Steward access confirmed'
          : 'Full treasury ledger visible to Steward+ tier'}
      </p>
    </div>
  )
}

// ── Root component ───────────────────────────────────────────────────────────

export default function RoadHouse({ memberTier = 'guest', walletAddress = null }) {
  const [active, setActive] = useState('MY ROADHOUSE')

  const tabContent = {
    'MY ROADHOUSE': <MyRoadHouseTab memberTier={memberTier} walletAddress={walletAddress} />,
    'ECONOMY':      <EconomyTab walletAddress={walletAddress} />,
    'DESCI':        <DeSciTab walletAddress={walletAddress} />,
    'GUILD':        <GuildTab walletAddress={walletAddress} />,
    'TREASURY':     <TreasuryTab memberTier={memberTier} />,
  }

  return (
    <div className="rh-dash">
      {/*
       * Scoped font import + CSS variable declarations.
       * Variables are scoped to .rh-dash — they do not bleed into the rest of the app.
       * Grain overlay is inherited from body.grain in globals.css — not re-declared.
       */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&family=Syne:wght@400;500;600;700;800&display=swap');

        .rh-dash {
          --bg:      #0a0a08;
          --accent:  #e8c84a;
          --accent2: #ff5c35;
          --accent3: #4af0c8;
          background: var(--bg);
          color: #e2d9c8;
          font-family: 'Space Mono', monospace;
          min-height: 100vh;
        }

        /* Tab nav */
        .rh-tab-nav {
          display: flex;
          gap: 0;
          border-bottom: 1px solid #2a2318;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .rh-tab-nav::-webkit-scrollbar { display: none; }

        .rh-tab-btn {
          padding: 0.9rem 1.4rem;
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #8a7d6a;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          white-space: nowrap;
          transition: color 0.2s, border-color 0.2s;
        }
        .rh-tab-btn:hover {
          color: #e2d9c8;
        }
        .rh-tab-btn.rh-active {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }

        /* Content area */
        .rh-tab-body {
          padding: 2rem;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
        }

        /* Typography */
        .rh-section-head {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2rem;
          letter-spacing: 0.08em;
          color: #e2d9c8;
          margin: 0 0 0.75rem 0;
        }
        .rh-lead {
          font-size: 0.78rem;
          line-height: 1.8;
          color: #8a7d6a;
          margin: 0 0 0.5rem 0;
        }
        .rh-body {
          font-size: 0.75rem;
          line-height: 1.8;
          color: #8a7d6a;
          margin: 0.5rem 0 0 0;
        }
        .rh-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #8a7d6a;
          display: block;
          margin-bottom: 0.5rem;
        }
        .rh-muted { color: #8a7d6a; }

        /* Cards */
        .rh-card {
          background: #111009;
          border: 1px solid #2a2318;
          border-radius: 4px;
          padding: 1.25rem;
          transition: border-color 0.2s;
          margin-bottom: 0.75rem;
        }

        /* Divider */
        .rh-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #2a2318, transparent);
          margin: 1.5rem 0;
        }

        /* Grids */
        .rh-grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 0.75rem;
        }
        .rh-grid-3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.75rem;
        }

        /* Stats */
        .rh-stat-value {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          color: #e2d9c8;
          margin-bottom: 0.25rem;
        }
        .rh-stat-note {
          font-size: 0.68rem;
          color: #4a4238;
          line-height: 1.5;
        }

        /* Pillar */
        .rh-pillar-code { margin-bottom: 0.5rem; }
        .rh-pillar-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.1rem;
          letter-spacing: 0.06em;
          margin-bottom: 0.25rem;
        }

        /* Tagline */
        .rh-tagline {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.8rem;
          color: var(--accent);
          letter-spacing: 0.04em;
          margin: 0.5rem 0 0.25rem;
        }
        .rh-tagline-sub {
          font-size: 0.7rem;
          color: #4a4238;
          font-style: italic;
          letter-spacing: 0.08em;
        }

        /* Flow diagram */
        .rh-flow {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }
        .rh-flow-node {
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 0.3rem 0.6rem;
          border: 1px solid #2a2318;
          border-radius: 2px;
        }
        .rh-flow-arrow { color: #4a4238; font-size: 0.75rem; }

        /* Table */
        .rh-table-wrap { margin-top: 0.5rem; }
        .rh-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.72rem;
          margin-top: 0.75rem;
        }
        .rh-table th {
          text-align: left;
          padding: 0.5rem 0.75rem;
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #4a4238;
          border-bottom: 1px solid #2a2318;
        }
        .rh-table td {
          padding: 0.6rem 0.75rem;
          border-bottom: 1px solid #1a1712;
          color: #e2d9c8;
        }
        .rh-table tr:last-child td { border-bottom: none; }

        /* Stack list */
        .rh-stack-list {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-top: 0.5rem;
          padding-left: 0.5rem;
        }
        .rh-stack-item { display: flex; gap: 1rem; align-items: baseline; }
        .rh-stack-name {
          font-size: 0.72rem;
          font-weight: 700;
          min-width: 180px;
          flex-shrink: 0;
        }
        .rh-stack-role { font-size: 0.68rem; color: #4a4238; }

        /* Research grid */
        .rh-research-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 0.5rem;
          margin-top: 0.75rem;
        }
        .rh-research-item { font-size: 0.72rem; color: #e2d9c8; }

        /* Milestone */
        .rh-milestone-items { display: flex; flex-direction: column; gap: 0.3rem; }
        .rh-milestone-item { font-size: 0.7rem; color: #8a7d6a; }

        /* Responsive */
        @media (max-width: 640px) {
          .rh-tab-body { padding: 1.25rem; }
          .rh-stack-name { min-width: 130px; }
          .rh-tab-btn { padding: 0.75rem 1rem; font-size: 0.65rem; }
        }
      `}</style>

      {/* Tab navigation */}
      <nav className="rh-tab-nav" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={active === tab}
            className={`rh-tab-btn${active === tab ? ' rh-active' : ''}`}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Active tab content */}
      <div role="tabpanel">
        {tabContent[active]}
      </div>
    </div>
  )
}
