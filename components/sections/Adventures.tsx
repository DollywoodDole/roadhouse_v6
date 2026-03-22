'use client'

import { siteConfig } from '@/lib/site-config'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { Loader2, ExternalLink, Lock, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'

async function buyAdventure(priceId: string, adventure: string) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, metadata: { type: 'adventure', adventure } }),
  })

  let data: { url?: string; error?: string }
  try {
    data = await res.json()
  } catch {
    throw new Error('Invalid response from checkout API')
  }

  if (data.url) {
    window.location.href = data.url
  } else {
    throw new Error(data.error ?? 'No checkout URL returned')
  }
}

export default function Adventures() {
  const { ref, isVisible } = useScrollReveal()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reserve = async (id: string, priceId: string, adventure: string) => {
    setLoading(id)
    setError(null)
    try {
      await buyAdventure(priceId, adventure)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Checkout failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const lake           = siteConfig.stripe.adventures.lake
  const ski            = siteConfig.stripe.adventures.ski
  const med            = siteConfig.stripe.adventures.med
  const skiVoteResolved = siteConfig.features.skiVoteResolved

  return (
    <section id="adventures" className="px-8 lg:px-16 py-20">
      <motion.div
        ref={ref as React.RefObject<HTMLDivElement>}
        initial={{ opacity: 0, y: 24 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="mb-10">
          <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">
            Frontier Guild — Real Experiences · On-Chain Credentials
          </div>
          <h2
            className="text-5xl lg:text-7xl font-light italic"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Adventures
          </h2>
          <p className="text-rh-muted text-sm mt-3 max-w-xl tracking-wide">
            Three real trips. Scarce by design. Each one mints an on-chain credential at attendance — a permanent record of being there.
          </p>
          <div className="gold-line mt-4 max-w-xs" />
        </div>

        {/* Checkout error banner */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-xs tracking-wide">
            {error}
          </div>
        )}

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 001 — Lake Trip */}
          <div className="relative bg-rh-card border border-rh-border rounded-lg p-6 card-ambient flex flex-col">
            <span
              className="absolute top-4 left-4 text-6xl font-light text-rh-faint select-none pointer-events-none"
              style={{ fontFamily: 'var(--font-cormorant)', lineHeight: 1 }}
              aria-hidden
            >
              001
            </span>
            <div className="flex items-start justify-between mb-8 pl-16">
              <div />
              <span className="px-2 py-0.5 text-[9px] tracking-widest uppercase border rounded text-green-400 border-green-400/30 bg-green-400/5">
                Deposits Open
              </span>
            </div>
            <div className="flex-1">
              <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-1">BC / AB · Summer 2026</div>
              <h3
                className="text-2xl font-light italic text-rh-text mb-2"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Lake Trip
              </h3>
              <div className="text-xl font-light text-gold mb-0.5" style={{ fontFamily: 'var(--font-cormorant)' }}>
                $199 CAD deposit
              </div>
              <div className="text-[10px] text-rh-faint mb-3">Est. $500–$1,500 total · Party of up to 5</div>
              <p className="text-[11px] text-rh-muted leading-relaxed mb-3">
                The first RoadHouse field trip. Lakes, mountains, and the community in person for the first time. Group size capped — first in, first confirmed.
              </p>
              <div className="text-[10px] text-rh-faint tracking-wider">All tiers welcome</div>
            </div>
            <div className="mt-5">
              {lake ? (
                <button
                  onClick={() => reserve('lake', lake, 'lake-trip')}
                  disabled={loading === 'lake'}
                  className="stripe-btn w-full py-2.5 text-rh-black text-[10px] tracking-widest uppercase font-medium rounded flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {loading === 'lake' ? <Loader2 size={12} className="animate-spin" /> : 'Reserve Your Spot'}
                </button>
              ) : (
                <a
                  href={`mailto:${siteConfig.contactEmail}?subject=Lake%20Trip%20%E2%80%94%20Notify%20Me`}
                  className="block w-full py-2.5 text-center text-[10px] tracking-widest uppercase border border-gold/30 text-gold hover:bg-gold/5 rounded transition-colors"
                >
                  Get Notified
                </a>
              )}
            </div>
          </div>

          {/* 002 — Ski Trip */}
          <div className="relative bg-rh-card border border-rh-border rounded-lg p-6 card-ambient flex flex-col">
            <span
              className="absolute top-4 left-4 text-6xl font-light text-rh-faint select-none pointer-events-none"
              style={{ fontFamily: 'var(--font-cormorant)', lineHeight: 1 }}
              aria-hidden
            >
              002
            </span>
            <div className="flex items-start justify-between mb-8 pl-16">
              <div />
              {skiVoteResolved ? (
                <span className="px-2 py-0.5 text-[9px] tracking-widest uppercase border rounded text-green-400 border-green-400/30 bg-green-400/5">
                  Deposits Open
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[9px] tracking-widest uppercase border rounded text-gold border-gold/30 bg-gold/5">
                  Community Vote Open
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-1">Panorama or Whitefish · Winter 2026/27</div>
              <h3
                className="text-2xl font-light italic text-rh-text mb-2"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Ski Trip
              </h3>
              <div className="text-xl font-light text-gold mb-0.5" style={{ fontFamily: 'var(--font-cormorant)' }}>
                $299 CAD deposit
              </div>
              <div className="text-[10px] text-rh-faint mb-3">Est. $1,000–$2,500 total · Party of up to 4</div>
              {skiVoteResolved ? (
                <p className="text-[11px] text-rh-muted leading-relaxed mb-3">
                  Location locked by community vote. Secure your deposit to claim your spot.
                </p>
              ) : (
                <p className="text-[11px] text-rh-muted leading-relaxed mb-3">
                  Location decided by $ROAD holders. Vote open on Snapshot. Deposits open after the vote closes.
                </p>
              )}
              <div className="flex items-center gap-1.5 text-[10px] text-rh-faint tracking-wider">
                {skiVoteResolved && <CheckCircle2 size={10} className="text-green-400" />}
                <span>All tiers welcome</span>
              </div>
            </div>
            <div className="mt-5">
              {skiVoteResolved && ski ? (
                <button
                  onClick={() => reserve('ski', ski, 'ski-trip')}
                  disabled={loading === 'ski'}
                  className="stripe-btn w-full py-2.5 text-rh-black text-[10px] tracking-widest uppercase font-medium rounded flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {loading === 'ski' ? <Loader2 size={12} className="animate-spin" /> : 'Reserve Your Spot'}
                </button>
              ) : (
                <a
                  href="https://snapshot.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 text-[10px] tracking-widest uppercase border border-gold/30 text-gold hover:bg-gold/5 rounded transition-colors"
                >
                  Vote on Location <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>

          {/* 003 — Mediterranean */}
          <div className="relative bg-rh-card border border-rh-border rounded-lg p-6 card-ambient flex flex-col">
            <span
              className="absolute top-4 left-4 text-6xl font-light text-rh-faint select-none pointer-events-none"
              style={{ fontFamily: 'var(--font-cormorant)', lineHeight: 1 }}
              aria-hidden
            >
              003
            </span>
            <div className="flex items-start justify-between mb-8 pl-16">
              <div />
              <span className="px-2 py-0.5 text-[9px] tracking-widest uppercase border rounded text-rh-muted border-rh-border">
                Waitlist · Ranch Hand+
              </span>
            </div>
            <div className="flex-1">
              <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-1">Summer 2027 · ~25 Spots</div>
              <h3
                className="text-2xl font-light italic text-rh-text mb-2"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Mediterranean
              </h3>
              <div className="text-xl font-light text-gold mb-0.5" style={{ fontFamily: 'var(--font-cormorant)' }}>
                $1,000 CAD hold
              </div>
              <div className="text-[10px] text-rh-faint mb-3">Est. $3,000–$6,000 total · You + one guest</div>
              <p className="text-[11px] text-rh-muted leading-relaxed mb-3">
                The flagship. Scarce by design. 25 spots maximum. Ranch Hand tier or above required to hold a spot.
                $500 of the hold is non-refundable within 14 days of the event.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-rh-faint tracking-wider">
                <Lock size={10} />
                <span>Ranch Hand+ required</span>
              </div>
            </div>
            <div className="mt-5">
              {med ? (
                <button
                  onClick={() => reserve('med', med, 'mediterranean')}
                  disabled={loading === 'med'}
                  className="stripe-btn w-full py-2.5 text-rh-black text-[10px] tracking-widest uppercase font-medium rounded flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {loading === 'med' ? <Loader2 size={12} className="animate-spin" /> : 'Secure Your Hold'}
                </button>
              ) : (
                <a
                  href={`mailto:${siteConfig.contactEmail}?subject=Mediterranean%20%E2%80%94%20Waitlist`}
                  className="block w-full py-2.5 text-center text-[10px] tracking-widest uppercase border border-rh-border text-rh-muted hover:border-gold/30 hover:text-gold rounded transition-colors"
                >
                  Join the Waitlist
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Philosophy */}
        <p
          className="mt-12 max-w-2xl mx-auto text-center font-light italic text-rh-muted text-lg leading-relaxed"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Adventures are real experiences with real people. Each one mints an on-chain credential at attendance — a permanent record of being there. Spots are scarce because that&apos;s the point.
        </p>
      </motion.div>
    </section>
  )
}
