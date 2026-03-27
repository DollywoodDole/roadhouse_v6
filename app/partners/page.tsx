'use client'

import { useState } from 'react'
import { Loader2, Check, AlertTriangle } from 'lucide-react'
import NetworkIndicator from '@/components/wallet/NetworkIndicator'
import WalletButton from '@/components/wallet/WalletButton'
import TokenGate from '@/components/wallet/TokenGate'

// ── Data ──────────────────────────────────────────────────────────────────────

const PARTNER_BENEFITS = [
  {
    icon: '◆',
    label: 'Guild Leadership Candidacy',
    desc: 'Eligible to apply for guild lead positions. Annual election, quarterly $ROAD allocation pool, steward candidacy pathway.',
  },
  {
    icon: '⬡',
    label: 'Treasury Visibility Reports',
    desc: 'Monthly Squads multisig balance report and DAO proposal digest. See where the treasury moves and why.',
  },
  {
    icon: '★',
    label: 'Brand Partnership Introductions',
    desc: 'Access to the RoadHouse sponsorship network. Partner-tier members are first in line for brand deal introductions.',
  },
  {
    icon: '→',
    label: 'Investor Update Access',
    desc: 'Quarterly Praetorian Holdings investor update — financials, milestones, and roadmap changes.',
  },
  {
    icon: '◇',
    label: 'Group Calls — Max 8 Seats',
    desc: 'Monthly video call with Dalton and other Partner-tier members. Max 8 seats. Direct access, no intermediaries.',
  },
  {
    icon: '$',
    label: '2,000 $ROAD / Month',
    desc: 'Highest accrual rate of the subscription tiers. Compounds toward the 10,000 $ROAD Steward threshold.',
  },
]

const GUILDS = [
  {
    name: 'Media Guild',
    domain: 'Content, streaming, VOD, social',
    kpi: 'Monthly Reach',
    channel: '#media-guild',
  },
  {
    name: 'Builder Guild',
    domain: 'Platform, tokenomics, on-chain infra',
    kpi: 'Uptime & DAU',
    channel: '#builder-guild',
  },
  {
    name: 'Frontier Guild',
    domain: 'Events, compound, merch',
    kpi: 'Event Revenue',
    channel: '#frontier-guild',
  },
  {
    name: 'Venture Guild',
    domain: 'Treasury, investments, grants',
    kpi: 'Portfolio IRR',
    channel: '#venture-guild',
  },
]

const STEWARD_STATS = [
  { label: 'Threshold',             value: '10,000 $ROAD',                                        note: 'invite-only' },
  { label: 'Subscription accrual', value: '2,000 $ROAD / month',                                 note: 'Partner tier baseline' },
  { label: 'Minimum timeline',      value: '5 months',                                            note: 'subscription only — bounties accelerate' },
  { label: 'Unlocks',              value: 'Multisig co-signer · Proposal rights · Compound access', note: '' },
]

// ── Types ─────────────────────────────────────────────────────────────────────

