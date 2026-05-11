'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Loader2, Shield, Check, ExternalLink, AlertTriangle, Lock, Coins, BarChart3, Zap } from 'lucide-react'
import { ConnectButton } from '@/components/wallet'
import { siteConfig } from '@/lib/site-config'
import { NETWORK, TIER_THRESHOLDS, TIER_LABELS, TierKey } from '@/lib/solana'
import { useRoadToken, formatRoadBalance } from '@/lib/road-token'

// ── $ROAD Tokenomics ──────────────────────────────────────────────────────────
const ALLOCATIONS = [
  { label: 'Community', pct: 25, amount: '25M', color: '#C9922A', desc: 'Earned via participation, events, referrals, content' },
  { label: 'Creators',  pct: 22, amount: '22M', color: '#F0C060', desc: 'Merit-based release tied to verified contributions' },
  { label: 'Treasury',  pct: 25, amount: '25M', color: '#8B6318', desc: 'DAO-controlled, deployed via governance vote' },
  { label: 'Founder',   pct: 18, amount: '18M', color: '#6B4E1A', desc: '4-year linear vest, 1-year cliff' },
  { label: 'Partners',  pct: 10, amount: '10M', color: '#4A3512', desc: 'Strategic partners, advisors, grant bodies' },
]

const TIER_DATA: { key: TierKey; icon: string; access: string[] }[] = [
  { key: 'guest',     icon: '◎', access: ['Public content', 'Read-only Discord'] },
  { key: 'regular',   icon: '◇', access: ['Community chat', 'Minor proposal voting', 'Newsletter'] },
  { key: 'ranchHand', icon: '◆', access: ['Guild participation', 'Revenue-share eligibility', 'Exclusive VOD archive'] },
  { key: 'partner',   icon: '⬡', access: ['Guild leadership candidacy', 'Treasury visibility', 'Investor memo access'] },
  { key: 'steward',   icon: '★', access: ['Multisig treasury co-signer', 'Governance proposals', 'Compound event access'] },
  { key: 'praetor',   icon: '⚜', access: ['Board advisory role', 'Venture deal flow', 'IP licensing review', 'Permanent compound residency'] },
]

