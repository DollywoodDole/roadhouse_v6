'use client'

import { useState } from 'react'
import { Loader2, Check, AlertTriangle } from 'lucide-react'
import NetworkIndicator from '@/components/wallet/NetworkIndicator'
import WalletButton from '@/components/wallet/WalletButton'

// ── Data ──────────────────────────────────────────────────────────────────────

const CORE_FUNCTIONS = [
  {
    icon: '⬡',
    title: 'Living Laboratory',
    desc: 'Applied research on human performance, coordination, and community economics — conducted through documented daily protocols.',
  },
  {
    icon: '▶',
    title: 'Content Production Environment',
    desc: 'Physical space engineered for streaming and long-form content creation. Compound life IS the content.',
  },
  {
    icon: '◆',
    title: 'Community Anchor',
    desc: 'The place Steward and Praetor members have access to — the physical manifestation of membership value.',
  },
  {
    icon: '◈',
    title: 'Event Infrastructure',
    desc: 'Venue for RoadHouse gatherings, member summits, and public-facing events that generate both revenue and content.',
  },
  {
    icon: '$',
    title: 'Venture Base',
    desc: 'Operations centre for the Venture Guild — deal review, partner meetings, due diligence sessions.',
  },
]

const SASK_ADVANTAGES = [
  {
    label: 'Tax Jurisdiction',
    detail: 'Combined 10–11% effective corporate rate on first $500k active income — structurally lower than every major Canadian province and most US states.',
  },
  {
    label: 'Land Cost',
    detail: 'Rural Saskatchewan land acquisition is a fraction of comparable property in BC, Alberta, or Ontario.',
  },
  {
    label: 'Grant Ecosystem',
    detail: 'SaskInnovates, SaskCulture, Saskatchewan Film Employment Tax Credit, and proximity to University of Saskatchewan Mitacs partnerships.',
  },
  {
    label: 'Narrative',
    detail: 'Saskatchewan independence and frontier identity maps directly to the RoadHouse brand — this is not incidental, it is the story.',
  },
  {
    label: 'Physical Scale',
    detail: 'Physical scale available in rural Saskatchewan is impossible in urban centres — the compound can be built to specification, not constrained to available commercial real estate.',
  },
]

const TIMELINE = [
  {
    phase: 'Current',
    period: '2026',
    status: 'active',
    milestone: 'Mobile operations — annual tour from Saskatoon to West Coast.',
  },
  {
    phase: 'Year 2',
    period: 'Q3–Q4 2026',
    status: 'next',
    milestone: 'Land identified and optioned in rural Saskatchewan.',
  },
  {
    phase: 'Year 3',
    period: '2027–2028',
    status: 'planned',
    milestone: 'Land acquired, initial infrastructure built, first on-site events.',
  },
  {
    phase: 'Year 4–5',
    period: '2028–2030',
    status: 'planned',
    milestone: 'Compound fully operational as hospitality and event venue; permanent residency for Praetor-tier members.',
  },
]

const NODE_TIERS = [
  {
    tier: 'Flagship',
    desc: 'Saskatchewan — founder-owned, fully integrated.',
    licensing: 'Not licensed — owned and operated by Praetorian Holdings Corp.',
  },
  {
    tier: 'Partner Node',
    desc: 'Licensed to aligned operators in other markets.',
    licensing: 'Revenue share + brand licence fee + content integration requirements.',
  },
  {
    tier: 'Pop-up Node',
    desc: 'Temporary activations (tour stops, events).',
    licensing: 'Event-by-event agreement; no ongoing licence.',
  },
]

const RESEARCH_DOMAINS = [
  {
    domain: 'Human Performance',
    protocol: '30-day physical training + sleep + nutrition tracking',
    question: 'What does a structured environment do to measurable performance markers?',
  },
  {
    domain: 'Community Economics',
    protocol: 'Guild contribution tracking + $ROAD accrual + tier advancement',
    question: 'What reward structures produce sustained community labour?',
  },
  {
    domain: 'Digital Coordination',
    protocol: 'DAO governance participation + proposal submission rates + voting behaviour',
    question: 'How do distributed communities make decisions?',
  },
  {
    domain: 'Creative Output',
    protocol: 'Content volume + audience engagement + member-generated content ratios',
    question: 'What environmental and incentive structures maximise creative output?',
  },
]

