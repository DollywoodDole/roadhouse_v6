'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { heroEntrance } from '@/lib/studio/animations'
import { StudioWebGLDynamic } from './webgl'
import StudioServices from './StudioServices'
import MotorsCaseStudy from './MotorsCaseStudy'

type ActiveView = 'client' | 'house'

const STATS = [
  { value: '7–21',  label: 'Days to deliver' },
  { value: 'FIXED', label: 'Price. No surprises.' },
  { value: '100%',  label: 'Yours. Always.' },
  { value: 'LIVE',  label: 'Proof. Motors.' },
]

export default function StudioHero() {
  const [activeView, setActiveView] = useState<ActiveView>('client')
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (containerRef.current) heroEntrance(containerRef.current)
  }, { scope: containerRef })

  return (
    <section
      id="work"
      style={{ position: 'relative', minHeight: '100vh', padding: '80px 0 0' }}
    >
      {/* ── WebGL canvas ── */}
      <StudioWebGLDynamic />

      {/* ── Gradient overlay — keeps text readable ── */}
      <div
        aria-hidden="true"
        style={{
          position:      'absolute',
          inset:         0,
          zIndex:        1,
          background:    'linear-gradient(to bottom, rgba(7,8,10,0.3) 0%, rgba(7,8,10,0.7) 60%, rgba(7,8,10,1) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Content (sits above canvas + overlay) ── */}
      <div
        ref={containerRef}
        style={{
          maxWidth: '1400px',
          margin:   '0 auto',
          padding:  '0 1.5rem',
          position: 'relative',
          zIndex:   2,
        }}
      >
        {/* Label row */}
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          marginBottom:   '28px',
        }}>
          <span style={{
            fontFamily:    'var(--font-dm-mono-studio)',
            fontSize:      '11px',
            color:         '#C8861E',
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
          }}>
            Roadhouse Studio
          </span>
          <span style={{
            fontFamily:    'var(--font-dm-mono-studio)',
            fontSize:      '11px',
            color:         '#3A3530',
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
          }}>
            System One · Est. 2026
          </span>
        </div>

        {/* Giant headline */}
        <div style={{
          fontFamily:    'var(--font-bebas)',
          fontSize:      'clamp(72px, 12vw, 156px)',
          lineHeight:    0.9,
          letterSpacing: '0.01em',
        }}>
          <div data-hero-line style={{ color: '#E8E0D0' }}>OPERATORS</div>
          <div data-hero-line style={{ color: '#E8E0D0' }}>BUILD</div>
          <div data-hero-line style={{ color: '#C8861E' }}>DIFFERENT.</div>
        </div>

        {/* Amber rule */}
        <div
          data-hero-rule
          style={{ height: '1.5px', background: '#C8861E', margin: '36px 0 40px', transformOrigin: 'left center' }}
        />

        {/* Sub-row: body copy + toggle */}
        <div style={{
          display:        'flex',
          alignItems:     'flex-start',
          justifyContent: 'space-between',
          gap:            '40px',
          flexWrap:       'wrap' as const,
          marginBottom:   '48px',
        }}>
          <p style={{
            fontFamily: 'var(--font-barlow)',
            fontSize:   '16px',
            color:      '#5A5550',
            lineHeight: 1.75,
            maxWidth:   '480px',
            margin:     0,
            fontWeight: 300,
          }}>
            RoadHouse Studio builds the infrastructure behind the ecosystem —
            platforms, identities, content, and owned IP.
            Operators only. No tourism.
          </p>

          {/* Toggle */}
          <div style={{ display: 'flex', flexShrink: 0 }}>
            {(['client', 'house'] as ActiveView[]).map((view, i) => {
              const label  = view === 'client' ? 'For Clients' : 'For the House'
              const active = activeView === view
              return (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  style={{
                    fontFamily:    'var(--font-dm-mono-studio)',
                    fontSize:      '11px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    padding:       '11px 22px',
                    border:        `1px solid ${active ? '#C8861E' : '#1E1C18'}`,
                    borderLeft:    i === 1 ? `1px solid ${active ? '#C8861E' : '#1E1C18'}` : undefined,
                    background:    active ? '#C8861E' : 'transparent',
                    color:         active ? '#07080A' : '#4A4540',
                    cursor:        'pointer',
                    transition:    'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                    fontWeight:    active ? 500 : 400,
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Stats strip */}
        <style>{`
          .studio-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); }
          @media (max-width: 640px) {
            .studio-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .studio-stats-grid > div:nth-child(2) { border-right: none !important; }
          }
        `}</style>
        <div
          className="studio-stats-grid"
          style={{
            borderTop:      '1px solid rgba(20,22,24,0.7)',
            borderBottom:   '1px solid rgba(20,22,24,0.7)',
            marginBottom:   '64px',
            backdropFilter: 'blur(8px)',
          }}
        >
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              data-stat
              style={{
                padding:     '28px 24px',
                borderRight: i < 3 ? '1px solid rgba(20,22,24,0.7)' : 'none',
              }}
            >
              <div
                data-stat-value
                data-stat-final={stat.value}
                style={{
                  fontFamily:    'var(--font-bebas)',
                  fontSize:      '42px',
                  color:         '#C8861E',
                  letterSpacing: '0.03em',
                  lineHeight:    1,
                  marginBottom:  '6px',
                }}
              >
                {stat.value}
              </div>
              <div style={{
                fontFamily:    'var(--font-dm-mono-studio)',
                fontSize:      '10px',
                color:         '#3A3530',
                letterSpacing: '0.13em',
                textTransform: 'uppercase' as const,
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Services + case study */}
        <StudioServices activeView={activeView} />
        <MotorsCaseStudy activeView={activeView} />

      </div>
    </section>
  )
}
