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

// Split a word into individually-animated character spans
function splitToChars(word: string) {
  return word.split('').map((char, i) => (
    <span
      key={i}
      data-char
      style={{ display: 'inline-block' }}
    >
      {char}
    </span>
  ))
}

export default function StudioHero() {
  const [activeView, setActiveView] = useState<ActiveView>('client')
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (containerRef.current) heroEntrance(containerRef.current)
  }, { scope: containerRef })

  return (
    <>
      {/* ── Hero — sticky, persists behind all subsequent content ── */}
      <section
        id="work"
        data-section="hero"
        style={{
          position:  'sticky',
          top:       0,
          height:    '100vh',
          minHeight: '640px',
          zIndex:    0,
        }}
      >
        {/* Layer 0: WebGL canvas */}
        <StudioWebGLDynamic />

        {/* Layer 1: directional gradient veil — text-readable bottom half */}
        <div
          aria-hidden="true"
          style={{
            position:      'absolute',
            inset:         0,
            zIndex:        1,
            pointerEvents: 'none',
            background:    'linear-gradient(160deg, rgba(7,8,10,0.15) 0%, rgba(7,8,10,0.45) 40%, rgba(7,8,10,0.85) 70%, rgba(7,8,10,1.0) 100%)',
          }}
        />

        {/* Layer 2: text content — bottom-anchored above stats strip */}
        <div
          ref={containerRef}
          style={{
            position: 'absolute',
            bottom:   '112px',
            left:     0,
            right:    0,
            zIndex:   10,
          }}
        >
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>

            {/* Label row */}
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              marginBottom:   '20px',
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
                color:         '#878070',
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
              }}>
                System One · Est. 2026
              </span>
            </div>

            {/* Headline — character-level entrance with perspective */}
            <div style={{ perspective: '800px' }}>
              <div
                style={{
                  fontFamily:    'var(--font-bebas)',
                  fontSize:      'clamp(60px, 8vw, 96px)',
                  lineHeight:    0.9,
                  letterSpacing: '0.01em',
                }}
              >
                <div data-hero-line style={{ color: '#E8E0D0' }}>{splitToChars('OPERATORS')}</div>
                <div data-hero-line style={{ color: '#E8E0D0' }}>{splitToChars('BUILD')}</div>
                <div data-hero-line style={{ color: '#C8861E' }}>{splitToChars('DIFFERENT.')}</div>
              </div>
            </div>

            {/* Amber rule */}
            <div
              data-hero-rule
              style={{
                height:          '1.5px',
                background:      '#C8861E',
                margin:          '24px 0 28px',
                transformOrigin: 'left center',
              }}
            />

            {/* Body copy + toggle */}
            <div style={{
              display:        'flex',
              alignItems:     'flex-start',
              justifyContent: 'space-between',
              gap:            '40px',
              flexWrap:       'wrap' as const,
            }}>
              <p style={{
                fontFamily: 'var(--font-barlow)',
                fontSize:   '15px',
                color:      '#878070',
                lineHeight: 1.7,
                maxWidth:   '420px',
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
                        fontFamily:           'var(--font-dm-mono-studio)',
                        fontSize:             '11px',
                        letterSpacing:        '0.12em',
                        textTransform:        'uppercase' as const,
                        padding:              '12px 20px',
                        border:               `1px solid ${active ? '#C8861E' : '#1E2024'}`,
                        borderLeft:           i === 1 ? `1px solid ${active ? '#C8861E' : '#1E2024'}` : undefined,
                        background:           active ? '#C8861E' : 'rgba(14,16,18,0.7)',
                        backdropFilter:       active ? 'none' : 'blur(6px)',
                        WebkitBackdropFilter: active ? 'none' : 'blur(6px)' as string,
                        color:                active ? '#07080A' : '#878070',
                        cursor:               'pointer',
                        transition:           'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                        fontWeight:           active ? 500 : 400,
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Layer 2b: stats strip — full width, absolute bottom */}
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
            position:             'absolute',
            bottom:               0,
            left:                 0,
            right:                0,
            zIndex:               10,
            borderTop:            '1px solid #141618',
            background:           'rgba(7,8,10,0.8)',
            backdropFilter:       'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              data-stat
              style={{
                padding:     '22px 24px',
                borderRight: i < 3 ? '1px solid #141618' : 'none',
              }}
            >
              <div
                data-stat-value
                data-stat-final={stat.value}
                style={{
                  fontFamily:    'var(--font-bebas)',
                  fontSize:      '38px',
                  color:         '#C8861E',
                  letterSpacing: '0.03em',
                  lineHeight:    1,
                  marginBottom:  '4px',
                }}
              >
                {stat.value}
              </div>
              <div style={{
                fontFamily:    'var(--font-dm-mono-studio)',
                fontSize:      '10px',
                color:         '#878070',
                letterSpacing: '0.13em',
                textTransform: 'uppercase' as const,
              }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Below fold: services + case study — scrolls over sticky hero ── */}
      <div style={{ position: 'relative', zIndex: 1, background: '#07080A' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '64px 2rem 0' }}>
          <StudioServices activeView={activeView} />
          <MotorsCaseStudy activeView={activeView} />
        </div>
      </div>
    </>
  )
}
