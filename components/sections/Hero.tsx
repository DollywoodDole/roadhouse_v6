'use client'

import { useEffect, useState } from 'react'

export default function Hero() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <section
      id="home"
      style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '6rem 4rem', overflow: 'hidden' }}
    >
      {/* Hero image background */}
      <img
        src="/rh-hero.jpg"
        alt=""
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', zIndex: 0 }}
      />

      {/* Overlays — darken edges for text legibility, preserve logo */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,8,6,0.35)', zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 35%, rgba(10,8,6,0.75) 100%)', zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,8,6,0.4) 0%, transparent 30%, transparent 60%, rgba(10,8,6,0.6) 100%)', zIndex: 1 }} />

      {/* All content sits above video */}
      <div style={{ position: 'relative', zIndex: 2 }}>

        {/* Est. tag */}
        <div
          className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ transitionDelay: '100ms' }}
        >
          <div className="text-[11px] tracking-[0.4em] uppercase text-gold mb-8 font-mono">
            Est. Saskatchewan, Canada · Praetorian Holdings Corp.
          </div>
        </div>

        {/* Tagline */}
        <div
          className={`max-w-2xl mb-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ transitionDelay: '350ms' }}
        >
          <p className="text-rh-muted text-base leading-relaxed tracking-wide" style={{ fontFamily: 'var(--font-dm-mono)' }}>
            A creator-owned ecosystem at the crossroads of technology, synthesis, and culture.
            Converting streaming attention into community capital and investable IP.{' '}
            <span className="text-gold-pale italic">Discretion isn't a rule — it's a reflex.</span>
          </p>
        </div>

        {/* CTA Buttons */}
        <div
          className={`flex flex-wrap gap-4 mb-16 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ transitionDelay: '450ms' }}
        >
          <a
            href="https://kick.com/dollywooddole"
            target="_blank"
            rel="noopener noreferrer"
            className="stripe-btn inline-flex items-center gap-2 px-6 py-3 text-rh-black text-sm tracking-widest uppercase font-medium rounded"
          >
            <span className="live-dot" />
            Watch Live on Kick
          </a>
          <button
            onClick={() => document.getElementById('membership')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm tracking-widest uppercase font-medium rounded border border-gold/40 text-gold hover:bg-gold/10 transition-colors"
          >
            ★ Join the Community
          </button>
          <a
            href="https://x.com/dollywooddole"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm tracking-widest uppercase font-medium rounded border border-rh-border text-rh-muted hover:text-rh-text hover:border-rh-text/30 transition-colors"
          >
            𝕏 Follow on X
          </a>
        </div>

        {/* Dashboard CTA */}
        <div
          className={`mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ transitionDelay: '500ms' }}
        >
          <a
            href="/dashboard"
            className="text-[13px] tracking-widest text-rh-muted hover:text-gold transition-colors"
            style={{ fontFamily: 'var(--font-dm-mono)' }}
          >
            Already a member? Enter Dashboard →
          </a>
        </div>

        {/* Stats row */}
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ transitionDelay: '550ms' }}
        >
          {[
            { value: 'Y1', label: 'Phase Active' },
            { value: '$149k', label: 'Revenue Target' },
            { value: '10.5%', label: 'Eff. Tax Rate (SK)' },
            { value: '$300k+', label: 'Grant Potential' },
          ].map(stat => (
            <div key={stat.label} className="border-l border-gold/30 pl-4">
              <div
                className="text-2xl lg:text-3xl font-light text-gold"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                {stat.value}
              </div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-rh-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

      </div>

      {/* Scroll indicator */}
      <div style={{ position: 'absolute', bottom: '2rem', left: '4rem', zIndex: 2 }} className="flex items-center gap-3 text-rh-faint text-[10px] tracking-widest uppercase">
        <div className="w-8 h-px bg-rh-border" />
        Scroll to explore
      </div>
    </section>
  )
}