const ACCESS_TIERS = [
  { tier: 'Guest',      access: 'No access',                                                highlight: false, unlock: false },
  { tier: 'Regular',   access: 'No access',                                                highlight: false, unlock: false },
  { tier: 'Ranch Hand',access: 'Public events only',                                       highlight: false, unlock: false },
  { tier: 'Partner',   access: 'Public events + partner-tier gatherings',                  highlight: false, unlock: false },
  { tier: 'Steward',   access: 'Full access during events + working visits by arrangement',highlight: true,  unlock: true  },
  { tier: 'Praetor',   access: 'Permanent compound residency privileges',                  highlight: true,  unlock: false },
]

const statusStyle: Record<string, string> = {
  active:  'text-green-400 border-green-400/30 bg-green-400/5',
  next:    'text-gold border-gold/30 bg-gold/5',
  planned: 'text-rh-muted border-rh-border',
}
const statusLabel: Record<string, string> = {
  active:  '● Now',
  next:    '→ Next',
  planned: '◇ Planned',
}

// ── Form types ────────────────────────────────────────────────────────────────

type FormState = 'idle' | 'loading' | 'success' | 'error'

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CompoundPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '', _hp: '' })
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Compound — Waitlist Interest',
          name: form.name,
          email: form.email,
          message: form.message || 'Compound interest registration.',
          _hp: form._hp,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong.')
      setFormState('success')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
      setFormState('error')
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

      <div className="px-6 lg:px-16">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="py-20 max-w-4xl">
          <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">
            DeSci Living Laboratory — Year 2 Physical Infrastructure
          </div>
          <h1
            className="text-5xl lg:text-7xl font-light italic mb-5"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Saskatchewan <span className="text-gold">Compound</span>
          </h1>
          <p className="text-rh-muted text-sm leading-relaxed max-w-2xl tracking-wide mb-8">
            RoadHouse is a physical research community that runs applied experiments in human performance, economics, and technology.
            The compound is the laboratory. The guild economy is the coordination experiment. The community members are the participants.
            The data generated is the research output.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="#register"
              onClick={e => {
                e.preventDefault()
                document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-5 py-2.5 stripe-btn text-rh-black text-[10px] tracking-widest uppercase font-medium rounded w-fit"
            >
              Register Interest →
            </a>
            <a
              href="#research"
              onClick={e => {
                e.preventDefault()
                document.getElementById('research')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-5 py-2.5 border border-rh-border text-rh-muted text-[10px] tracking-widest uppercase rounded hover:border-gold/40 hover:text-gold transition-colors w-fit"
            >
              Read the Thesis
            </a>
          </div>
          <div className="gold-line mt-8 max-w-xs" />
        </section>

        {/* ── The Generator ─────────────────────────────────────────────────── */}
        <section className="py-16 border-t border-rh-border">
          <div className="mb-8">
            <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">What the Compound Is</div>
            <h2
              className="text-4xl lg:text-5xl font-light italic"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              The <span className="text-gold">Generator</span>
            </h2>
            <p className="text-rh-muted text-sm mt-3 max-w-2xl tracking-wide leading-relaxed">
              Not a retreat. Not a coworking space. Not an event venue alone. A permanently operational physical node — a live-in,
              work-in environment designed so that natural human activity (working, training, creating, socialising) simultaneously
              produces business value through content, community, and coordinated output.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CORE_FUNCTIONS.map(fn => (
              <div key={fn.title} className="bg-rh-card border border-rh-border rounded-lg p-6 card-glow">
                <div className="text-gold text-2xl mb-3">{fn.icon}</div>
                <h3
                  className="text-lg font-light italic text-rh-text mb-2"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  {fn.title}
                </h3>
                <p className="text-[11px] text-rh-muted leading-relaxed">{fn.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Why Saskatchewan ──────────────────────────────────────────────── */}
        <section className="py-16 border-t border-rh-border">
          <div className="mb-8">
            <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Flagship Node</div>
            <h2
              className="text-4xl lg:text-5xl font-light italic"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Why <span className="text-gold">Saskatchewan</span>
            </h2>
            <p className="text-rh-muted text-sm mt-3 max-w-xl tracking-wide">
              This is not a compromise — it is a structural advantage.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SASK_ADVANTAGES.map(adv => (
              <div key={adv.label} className="bg-rh-card border border-rh-border rounded-lg p-6 card-glow">
                <div className="text-[10px] tracking-widest uppercase text-gold mb-3">{adv.label}</div>
                <p className="text-[12px] text-rh-muted leading-relaxed">{adv.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Timeline ──────────────────────────────────────────────────────── */}
        <section className="py-16 border-t border-rh-border">
          <div className="mb-8">
            <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Flagship Node Timeline</div>
            <h2
              className="text-4xl lg:text-5xl font-light italic"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              The <span className="text-gold">Build</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIMELINE.map(t => (
              <div
                key={t.phase}
                className={`bg-rh-card border rounded-lg p-6 card-glow ${
                  t.status === 'active' ? 'border-green-400/20' : 'border-rh-border'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="text-2xl font-light text-rh-faint"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    {t.phase}
                  </div>
                  <span className={`px-2 py-0.5 text-[8px] tracking-widest uppercase border rounded ${statusStyle[t.status]}`}>
                    {statusLabel[t.status]}
                  </span>
                </div>
                <div className="text-[10px] text-gold-dark mb-2 tracking-wider">{t.period}</div>
                <p className="text-[11px] text-rh-muted leading-relaxed">{t.milestone}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Mobile-First Bridge ───────────────────────────────────────────── */}
        <section className="py-16 border-t border-rh-border">
          <div className="max-w-2xl">
            <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Until the Compound Exists</div>
            <h2
              className="text-4xl lg:text-5xl font-light italic mb-5"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              The <span className="text-gold">Mobile-First Bridge</span>
            </h2>
            <p className="text-rh-muted text-sm leading-relaxed tracking-wide mb-4">
              The tour runs from Saskatoon to the West Coast. Each stop is a temporary node activation.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                'Content production on location',
                'Community member meetups and activations',
                'Sponsor and partner activations',
                'Guild contribution events (Frontier Guild operational lead)',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-[11px] text-rh-muted">
                  <span className="text-gold/40 mt-0.5">·</span>
                  {item}
                </li>
              ))}
            </ul>
            <p
              className="text-[13px] text-rh-faint leading-relaxed tracking-wide italic"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              The tour generates the content, the community proof, and the revenue that funds the permanent compound build.
              It is not a compromise for the interim — it is the content strategy.
            </p>
          </div>
        </section>

        {/* ── Node Scaling Model ────────────────────────────────────────────── */}
        <section className="py-16 border-t border-rh-border">
          <div className="mb-8">
            <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Long-Term Architecture</div>
            <h2
              className="text-4xl lg:text-5xl font-light italic"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Node <span className="text-gold">Scaling Model</span>
            </h2>
            <p className="text-rh-muted text-sm mt-3 max-w-xl tracking-wide">
              The flagship Saskatchewan compound is Node 1. The long-term architecture is a distributed network of licensed RoadHouse nodes — each operating under the RoadHouse model.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {NODE_TIERS.map(node => (
              <div key={node.tier} className="bg-rh-card border border-rh-border rounded-lg p-6 card-glow">
                <div className="text-[9px] tracking-[0.3em] uppercase text-gold-dark mb-3">{node.tier}</div>
                <p className="text-[12px] text-rh-text mb-4 leading-relaxed">{node.desc}</p>
                <div className="gold-line mb-3" />
                <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint mb-2">Licensing</div>
                <p className="text-[11px] text-rh-muted leading-relaxed">{node.licensing}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── DeSci Research ────────────────────────────────────────────────── */}
        <section id="research" className="py-16 border-t border-rh-border">
          <div className="mb-8">
            <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">DeSci Living Laboratory</div>
            <h2
              className="text-4xl lg:text-5xl font-light italic"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Active Research <span className="text-gold">Domains</span>
            </h2>
            <p className="text-rh-muted text-sm mt-3 max-w-xl tracking-wide">
              Every compound protocol is documented. Every protocol generates data. The data is the research.
            </p>
          </div>

          <div className="bg-rh-card border border-rh-border rounded-lg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] min-w-[500px]">
                <thead>
                  <tr className="border-b border-rh-border">
                    <th className="text-left px-5 py-3 text-[9px] tracking-[0.3em] uppercase text-rh-faint font-normal">Domain</th>
                    <th className="text-left px-5 py-3 text-[9px] tracking-[0.3em] uppercase text-rh-faint font-normal hidden md:table-cell">Protocol</th>
                    <th className="text-left px-5 py-3 text-[9px] tracking-[0.3em] uppercase text-rh-faint font-normal">Research Question</th>
                  </tr>
                </thead>
                <tbody>
                  {RESEARCH_DOMAINS.map(r => (
                    <tr key={r.domain} className="border-b border-rh-border/50 hover:bg-rh-elevated/30 transition-colors">
                      <td className="px-5 py-3 text-gold-dark font-medium whitespace-nowrap">{r.domain}</td>
                      <td className="px-5 py-3 text-rh-faint hidden md:table-cell">{r.protocol}</td>
                      <td className="px-5 py-3 text-rh-muted leading-relaxed">{r.question}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DeSci Protocol Sprint */}
          <div className="bg-rh-card border border-gold/20 rounded-lg p-6">
            <div className="text-[9px] tracking-[0.3em] uppercase text-gold mb-3">DeSci Protocol Sprint — 30 Days</div>
            <p className="text-[12px] text-rh-muted leading-relaxed mb-5">
              A structured 30-day participation programme — members commit to a defined protocol (training, contribution, governance participation) and log their participation daily.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint mb-3">Why It Matters</div>
                <ul className="space-y-2">
                  {[
                    'One of four Founding NFT qualification conditions — no purchase required',
                    'Creates a cohort of deeply invested members before the credential is earned',
                    'Primary Mitacs research data point — measurable, documentable, publishable',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-[11px] text-rh-muted">
                      <span className="text-gold/40 mt-0.5">·</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint mb-3">NFT Qualification</div>
                <p className="text-[11px] text-rh-muted leading-relaxed">
                  Completing a full DeSci protocol sprint is one of the four pathways to the Founding NFT credential.
                  It does not require a purchase — it requires 30 days of documented commitment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Access by Tier ────────────────────────────────────────────────── */}
        <section className="py-16 border-t border-rh-border">
          <div className="mb-8">
            <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Membership Access</div>
            <h2
              className="text-4xl lg:text-5xl font-light italic"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Compound Access <span className="text-gold">by Tier</span>
            </h2>
            <p className="text-rh-muted text-sm mt-3 max-w-xl tracking-wide">
              Access earned through contribution, not purchased. Steward tier is the unlock.
            </p>
          </div>

          <div className="bg-rh-card border border-rh-border rounded-lg overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-rh-border">
                  <th className="text-left px-5 py-3 text-[9px] tracking-[0.3em] uppercase text-rh-faint font-normal">Tier</th>
                  <th className="text-left px-5 py-3 text-[9px] tracking-[0.3em] uppercase text-rh-faint font-normal">Compound Access</th>
                </tr>
              </thead>
              <tbody>
                {ACCESS_TIERS.map(t => (
                  <tr
                    key={t.tier}
                    className={`border-b border-rh-border/50 transition-colors ${
                      t.highlight ? 'bg-gold/5' : 'hover:bg-rh-elevated/30'
                    }`}
                  >
                    <td className={`px-5 py-3 ${t.highlight ? 'text-gold font-medium' : 'text-rh-muted'}`}>
                      <span>{t.tier}</span>
                      {t.unlock && (
                        <span className="ml-2 text-[8px] tracking-widest uppercase text-green-400 border border-green-400/30 px-1.5 py-0.5 rounded">
                          Unlock
                        </span>
                      )}
                    </td>
                    <td className={`px-5 py-3 leading-relaxed ${t.highlight ? 'text-rh-text' : 'text-rh-faint'}`}>
                      {t.access}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[10px] text-rh-faint tracking-wider max-w-xl leading-relaxed">
            The 10,000 $ROAD threshold for Steward tier represents demonstrated contribution — access to the infrastructure your labour helped build.
          </p>
        </section>

        {/* ── Interest Registration ─────────────────────────────────────────── */}
        <section id="register" className="py-16 border-t border-rh-border">
          <div className="mb-8">
            <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Pre-Compound</div>
            <h2
              className="text-4xl lg:text-5xl font-light italic"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Register <span className="text-gold">Interest</span>
            </h2>
            <p className="text-rh-muted text-sm mt-3 max-w-xl tracking-wide leading-relaxed">
              Physical access for Steward and Praetor tier members. Register now to be notified when compound operations begin.
            </p>
          </div>

          <div className="max-w-lg">
            {formState === 'success' ? (
              <div className="bg-rh-card border border-gold/20 rounded-lg p-8 flex flex-col items-center gap-4 text-center">
                <div className="w-12 h-12 rounded-full border border-gold/40 bg-gold/10 flex items-center justify-center">
                  <Check size={20} className="text-gold" />
                </div>
                <div>
                  <div
                    className="text-xl font-light italic text-gold mb-1"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    Registered.
                  </div>
                  <p className="text-[12px] text-rh-muted">
                    You'll hear from us when the compound is ready.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-rh-card border border-rh-border rounded-lg p-6 space-y-4">
                {/* Honeypot — hidden from real users */}
                <input
                  type="text"
                  name="_hp"
                  value={form._hp}
                  onChange={e => setForm(f => ({ ...f, _hp: e.target.value }))}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                <div>
                  <label className="block text-[10px] tracking-widest uppercase text-rh-faint mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full bg-rh-surface border border-rh-border rounded px-4 py-3 text-[12px] text-rh-text placeholder-rh-faint focus:outline-none focus:border-gold/40 transition-colors tracking-wider"
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-widests uppercase text-rh-faint mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full bg-rh-surface border border-rh-border rounded px-4 py-3 text-[12px] text-rh-text placeholder-rh-faint focus:outline-none focus:border-gold/40 transition-colors tracking-wider"
                  />
                </div>

                <div>
                  <label className="block text-[10px] tracking-widests uppercase text-rh-faint mb-2">
                    Message{' '}
                    <span className="text-rh-faint normal-case tracking-normal">(optional)</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Your current tier, which guild you're interested in, or anything else relevant."
                    rows={4}
                    className="w-full bg-rh-surface border border-rh-border rounded px-4 py-3 text-[12px] text-rh-text placeholder-rh-faint focus:outline-none focus:border-gold/40 transition-colors tracking-wider resize-none"
                  />
                </div>

                {formState === 'error' && (
                  <div className="flex items-start gap-2 text-red-400 text-[11px]">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formState === 'loading'}
                  className="w-full py-3 stripe-btn text-rh-black text-[10px] tracking-widest uppercase font-medium rounded transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formState === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Sending…
                    </span>
                  ) : (
                    'Register Interest →'
                  )}
                </button>
              </form>
            )}
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-rh-border px-6 lg:px-16 py-10 mt-4">
        <div className="gold-line mb-6 max-w-xs" />
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