function DonutChart() {
  const size = 160, r = 60, cx = size / 2, cy = size / 2
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
      {slices.map(s => (
        <circle key={s.label} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="20"
          strokeDasharray={`${s.dash - 2} ${s.gap + 2}`} strokeDashoffset={0}
          transform={`rotate(${s.rotate} ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      ))}
    </svg>
  )
}

// ── Guild data ────────────────────────────────────────────────────────────────
const GUILDS = [
  {
    icon: '📡', name: 'Media Guild', tag: 'Content Creation', kpi: 'Monthly Reach',
    status: 'Recruiting', statusColor: 'text-green-400 border-green-400/30',
    desc: 'The front-facing engine of the RoadHouse. Responsible for all streaming, short-form video, VOD clipping, social distribution, and international translation of content.',
    items: ['Live streaming on Kick — long-form, unfiltered', 'Short-form content on TikTok (@roadhousesyndicate)', 'VOD clipping and highlight distribution', 'Multilingual content translation', 'Social media management across platforms'],
  },
  {
    icon: '⚙️', name: 'Builder Guild', tag: 'Technology & Dashboards', kpi: 'Uptime & DAU',
    status: 'Forming', statusColor: 'text-gold border-gold/30',
    desc: 'The technical backbone. Builders develop and maintain the community platform, tokenomics tooling, streaming analytics, and on-chain infrastructure.',
    items: ['Community dashboard development', '$ROAD token smart contract deployment', 'AI-assisted content moderation systems', 'Streaming analytics platform', 'On-chain analytics (Year 2)'],
  },
  {
    icon: '🏕️', name: 'Frontier Guild', tag: 'Events & Compound', kpi: 'Event Revenue',
    status: 'Planning', statusColor: 'text-rh-muted border-rh-border',
    desc: "Anchored in Saskatchewan's physical landscape. Manages real-world infrastructure — compound operations, event production, merchandise logistics, and physical community space.",
    items: ['Saskatchewan compound site acquisition (Year 2)', 'Physical events and festival appearances', 'Merchandise production and fulfillment', 'Community compound infrastructure', 'In-person member meetups'],
  },
  {
    icon: '📈', name: 'Venture Guild', tag: 'Treasury & Investments', kpi: 'Portfolio IRR',
    status: 'Seeding', statusColor: 'text-rh-muted border-rh-border',
    desc: 'The capital arm. Deploys DAO treasury via governance-approved proposals, sources deals, performs due diligence, and manages the portfolio.',
    items: ['Treasury deployment via DAO governance votes', 'Deal sourcing and due diligence', 'Portfolio company management', 'Grant co-application coordination', 'Investor relations and LP reporting'],
  },
]

// ── Founding NFT config ───────────────────────────────────────────────────────
const MINT_CONFIG = { supply: 500, priceSOL: 3, priceDisplay: '3 SOL' }

const FOUNDING_BENEFITS = [
  { icon: '★', text: 'Steward-tier access for 12 months' },
  { icon: '◆', text: 'Undisclosed $ROAD allocation at mainnet launch' },
  { icon: '⬡', text: 'VIP access to first three RoadHouse events' },
  { icon: '◇', text: 'Exclusive Founding Member Discord role' },
  { icon: '⚜', text: 'Name in permanent founding member register' },
  { icon: '→', text: 'Soul-bound: non-transferable for 12 months' },
]

type MintState = 'idle' | 'confirming' | 'minting' | 'success' | 'error'

// ── Main component ────────────────────────────────────────────────────────────
export default function EcosystemDAO() {
  const { publicKey, connected, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const { balance, tier, tierLabel, loading } = useRoadToken()

  const [mintState, setMintState] = useState<MintState>('idle')
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const nftReady = Boolean(siteConfig.solana.nft.founding)

  const explorerUrl = siteConfig.solana.roadMint
    ? `https://explorer.solana.com/address/${siteConfig.solana.roadMint}${NETWORK === 'devnet' ? '?cluster=devnet' : ''}`
    : null

  const txExplorerUrl = txSignature
    ? `https://explorer.solana.com/tx/${txSignature}${NETWORK === 'devnet' ? '?cluster=devnet' : ''}`
    : null

  const handleMint = async () => {
    if (!publicKey || !connected) return
    setMintState('confirming')
    setErrorMsg(null)
    try {
      const treasuryAddress = siteConfig.solana.treasuryWallet
      if (!treasuryAddress) throw new Error('Treasury wallet not configured.')
      const bal = await connection.getBalance(publicKey)
      if (bal < MINT_CONFIG.priceSOL * LAMPORTS_PER_SOL + 10_000)
        throw new Error(`Insufficient SOL. Need ${MINT_CONFIG.priceSOL} SOL + fees. Balance: ${(bal / LAMPORTS_PER_SOL).toFixed(4)} SOL`)
      setMintState('minting')
      const tx = new Transaction().add(SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(treasuryAddress),
        lamports: MINT_CONFIG.priceSOL * LAMPORTS_PER_SOL,
      }))
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      tx.recentBlockhash = blockhash
      tx.feePayer = publicKey
      const signature = await sendTransaction(tx, connection)
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')
      setTxSignature(signature)
      setMintState('success')
    } catch (err: unknown) {
      console.error('[FoundingMint] error:', err)
      const message = err instanceof Error ? err.message : 'Mint failed. Please try again.'
      if (message.includes('User rejected') || message.includes('user rejected')) { setMintState('idle'); return }
      setErrorMsg(message)
      setMintState('error')
    }
  }

  const reset = () => { setMintState('idle'); setErrorMsg(null); setTxSignature(null) }

  return (
    <section id="guilds" className="px-8 lg:px-16 py-20">

      {/* ── Section header ── */}
      <div className="mb-14">
        <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">
          DAO Architecture · $ROAD Token · Founding NFT
        </div>
        <h2 className="text-5xl lg:text-7xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
          The On-Chain <span className="text-gold">Ecosystem.</span>
        </h2>
        <p className="text-rh-muted text-sm mt-3 max-w-2xl tracking-wide leading-relaxed">
          $ROAD governs access and contributor rewards. Four guilds operate the ecosystem.
          500 Founding NFTs anchor the first generation of members permanently on-chain.
        </p>
        <div className="gold-line mt-4 max-w-xs" />
      </div>

      {/* ════════════════════════════════════
          BLOCK 1 — $ROAD TOKEN
      ════════════════════════════════════ */}
      <div id="token" className="scroll-mt-8 mb-16">
        <div className="text-[10px] tracking-[0.3em] uppercase text-rh-faint mb-6">
          $ROAD Token · Solana SPL · Fixed Supply · Utility + Governance
        </div>

        {/* Wallet balance */}
        {connected ? (
          <div className="mb-8 p-5 bg-rh-card border border-gold/20 rounded-lg max-w-lg">
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
        ) : (
          <div className="mb-8 p-5 bg-rh-card border border-rh-border rounded-lg max-w-lg flex items-center gap-4">
            <Coins size={20} className="text-gold shrink-0" />
            <div className="flex-1">
              <div className="text-sm text-rh-text mb-1">Connect to see your $ROAD balance</div>
              <div className="text-[11px] text-rh-muted">View your tier, accrued tokens, and governance weight</div>
            </div>
            <ConnectButton />
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Supply',   value: '100,000,000', sub: '$ROAD — fixed forever',  icon: <Coins size={14} /> },
            { label: 'Decimals',       value: '6',           sub: 'SPL standard precision', icon: <BarChart3 size={14} /> },
            { label: 'Mint Authority', value: 'Revoked',     sub: 'No future inflation',    icon: <Lock size={14} /> },
            { label: 'Network',        value: 'Solana',      sub: NETWORK === 'devnet' ? 'Devnet · testnet' : 'Mainnet-beta', icon: <Zap size={14} /> },
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

        {/* Tokenomics + Tier Ladder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
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

          <div className="p-6 bg-rh-card border border-rh-border rounded-lg">
            <div className="text-[10px] tracking-[0.3em] uppercase text-rh-faint mb-4">Membership Tiers · $ROAD Required</div>
            <div className="space-y-2">
              {TIER_DATA.map(t => {
                const required = TIER_THRESHOLDS[t.key]
                const isCurrentTier = connected && tier === t.key
                const isUnlocked = connected && balance >= required
                return (
                  <div key={t.key} className={`p-3 rounded border transition-all ${
                    isCurrentTier ? 'border-gold/40 bg-gold/5' : isUnlocked ? 'border-rh-border bg-rh-elevated' : 'border-rh-border bg-transparent opacity-60'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm w-5 text-center" style={{ color: isUnlocked || !connected ? '#C9922A' : '#4A4238' }}>{t.icon}</span>
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
                          {t.access.slice(0, 2).join(' · ')}{t.access.length > 2 && ` +${t.access.length - 2} more`}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Utility cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: '◇', title: 'Access Utility', desc: '$ROAD gates community tiers. No financial return is implied or promised. Access is functional — not speculative.' },
            { icon: '◆', title: 'Governance Participation', desc: 'Voting is advisory. Governance scope and founder authority are defined in the RoadHouse governance spec.' },
            { icon: '⬡', title: 'Contributor Rewards', desc: 'Earned for verified contributions: content, events, referrals, development. Not purchased for return.' },
          ].map(item => (
            <div key={item.title} className="p-5 bg-rh-card border border-rh-border rounded-lg">
              <div className="text-gold text-xl mb-3">{item.icon}</div>
              <div className="text-[12px] text-rh-text font-medium mb-2 tracking-wide">{item.title}</div>
              <p className="text-[11px] text-rh-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Explorer + legal */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-rh-border">
          <div className="text-[11px] text-rh-faint max-w-lg leading-relaxed">
            $ROAD is engineered as a pure utility and governance token. No explicit profit expectation
            is created in any marketing, documentation, or community communication. Pre-launch legal opinion
            obtained from qualified Canadian securities counsel.
          </div>
          {explorerUrl && (
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase border border-rh-border text-rh-muted hover:border-gold/40 hover:text-gold rounded transition-colors whitespace-nowrap shrink-0">
              <ExternalLink size={11} />
              View on Explorer
            </a>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════
          BLOCK 2 — GUILD ARCHITECTURE
      ════════════════════════════════════ */}
      <div className="mb-16">
        <div className="text-[10px] tracking-[0.3em] uppercase text-rh-faint mb-6">
          Guild Architecture · Governance via Snapshot &amp; Aragon
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {GUILDS.map(guild => (
            <div key={guild.name} className="bg-rh-card border border-rh-border rounded-lg p-6 card-glow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{guild.icon}</span>
                  <div>
                    <h3 className="text-xl font-light italic text-rh-text" style={{ fontFamily: 'var(--font-cormorant)' }}>
                      {guild.name}
                    </h3>
                    <div className="text-[10px] tracking-wider text-rh-faint">{guild.tag}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[9px] tracking-widest uppercase border rounded ${guild.statusColor}`}>
                  {guild.status}
                </span>
              </div>
              <p className="text-[11px] text-rh-muted leading-relaxed mb-4">{guild.desc}</p>
              <div className="text-[10px] tracking-widest uppercase text-gold-dark mb-3">KPI: {guild.kpi}</div>
              <ul className="space-y-1.5">
                {guild.items.map(item => (
                  <li key={item} className="text-[11px] text-rh-muted flex items-start gap-2">
                    <span className="text-gold/40 mt-0.5">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Governance bar */}
        <div className="p-5 bg-rh-card border border-rh-border rounded-lg flex flex-col md:flex-row items-start gap-6">
          <div className="flex-1">
            <h4 className="text-lg font-light italic text-rh-text mb-2" style={{ fontFamily: 'var(--font-cormorant)' }}>
              Governance Architecture
            </h4>
            <p className="text-[11px] text-rh-muted leading-relaxed">
              Squads 3-of-5 multisig treasury (Solana). Snapshot + Aragon for voting.
              Any Regular+ member can submit a proposal. Voting windows: 5 days.
              Quorum: ≥10% of circulating $ROAD.
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-light text-gold mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>3-of-5</div>
            <div className="text-[10px] tracking-widest uppercase text-rh-faint">Squads Multisig Signers</div>
          </div>
          <a href="#contact"
            onClick={e => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }}
            className="px-5 py-2.5 stripe-btn text-rh-black text-[10px] tracking-widest uppercase font-medium rounded whitespace-nowrap self-start md:self-center">
            Join a Guild →
          </a>
        </div>
      </div>

      {/* ════════════════════════════════════
          BLOCK 3 — FOUNDING NFT
      ════════════════════════════════════ */}
      <div id="mint" className="scroll-mt-8">
        <div className="text-[10px] tracking-[0.3em] uppercase text-rh-faint mb-6">
          Founding NFT · 500 Total · Soul-Bound 12 Months
        </div>

        {NETWORK === 'devnet' && (
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded border border-yellow-600/30 bg-yellow-600/5 text-[10px] text-yellow-500 tracking-wider uppercase">
            <AlertTriangle size={11} />
            Devnet — Test transactions only. No real SOL required.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
          {/* Benefits card */}
          <div className="p-6 bg-rh-card border border-rh-border rounded-lg">
            <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint mb-5">What You Get</div>
            <div className="space-y-3 mb-6">
              {FOUNDING_BENEFITS.map(b => (
                <div key={b.text} className="flex items-start gap-3">
                  <span className="text-gold mt-0.5 w-4 text-center shrink-0">{b.icon}</span>
                  <span className="text-[12px] text-rh-muted leading-relaxed">{b.text}</span>
                </div>
              ))}
            </div>
            <div className="gold-line mb-4" />
            <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint mb-3">Mint Revenue Allocation</div>
            <div className="space-y-1.5">
              {[
                { label: 'Community Treasury', pct: 70, color: 'bg-gold' },
                { label: 'Operations',         pct: 20, color: 'bg-gold-dark' },
                { label: 'Founder Draw',       pct: 10, color: 'bg-gold-muted' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3">
                  <div className="w-20 text-[10px] text-rh-faint">{r.pct}%</div>
                  <div className="flex-1 h-1 bg-rh-border rounded-full overflow-hidden">
                    <div className={`h-full ${r.color} rounded-full`} style={{ width: `${r.pct}%` }} />
                  </div>
                  <div className="text-[10px] text-rh-muted w-28 text-right">{r.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mint card */}
          <div className="p-6 bg-rh-card border border-rh-border rounded-lg flex flex-col">
            <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint mb-4">Mint a Founding NFT</div>
            <div className="flex items-end gap-3 mb-6">
              <div className="text-5xl font-light text-gold" style={{ fontFamily: 'var(--font-cormorant)' }}>
                {MINT_CONFIG.priceDisplay}
              </div>
              <div className="mb-1.5 text-[11px] text-rh-faint">500 total · Soul-bound 12mo</div>
            </div>
            <div className="flex items-center justify-between mb-6 p-3 bg-rh-elevated rounded border border-rh-border">
              <div className="text-[10px] text-rh-faint">Total Supply</div>
              <div className="text-[12px] text-rh-text font-medium">{MINT_CONFIG.supply} NFTs</div>
            </div>

            {!nftReady && mintState === 'idle' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-6 text-center">
                <Shield size={28} className="text-gold/40" />
                <div>
                  <div className="text-[13px] text-rh-text mb-1">Mint opens to Founding Members first.</div>
                  <div className="text-[10px] text-rh-faint leading-relaxed max-w-[200px] mx-auto">500 total · 3 SOL · Soul-bound 12 months</div>
                </div>
                <div className="gold-line w-12" />
                <div className="text-[10px] text-rh-muted leading-relaxed max-w-[220px]">
                  Subscribe now to secure your place in line. Founding NFT mint will be announced to members first.
                </div>
                <button
                  onClick={async () => {
                    const priceId = siteConfig.stripe.subscriptions.regular
                    if (!priceId) { document.getElementById('membership')?.scrollIntoView({ behavior: 'smooth' }); return }
                    const res = await fetch('/api/subscription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ priceId }) })
                    const data = await res.json()
                    if (data.url) window.location.href = data.url
                    else document.getElementById('membership')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="mt-1 px-5 py-2.5 stripe-btn text-rh-black text-[10px] tracking-widest uppercase font-medium rounded transition-all hover:opacity-90"
                >
                  {siteConfig.stripe.subscriptions.regular ? 'Get Early Access — Join as Regular →' : 'Get Early Access →'}
                </button>
              </div>
            )}

            {nftReady && mintState === 'idle' && (
              <div className="flex-1 flex flex-col justify-between">
                {!connected ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="text-[12px] text-rh-muted mb-2">Connect your Phantom wallet to mint</div>
                    <ConnectButton />
                  </div>
                ) : (
                  <>
                    <div className="text-[11px] text-rh-faint mb-6 leading-relaxed">
                      Your wallet: <span className="text-rh-text font-mono">{publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-6)}</span>
                      <br />Ensure you have at least <span className="text-gold">{(MINT_CONFIG.priceSOL + 0.01).toFixed(2)} SOL</span> for mint + fees.
                    </div>
                    <button onClick={handleMint} className="w-full py-3.5 stripe-btn text-rh-black text-[11px] tracking-widest uppercase font-medium rounded transition-all hover:opacity-90">
                      Mint Founding NFT — {MINT_CONFIG.priceDisplay}
                    </button>
                  </>
                )}
              </div>
            )}

            {mintState === 'confirming' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6">
                <Loader2 size={28} className="animate-spin text-gold" />
                <div className="text-[12px] text-rh-muted">Waiting for wallet approval...</div>
                <div className="text-[10px] text-rh-faint">Approve the transaction in Phantom</div>
              </div>
            )}

            {mintState === 'minting' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6">
                <Loader2 size={28} className="animate-spin text-gold" />
                <div className="text-[12px] text-rh-muted">Minting on-chain...</div>
                <div className="text-[10px] text-rh-faint">Confirming on Solana {NETWORK}</div>
              </div>
            )}

            {mintState === 'success' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-6 text-center">
                <div className="w-14 h-14 rounded-full border border-gold/40 bg-gold/10 flex items-center justify-center">
                  <Check size={24} className="text-gold" />
                </div>
                <div>
                  <div className="text-xl font-light italic text-gold mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>Welcome to the RoadHouse.</div>
                  <div className="text-[11px] text-rh-muted">Founding NFT minted successfully.</div>
                </div>
                {txExplorerUrl && (
                  <a href={txExplorerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] text-gold hover:underline">
                    <ExternalLink size={10} />View transaction on Explorer
                  </a>
                )}
                <a href="https://discord.gg/wwhhKcnQJ3" target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 text-[10px] tracking-widest uppercase border border-[#5865F2]/40 text-[#7289DA] hover:bg-[#5865F2]/10 rounded transition-colors">
                  Join the Founding Members Discord →
                </a>
              </div>
            )}

            {mintState === 'error' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-6 text-center">
                <AlertTriangle size={24} className="text-red-400" />
                <div className="text-[12px] text-rh-muted max-w-xs leading-relaxed">{errorMsg}</div>
                <button onClick={reset} className="px-4 py-2 text-[10px] tracking-widest uppercase border border-rh-border text-rh-muted hover:border-gold/40 hover:text-gold rounded transition-colors">
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-[11px] text-rh-faint tracking-wider max-w-2xl leading-relaxed">
          Founding NFTs are soul-bound (non-transferable) for 12 months post-mint to preserve community integrity.
          Standard tier NFTs are freely transferable. 5% royalty on secondary sales accrues to the community treasury.
        </p>
      </div>

    </section>
  )
}