type BookingState = 'idle' | 'loading' | 'success' | 'error'

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PartnersPage() {
  const [name,         setName]         = useState('')
  const [email,        setEmail]        = useState('')
  const [bookingState, setBookingState] = useState<BookingState>('idle')
  const [bookingError, setBookingError] = useState('')

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingState('loading')
    setBookingError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:    'Partner — 1-on-1 Request',
          name:    name || 'Partner Member',
          email,
          message: '1-on-1 call request submitted from the /partners page.',
          _hp:     '',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong.')
      setBookingState('success')
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : 'Something went wrong.')
      setBookingState('error')
    }
  }

  return (
    <main className="min-h-screen bg-rh-black text-rh-text">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="border-b border-rh-border px-6 py-5 flex items-center justify-between sticky top-0 z-40 bg-rh-black/95 backdrop-blur-sm">
        <a href="/" className="text-[11px] tracking-widest uppercase text-rh-muted hover:text-gold transition-colors">
          ← RoadHouse
        </a>
        <div className="flex items-center gap-3">
          <NetworkIndicator />
          <WalletButton />
        </div>
      </header>

      {/* ── Gated content ─────────────────────────────────────────────────── */}
      <TokenGate
        requiredTier="ranchHand"
        href="/#membership"
        lockedMessage="This page is for Ranch Hand and above. Subscribe at roadhouse.capital to access partner resources."
      >
        <div className="px-6 lg:px-16">

          {/* ── Hero ────────────────────────────────────────────────────────── */}
          <section className="py-20 max-w-3xl">
            <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Partner Tier</div>
            <h1
              className="text-5xl lg:text-7xl font-light italic mb-5"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              You're building <span className="text-gold">this.</span>
            </h1>
            <p className="text-rh-muted text-sm leading-relaxed max-w-xl tracking-wide">
              Partner-tier members have treasury visibility, guild leadership candidacy, and direct access to the founding team.
              Here's what that means.
            </p>
            <div className="gold-line mt-8 max-w-xs" />
          </section>

          {/* ── Benefits ────────────────────────────────────────────────────── */}
          <section className="py-16 border-t border-rh-border">
            <div className="mb-8">
              <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">What You Have</div>
              <h2
                className="text-4xl lg:text-5xl font-light italic"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Your <span className="text-gold">Benefits</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PARTNER_BENEFITS.map(b => (
                <div key={b.label} className="bg-rh-card border border-rh-border rounded-lg p-6 card-glow">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-gold text-xl mt-0.5 shrink-0">{b.icon}</span>
                    <h3
                      className="text-lg font-light italic text-rh-text"
                      style={{ fontFamily: 'var(--font-cormorant)' }}
                    >
                      {b.label}
                    </h3>
                  </div>
                  <p className="text-[11px] text-rh-muted leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Guild Leadership ────────────────────────────────────────────── */}
          <section className="py-16 border-t border-rh-border">
            <div className="mb-8">
              <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Governance</div>
              <h2
                className="text-4xl lg:text-5xl font-light italic"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Lead a <span className="text-gold">Guild</span>
              </h2>
              <p className="text-rh-muted text-sm mt-3 max-w-2xl tracking-wide leading-relaxed">
                Guild leads are elected annually from the Partner tier and above. They manage the guild's quarterly $ROAD allocation pool,
                verify member contributions, publish bounties, and report KPIs to the community treasury each quarter.
                Guild leads become multisig co-signers (Squads 3-of-5) when they reach Steward tier.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {GUILDS.map(g => (
                <div key={g.name} className="bg-rh-card border border-rh-border rounded-lg p-5 card-glow">
                  <h3
                    className="text-lg font-light italic text-rh-text mb-1"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    {g.name}
                  </h3>
                  <div className="text-[10px] text-rh-faint mb-3">{g.domain}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] tracking-wider text-gold-dark">KPI: {g.kpi}</div>
                    <div className="text-[9px] text-rh-faint font-mono">{g.channel}</div>
                  </div>
                </div>
              ))}
            </div>
            <a
              href="mailto:roadhousesyndicate@gmail.com?subject=Partner%20%E2%80%94%20Guild%20Leadership%20Application"
              className="inline-block px-5 py-2.5 stripe-btn text-rh-black text-[10px] tracking-widest uppercase font-medium rounded transition-all hover:opacity-90"
            >
              Apply for Guild Leadership →
            </a>
          </section>

          {/* ── Treasury Visibility ─────────────────────────────────────────── */}
          <section className="py-16 border-t border-rh-border">
            <div className="mb-8">
              <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Governance Infrastructure</div>
              <h2
                className="text-4xl lg:text-5xl font-light italic"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Treasury
              </h2>
              <p className="text-rh-muted text-sm mt-3 max-w-xl tracking-wide leading-relaxed">
                Squads multisig 3-of-5 on Solana. Snapshot + Aragon for governance votes. Partner tier gives you visibility.
                Steward tier gives you a seat at the table.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
              <div className="bg-rh-card border border-rh-border rounded-lg p-6 card-glow">
                <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint mb-4">Partner Tier — What You Can See</div>
                <ul className="space-y-2">
                  {[
                    'Monthly Squads multisig balance report',
                    'DAO proposal digest — active votes and outcomes',
                    'Guild KPI summaries (quarterly)',
                    'Treasury deployment history',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-[11px] text-rh-muted">
                      <span className="text-gold/40 mt-0.5">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-rh-card border border-gold/20 rounded-lg p-6 card-glow">
                <div className="text-[9px] tracking-[0.3em] uppercase text-gold-dark mb-4">Steward Tier — What You Unlock</div>
                <ul className="space-y-2 mb-4">
                  {[
                    'Multisig co-signer status (Squads 3-of-5)',
                    'Governance proposal submission rights',
                    'Full treasury transaction history',
                    'Compound working visit access',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-[11px] text-rh-muted">
                      <span className="text-gold/40 mt-0.5">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-rh-faint tracking-wider">
                  Requires $ROAD ≥ 10,000 · Invite-only
                </p>
              </div>
            </div>
          </section>

          {/* ── 1-on-1 ──────────────────────────────────────────────────────── */}
          <section className="py-16 border-t border-rh-border">
            <div className="max-w-lg">
              <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Direct Access</div>
              <h2
                className="text-4xl lg:text-5xl font-light italic mb-4"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Book time with <span className="text-gold">Dalton</span>
              </h2>
              <p className="text-rh-muted text-sm leading-relaxed tracking-wide mb-6">
                Partner-tier members have direct access. Use it.
              </p>

              {bookingState === 'success' ? (
                <div className="bg-rh-card border border-gold/20 rounded-lg p-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-gold/40 bg-gold/10 flex items-center justify-center shrink-0">
                    <Check size={18} className="text-gold" />
                  </div>
                  <div>
                    <div
                      className="text-lg font-light italic text-gold"
                      style={{ fontFamily: 'var(--font-cormorant)' }}
                    >
                      Request received.
                    </div>
                    <p className="text-[11px] text-rh-muted">Dalton will be in touch directly.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBooking} className="bg-rh-card border border-rh-border rounded-lg p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase text-rh-faint mb-2">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-rh-surface border border-rh-border rounded px-4 py-3 text-[12px] text-rh-text placeholder-rh-faint focus:outline-none focus:border-gold/40 transition-colors tracking-wider"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase text-rh-faint mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-rh-surface border border-rh-border rounded px-4 py-3 text-[12px] text-rh-text placeholder-rh-faint focus:outline-none focus:border-gold/40 transition-colors tracking-wider"
                    />
                  </div>
                  {bookingState === 'error' && (
                    <div className="flex items-start gap-2 text-red-400 text-[11px]">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={bookingState === 'loading'}
                    className="w-full py-3 stripe-btn text-rh-black text-[10px] tracking-widest uppercase font-medium rounded transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bookingState === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Sending…
                      </span>
                    ) : (
                      'Book a Call →'
                    )}
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* ── Path to Steward ─────────────────────────────────────────────── */}
          <section className="py-16 border-t border-rh-border">
            <div className="max-w-2xl">
              <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">What's Next</div>
              <h2
                className="text-4xl lg:text-5xl font-light italic mb-5"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                The Path to <span className="text-gold">Steward</span>
              </h2>
              <p className="text-rh-muted text-sm leading-relaxed tracking-wide mb-6">
                Steward tier is invite-only. The threshold is 10,000 $ROAD — earned through verified guild contributions, not purchased.
                At Partner tier you accrue 2,000 $ROAD per month from subscriptions alone. Bounty contributions accelerate the timeline.
              </p>
              <div className="space-y-0 mb-6 border border-rh-border rounded-lg overflow-hidden">
                {STEWARD_STATS.map((row, i) => (
                  <div
                    key={row.label}
                    className={`flex items-start justify-between gap-4 px-5 py-3.5 ${
                      i < STEWARD_STATS.length - 1 ? 'border-b border-rh-border/50' : ''
                    } hover:bg-rh-elevated/30 transition-colors`}
                  >
                    <div className="text-[10px] tracking-wider uppercase text-rh-faint shrink-0">{row.label}</div>
                    <div className="text-right">
                      <div className="text-[12px] text-rh-text">{row.value}</div>
                      {row.note && <div className="text-[9px] text-rh-faint mt-0.5">{row.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
              <p
                className="text-[13px] text-rh-faint leading-relaxed italic"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Steward is earned, not bought. The $ROAD you accumulate is a record of contribution — and the key to the compound.
              </p>
            </div>
          </section>

          {/* ── Closing ─────────────────────────────────────────────────────── */}
          <section className="py-16 border-t border-rh-border">
            <div className="gold-line mb-6 max-w-xs" />
            <div
              className="text-2xl lg:text-3xl font-light italic text-rh-text max-w-xl"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              You're part of something being built from the ground up.
            </div>
          </section>

        </div>
      </TokenGate>

      {/* Footer */}
      <footer className="border-t border-rh-border px-6 lg:px-16 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-[10px] text-rh-faint tracking-wider">
            © 2026 Praetorian Holdings Corp. · Saskatchewan, Canada
          </div>
          <a href="/" className="text-[10px] text-rh-muted hover:text-gold transition-colors tracking-wider">
            ← Back to RoadHouse
          </a>
        </div>
      </footer>

    </main>
  )
}
