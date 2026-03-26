'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { Loader2, ExternalLink, Lock, Coins, BarChart3, Users, Zap } from 'lucide-react'
import { useRoadToken, formatRoadBalance } from '@/lib/road-token'
import { TIER_THRESHOLDS, TIER_LABELS, TierKey, NETWORK, ROAD_TOKEN } from '@/lib/solana'
import { ConnectButton } from '@/components/wallet'
import { siteConfig } from '@/lib/site-config'

// ── Tokenomics allocation data ────────────────────────────────────────────────
const ALLOCATIONS = [
  { label: 'Community',  pct: 25, amount: '25M',  color: '#C9922A', desc: 'Earned via participation, events, referrals, content' },
  { label: 'Creators',   pct: 22, amount: '22M',  color: '#F0C060', desc: 'Merit-based release tied to verified contributions' },
  { label: 'Treasury',   pct: 25, amount: '25M',  color: '#8B6318', desc: 'DAO-controlled, deployed via governance vote' },
  { label: 'Founder',    pct: 18, amount: '18M',  color: '#6B4E1A', desc: '4-year linear vest, 1-year cliff' },
  { label: 'Partners',   pct: 10, amount: '10M',  color: '#4A3512', desc: 'Strategic partners, advisors, grant bodies' },
]

// ── Tier ladder data ──────────────────────────────────────────────────────────
const TIER_DATA: { key: TierKey; icon: string; access: string[] }[] = [
  { key: 'guest',     icon: '◎', access: ['Public content', 'Read-only Discord'] },
  { key: 'regular',   icon: '◇', access: ['Community chat', 'Minor proposal voting', 'Newsletter'] },
  { key: 'ranchHand', icon: '◆', access: ['Guild participation', 'Revenue-share eligibility', 'Exclusive VOD archive'] },
  { key: 'partner',   icon: '⬡', access: ['Guild leadership candidacy', 'Treasury visibility', 'Investor memo access'] },
  { key: 'steward',   icon: '★', access: ['Multisig treasury co-signer', 'Governance proposals', 'Compound event access'] },
  { key: 'praetor',   icon: '⚜', access: ['Board advisory role', 'Venture deal flow', 'IP licensing review', 'Permanent compound residency'] },
]

