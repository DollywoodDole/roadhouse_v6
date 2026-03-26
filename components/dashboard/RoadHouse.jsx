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

import { useState } from 'react'

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

// ── Tab 1: MY ROADHOUSE ──────────────────────────────────────────────────────

function MyRoadHouseTab() {
  // TODO: wire to lib/solana.ts getTierFromBalance — hardcoded ranch-hand / 800 $ROAD
  const tierName    = 'RANCH HAND'
  const balance     = 800
  const nextTier    = 'PARTNER'
  const nextBalance = 2000
  const progress    = (balance / nextBalance) * 100  // 40%

  // TODO: wire to lib/api/contributions.ts
  const feed = [
    { date: 'Mar 24', action: 'Guild content submission',      road: '+200' },
    { date: 'Mar 22', action: 'Referral — new member joined',  road: '+100' },
    { date: 'Mar 20', action: 'TikTok script submitted',       road: '+100' },
    { date: 'Mar 18', action: 'Event attendance verified',     road: '+150' },
    { date: 'Mar 15', action: 'Onboarding complete',           road: '+50'  },
  ]

  // TODO: derive from tier + active guild bounties — hardcoded for ranch-hand
  const nextMove = 'A Deal Syndicate proposal is open for review.'

  return (
    <div className="rh-tab-body">
      <SectionHead>My RoadHouse</SectionHead>

      {/* Tier status block */}
      <Card>
        <Label color="gold">Tier Status</Label>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
          <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.8rem', color: 'var(--accent)', letterSpacing: '0.06em' }}>
            {tierName}
          </span>
          <span className="rh-muted" style={{ fontSize: '0.68rem' }}>
            {balance.toLocaleString()} / {nextBalance.toLocaleString()} $ROAD → {nextTier}
          </span>
        </div>
        <div style={{ background: '#2a2318', borderRadius: 2, height: 6 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', borderRadius: 2, transition: 'width 0.4s ease' }} />
        </div>
      </Card>

      <Divider />

      {/* Contribution feed */}
      <Card>
        <Label>Recent Contributions</Label>
        {/* TODO: wire to lib/api/contributions.ts */}
        <div className="rh-stack-list">
          {feed.map(f => (
            <div key={f.date + f.action} className="rh-stack-item">
              <span className="rh-stack-name" style={{ color: '#4a4238', minWidth: '3.5rem' }}>{f.date}</span>
              <span className="rh-stack-role" style={{ flex: 1 }}>{f.action}</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--accent3)', whiteSpace: 'nowrap' }}>{f.road} $ROAD</span>
            </div>
          ))}
        </div>
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

function EconomyTab() {
  // TODO: wire to lib/api/listings.ts — hardcoded sample listings
  const offering = [
    { tag: 'VIDEO EDITING', addr: '0xAB...3F', desc: '30-min Kick clip turnaround, 48hr' },
    { tag: 'DESIGN',        addr: '0xCD...7A', desc: 'Thumbnail + overlay package' },
    { tag: 'TRANSLATION',   addr: '0xEF...2B', desc: 'EN→FR, tech/gaming content' },
  ]
  const seeking = [
    { tag: 'DEV',     addr: '0x12...9C', desc: 'Need Solana wallet integration review' },
    { tag: 'EVENTS',  addr: '0x34...1D', desc: 'Looking for SK-based event host' },
    { tag: 'CONTENT', addr: '0x56...8E', desc: 'VOD clip assistant, 5hrs/week' },
  ]

  return (
    <div className="rh-tab-body">
      <SectionHead>Member Marketplace</SectionHead>

      <div className="rh-grid-2">
        {/* Offering column */}
        <Card>
          <Label color="teal">Offering</Label>
          <div className="rh-stack-list">
            {offering.map(l => (
              <div key={l.addr} style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #1a1712', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.2rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--accent3)', border: '1px solid rgba(74,240,200,0.2)', borderRadius: 2, padding: '0.1rem 0.4rem' }}>
                    {l.tag}
                  </span>
                  <span style={{ fontSize: '0.62rem', color: '#4a4238' }}>{l.addr}</span>
                </div>
                <span className="rh-stack-role">{l.desc}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Seeking column */}
        <Card>
          <Label color="gold">Seeking</Label>
          <div className="rh-stack-list">
            {seeking.map(l => (
              <div key={l.addr} style={{ paddingBottom: '0.75rem', borderBottom: '1px solid #1a1712', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.2rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--accent)', border: '1px solid rgba(232,200,74,0.2)', borderRadius: 2, padding: '0.1rem 0.4rem' }}>
                    {l.tag}
                  </span>
                  <span style={{ fontSize: '0.62rem', color: '#4a4238' }}>{l.addr}</span>
                </div>
                <span className="rh-stack-role">{l.desc}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Post a Listing — no <form>, div + onClick */}
      {/* TODO: wire to lib/api/listings.ts createListing() */}
      <div
        onClick={() => {}}
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

      <p className="rh-muted" style={{ fontSize: '0.65rem', textAlign: 'center', marginTop: '0.75rem' }}>
        Ranch Hand+ to post · Regular to browse
      </p>
    </div>
  )
}

// ── Tab 3: DESCI ─────────────────────────────────────────────────────────────

function DeSciTab() {
  const [bedtime,  setBedtime]  = useState('')
  const [waketime, setWaketime] = useState('')
  const [energy,   setEnergy]   = useState('')

  const inputStyle = {
    background: '#111009', border: '1px solid #2a2318', color: '#e2d9c8',
    fontFamily: 'Space Mono, monospace', fontSize: '0.72rem',
    padding: '0.5rem 0.75rem', borderRadius: 3, width: '100%',
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div className="rh-tab-body">
      <SectionHead>Active Protocols</SectionHead>

      {/* Active experiment card */}
      <Card accent="red">
        <span style={{
          fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'var(--accent2)', border: '1px solid rgba(255,92,53,0.3)',
          borderRadius: 2, padding: '0.2rem 0.5rem',
          marginBottom: '0.75rem', display: 'inline-block',
        }}>
          Week 2 of 4
        </span>

        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2.25rem', letterSpacing: '0.06em', color: '#e2d9c8', margin: '0.25rem 0' }}>
          Sleep Optimisation Sprint
        </div>
        <p className="rh-body" style={{ marginBottom: '0.5rem' }}>
          10pm–6am protocol. Track bedtime, wake time, energy.
        </p>
        <p className="rh-muted" style={{ fontSize: '0.65rem', marginBottom: '1rem' }}>
          23 members reporting this week
        </p>

        {/* Aggregate bars */}
        <div style={{ marginBottom: '1rem' }}>
          {[
            { label: 'AVG ENERGY SCORE', value: 7.2, max: 10 },
            { label: 'AVG SLEEP HOURS',  value: 7.8, max: 9  },
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
            <input type="number" min="1" max="10" value={energy} onChange={e => setEnergy(e.target.value)} placeholder="7" style={inputStyle} />
          </div>
        </div>

        {/* Submit — TODO: wire to lib/api/experiments.ts submitEntry() */}
        <div
          onClick={() => {}}
          role="button"
          style={{
            background: 'var(--accent)', color: '#0a0a08',
            fontFamily: 'Space Mono, monospace', fontSize: '0.7rem',
            fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '0.75rem', textAlign: 'center', borderRadius: 3,
            cursor: 'pointer', transition: 'opacity 0.2s',
          }}
        >
          Submit Today's Entry
        </div>
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

function GuildTab() {
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

  // TODO: wire to lib/api/bounties.ts
  const bounties = [
    { task: "Clip 3 VOD highlights from this week's stream", road: '+200 $ROAD' },
    { task: 'Translate 1 post to French or Spanish',         road: '+150 $ROAD' },
    { task: 'Submit 1 TikTok script draft',                  road: '+100 $ROAD' },
  ]

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
        {/* TODO: wire to lib/api/bounties.ts */}
        <div className="rh-stack-list" style={{ marginBottom: '1rem' }}>
          {bounties.map(b => (
            <div key={b.task} className="rh-stack-item">
              <span style={{ fontSize: '0.7rem', color: '#4a4238', flexShrink: 0 }}>[ ]</span>
              <span className="rh-stack-role" style={{ flex: 1 }}>{b.task}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--accent)', whiteSpace: 'nowrap' }}>{b.road}</span>
            </div>
          ))}
        </div>

        <div
          onClick={() => {}}
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

function TreasuryTab() {
  // TODO: wire to lib/gnosis.ts getBalance()
  const metrics = [
    { label: '$ROAD Balance', value: '12,450 $ROAD', note: 'Pre-launch · Vercel KV' },
    { label: 'SOL Balance',   value: '4.2 SOL',       note: 'Devnet treasury wallet' },
    { label: 'Last Deposit',  value: '+2,100 $ROAD',  note: 'NFT royalties · 3 days ago' },
  ]

  // TODO: wire to lib/snapshot.ts getActiveProposals()
  const votes = [
    {
      badge: 'OPEN · 3 DAYS LEFT',
      badgeColor: 'var(--accent3)', badgeBorder: 'rgba(74,240,200,0.2)',
      text: 'Allocate 500 $ROAD to Media Guild Q2 bounty pool',
      yes: 68, no: 32, total: 47,
    },
    {
      badge: 'OPEN · 1 DAY LEFT',
      badgeColor: 'var(--accent2)', badgeBorder: 'rgba(255,92,53,0.2)',
      text: 'Approve Lake Trip deposit subsidy for Ranch Hand+',
      yes: 52, no: 48, total: 31,
    },
  ]

  return (
    <div className="rh-tab-body">
      <SectionHead>DAO Treasury</SectionHead>

      {/* 3 metric cards */}
      <div className="rh-grid-3">
        {metrics.map(m => (
          <Card key={m.label}>
            <Label>{m.label}</Label>
            <div className="rh-stat-value">{m.value}</div>
            <div className="rh-stat-note">{m.note}</div>
          </Card>
        ))}
      </div>

      <Divider />

      {/* Active governance votes */}
      {votes.map(v => (
        <Card key={v.text}>
          <span style={{
            fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase',
            color: v.badgeColor, border: `1px solid ${v.badgeBorder}`,
            borderRadius: 2, padding: '0.15rem 0.45rem',
            display: 'inline-block', marginBottom: '0.6rem',
          }}>
            {v.badge}
          </span>
          <p className="rh-body" style={{ margin: '0 0 0.75rem', color: '#e2d9c8', fontSize: '0.78rem' }}>
            {v.text}
          </p>

          {/* Vote bars */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {[
              { label: 'YES', pct: v.yes,  color: 'var(--accent3)' },
              { label: 'NO',  pct: v.no,   color: '#4a4238' },
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
            <span className="rh-muted" style={{ fontSize: '0.62rem' }}>{v.total} votes</span>
            <a href="https://snapshot.org" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.68rem', color: 'var(--accent3)', textDecoration: 'none' }}>
              Vote on Snapshot →
            </a>
          </div>
        </Card>
      ))}

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

      {/* Access note — TODO: gate by tier using memberTier prop */}
      <p className="rh-muted" style={{ fontSize: '0.65rem', marginTop: '0.75rem', textAlign: 'center' }}>
        Full treasury ledger visible to Steward+ tier
      </p>
    </div>
  )
}

// ── Root component ───────────────────────────────────────────────────────────

export default function RoadHouse() {
  const [active, setActive] = useState('MY ROADHOUSE')

  const tabContent = {
    'MY ROADHOUSE': <MyRoadHouseTab />,
    'ECONOMY':      <EconomyTab />,
    'DESCI':        <DeSciTab />,
    'GUILD':        <GuildTab />,
    'TREASURY':     <TreasuryTab />,
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