// ── Donut chart (pure SVG, no lib) ────────────────────────────────────────────
function DonutChart() {
  const size = 160
  const r = 60
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r

  let offset = 0
  const slices = ALLOCATIONS.map(a => {
    const dash = (a.pct / 100) * circumference
    const gap = circumference - dash
    const rotate = (offset / 100) * 360
    offset += a.pct
    return { ...a, dash, gap, rotate }
  })

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-40 h-40 -rotate-90">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1A1712" strokeWidth="20" />
      {slices.map((s) => (
        <circle
          key={s.label}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={s.color}
          strokeWidth="20"
          strokeDasharray={`${s.dash - 2} ${s.gap + 2}`}
          strokeDashoffset={0}
          transform={`rotate(${s.rotate} ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      ))}
    </svg>
  )
}

export default function RoadToken() {
  const { connected } = useWallet()
  const { balance, tier, tierLabel, loading } = useRoadToken()

  const explorerUrl = siteConfig.solana.roadMint
    ? `https://explorer.solana.com/address/${siteConfig.solana.roadMint}${NETWORK === 'devnet' ? '?cluster=devnet' : ''}`
    : null

  return (
    <section id="token" className="px-8 lg:px-16 py-20">

      {/* Header */}
      <div className="mb-12">
        <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Solana SPL · Fixed Supply · Utility + Governance</div>
        <h2 className="text-5xl lg:text-7xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
          The <span className="text-gold">$ROAD</span> Token
        </h2>
        <p className="text-rh-muted text-sm mt-3 max-w-xl tracking-wide leading-relaxed">
          $ROAD is the governance and utility instrument of the RoadHouse ecosystem.
          It gates community tiers, powers contributor rewards, and drives treasury governance —
          not a speculative instrument.
        </p>
        <div className="gold-line mt-4 max-w-xs" />
      </div>

      {/* Live wallet balance — shown when connected */}
      {connected && (
        <div className="mb-10 p-5 bg-rh-card border border-gold/20 rounded-lg max-w-lg">
          <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint mb-3">Your $ROAD Balance</div>
          <div className="flex items-end gap-4">
            <div className="text-5xl font-light text-gold" style={{ fontFamily: 'var(--font-cormorant)' }}>
              {loading ? <Loader2 size={36} className="animate-spin text-gold" /> : formatRoadBalance(balance)}
            </div>
            <div className="mb-1.5 text-[11px] text-rh-muted">$ROAD</div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="text-[10px] text-rh-faint">Current Tier:</div>
            <div className="text-[11px] text-gold font-medium">
              {TIER_DATA.find(t => t.key === tier)?.icon} {tierLabel}
            </div>
          </div>
        </div>
      )}

      {!connected && (
        <div className="mb-10 p-5 bg-rh-card border border-rh-border rounded-lg max-w-lg flex items-center gap-4">
          <Coins size={20} className="text-gold shrink-0" />
          <div className="flex-1">
            <div className="text-sm text-rh-text mb-1">Connect to see your $ROAD balance</div>
            <div className="text-[11px] text-rh-muted">View your tier, accrued tokens, and governance weight</div>
          </div>
          <ConnectButton />
        </div>
      )}

      {/* Token stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: 'Total Supply',   value: '100,000,000',    sub: '$ROAD — fixed forever',      icon: <Coins size={14} /> },
          { label: 'Decimals',       value: '6',              sub: 'SPL standard precision',     icon: <BarChart3 size={14} /> },
          { label: 'Mint Authority', value: 'Revoked',        sub: 'No future inflation',        icon: <Lock size={14} /> },
          { label: 'Network',        value: 'Solana',         sub: NETWORK === 'devnet' ? 'Devnet · testnet' : 'Mainnet-beta', icon: <Zap size={14} /> },
        ].map(stat => (
          <div key={stat.label} className="p-4 bg-rh-card border border-rh-border rounded-lg">
            <div className="flex items-center gap-2 text-gold mb-2">
              {stat.icon}
              <span className="text-[9px] tracking-[0.3em] uppercase text-rh-faint">{stat.label}</span>
            </div>
            <div className="text-lg text-rh-text font-medium" style={{ fontFamily: 'var(--font-cormorant)' }}>
              {stat.value}
            </div>
            <div className="text-[10px] text-rh-faint mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Tokenomics + Tier ladder — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

        {/* Tokenomics */}
        <div className="p-6 bg-rh-card border border-rh-border rounded-lg">
          <div className="text-[10px] tracking-[0.3em] uppercase text-rh-faint mb-6">Allocation · 100M Fixed Supply</div>
          <div className="flex items-center gap-8">
            <DonutChart />
            <div className="flex-1 space-y-2">
              {ALLOCATIONS.map(a => (
                <div key={a.label} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                  <div className="flex-1 text-[11px] text-rh-muted">{a.label}</div>
                  <div className="text-[11px] text-rh-text font-medium">{a.pct}%</div>
                  <div className="text-[10px] text-rh-faint w-12 text-right">{a.amount}</div>
                </div>
              ))}
            </div>
          </div>
          {ALLOCATIONS.map(a => (
            <div key={a.label} className="mt-2 flex items-start gap-2">
              <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: a.color }} />
              <div className="text-[10px] text-rh-faint leading-relaxed">
                <span className="text-rh-muted">{a.label}:</span> {a.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Tier Ladder */}
        <div className="p-6 bg-rh-card border border-rh-border rounded-lg">
          <div className="text-[10px] tracking-[0.3em] uppercase text-rh-faint mb-4">Membership Tiers · $ROAD Required</div>
          <div className="space-y-2">
            {TIER_DATA.map((t) => {
              const required = TIER_THRESHOLDS[t.key]
              const isCurrentTier = connected && tier === t.key
              const isUnlocked = connected && balance >= required

              return (
                <div
                  key={t.key}
                  className={`p-3 rounded border transition-all ${
                    isCurrentTier
                      ? 'border-gold/40 bg-gold/5'
                      : isUnlocked
                      ? 'border-rh-border bg-rh-elevated'
                      : 'border-rh-border bg-transparent opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm w-5 text-center" style={{ color: isUnlocked || !connected ? '#C9922A' : '#4A4238' }}>
                      {t.icon}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className={`text-[12px] font-medium ${isCurrentTier ? 'text-gold' : 'text-rh-text'}`}>
                          {TIER_LABELS[t.key]}
                          {isCurrentTier && <span className="ml-2 text-[9px] tracking-widest uppercase text-gold">← You</span>}
                        </div>
                        <div className="text-[10px] text-rh-faint font-mono">
                          {required === 0 ? 'Free' : `${formatRoadBalance(required)} $ROAD`}
                        </div>
                      </div>
                      <div className="text-[10px] text-rh-faint mt-0.5 leading-relaxed">
                        {t.access.slice(0, 2).join(' · ')}
                        {t.access.length > 2 && ` +${t.access.length - 2} more`}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Utility design — securities compliance note */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          {
            icon: '◇',
            title: 'Access Utility',
            desc: '$ROAD gates community tiers. No financial return is implied or promised. Access is functional — not speculative.',
          },
          {
            icon: '◆',
            title: 'Governance Participation',
            desc: 'Weighted voting on community proposals via Snapshot. Advisory scope only — corporate control remains with Praetorian Holdings.',
          },
          {
            icon: '⬡',
            title: 'Contributor Rewards',
            desc: 'Earned for verified contributions: content, events, referrals, development. Not purchased for return.',
          },
        ].map(item => (
          <div key={item.title} className="p-5 bg-rh-card border border-rh-border rounded-lg">
            <div className="text-gold text-xl mb-3">{item.icon}</div>
            <div className="text-[12px] text-rh-text font-medium mb-2 tracking-wide">{item.title}</div>
            <p className="text-[11px] text-rh-muted leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Explorer + Legal */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-rh-border">
        <div className="text-[11px] text-rh-faint max-w-lg leading-relaxed">
          $ROAD is engineered as a pure utility and governance token. No explicit profit expectation
          is created in any marketing, documentation, or community communication. Pre-launch legal opinion
          obtained from qualified Canadian securities counsel.
        </div>
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase border border-rh-border text-rh-muted hover:border-gold/40 hover:text-gold rounded transition-colors whitespace-nowrap shrink-0"
          >
            <ExternalLink size={11} />
            View on Explorer
          </a>
        )}
      </div>
    </section>
  )
}
