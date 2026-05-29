'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

type ActiveView = 'client' | 'house'

const STATS = [
  { value: '112',     label: 'Live vehicles' },
  { value: 'ADF/XML', label: 'DMS export' },
  { value: 'MULTI',   label: 'Dealer architecture' },
  { value: 'JSON-LD', label: 'Schema stack' },
]


export default function MotorsCaseStudy({ activeView }: { activeView: ActiveView }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const leftRef    = useRef<HTMLDivElement>(null)
  const rightRef   = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!sectionRef.current || !leftRef.current || !rightRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    const trigger = {
      trigger: sectionRef.current,
      start:   'top 82%',
      end:     'top 28%',
      scrub:   1.2,
    }

    gsap.fromTo(leftRef.current,
      { x: -40, opacity: 0 },
      { x: 0,   opacity: 1, ease: 'power2.out', scrollTrigger: trigger }
    )
    gsap.fromTo(rightRef.current,
      { x: 40,  opacity: 0 },
      { x: 0,   opacity: 1, ease: 'power2.out', scrollTrigger: trigger }
    )
  }, { scope: sectionRef })

  if (activeView !== 'client') return null

  return (
    <div
      ref={sectionRef}
      style={{
        padding:   '80px 0',
        borderTop: '1px solid #141618',
        overflow:  'hidden',
      }}
    >
      <style>{`
        .motors-cs-layout {
          display: flex;
          gap: 48px;
          align-items: flex-start;
        }
        .motors-cs-left  { flex: 0 0 58%; min-width: 260px; }
        .motors-cs-right { flex: 1; min-width: 260px; }
        .motors-cs-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          border: 1px solid #1A1C1F;
          margin-bottom: 36px;
        }
        @media (max-width: 768px) {
          .motors-cs-layout    { flex-direction: column !important; }
          .motors-cs-left      { flex: none !important; width: 100% !important; }
          .motors-cs-right     { flex: none !important; width: 100% !important; }
          .motors-cs-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <div className="motors-cs-layout">

        {/* Left — label, heading, stats, description, CTA */}
        <div className="motors-cs-left" ref={leftRef}>
          <p style={{
            fontFamily:    'var(--font-dm-mono-studio)',
            fontSize:      '10px',
            color:         '#878070',
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            margin:        '0 0 10px',
          }}>
            Dealer Platform · O&apos;Brian&apos;s Auto · Saskatchewan
          </p>

          <div style={{
            fontFamily:    'var(--font-bebas)',
            fontSize:      '72px',
            color:         '#C8861E',
            letterSpacing: '0.03em',
            lineHeight:    0.95,
            marginBottom:  '4px',
          }}>
            MOTORS
          </div>

          <h3 style={{
            fontFamily:    'var(--font-bebas)',
            fontSize:      '24px',
            color:         '#E8E0D0',
            letterSpacing: '0.04em',
            lineHeight:    1,
            margin:        '0 0 32px',
            fontWeight:    400,
          }}>
            RoadHouse Motors
          </h3>

          {/* 2×2 Stats */}
          <div className="motors-cs-stats-grid">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  padding:      '20px 24px',
                  borderRight:  i % 2 === 0 ? '1px solid #1A1C1F' : 'none',
                  borderBottom: i < 2       ? '1px solid #1A1C1F' : 'none',
                }}
              >
                <div style={{
                  fontFamily:    'var(--font-bebas)',
                  fontSize:      '36px',
                  color:         '#C8861E',
                  letterSpacing: '0.03em',
                  lineHeight:    1,
                  marginBottom:  '4px',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontFamily:    'var(--font-dm-mono-studio)',
                  fontSize:      '9px',
                  color:         '#878070',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <p style={{
            fontFamily: 'var(--font-barlow)',
            fontSize:   '14px',
            color:      '#878070',
            lineHeight: 1.75,
            margin:     '0 0 32px',
            fontWeight: 300,
            maxWidth:   '460px',
          }}>
            Full-stack dealer platform — live inventory sync, ADF/XML DMS integration,
            automated daily cron, lead pipeline with KV storage, and a complete JSON-LD
            schema stack. Subdomain-isolated. No manual updates required.
          </p>

          <a
            href="https://motors.roadhouse.capital"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily:     'var(--font-dm-mono-studio)',
              fontSize:       '11px',
              color:          '#C8861E',
              letterSpacing:  '0.12em',
              textTransform:  'uppercase' as const,
              textDecoration: 'none',
              border:         '1px solid #C8861E',
              padding:        '10px 22px',
              display:        'inline-block',
              transition:     'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.background = '#C8861E'
              el.style.color      = '#07080A'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.background = 'transparent'
              el.style.color      = '#C8861E'
            }}
          >
            View live ↗
          </a>
        </div>

        {/* Right — simulated browser frame */}
        <div className="motors-cs-right" ref={rightRef}>
          <div style={{
            width:         '100%',
            height:        '420px',
            background:    '#0A0B0D',
            border:        '1px solid #1E2024',
            overflow:      'hidden',
            display:       'flex',
            flexDirection: 'column' as const,
          }}>
            {/* Browser chrome bar */}
            <div style={{
              padding:      '10px 14px',
              background:   '#111316',
              borderBottom: '1px solid #1E2024',
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              flexShrink:   0,
            }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: '#2A2A28' }} />
                ))}
              </div>
              <div style={{
                flex:            1,
                background:      '#1A1C1F',
                borderRadius:    4,
                padding:         '3px 10px',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'space-between',
              }}>
                <span style={{
                  fontFamily:    'var(--font-dm-mono-studio)',
                  fontSize:      9,
                  color:         '#3A3A38',
                  letterSpacing: '0.06em',
                }}>
                  motors.roadhouse.capital
                </span>
                <span style={{
                  width:        6,
                  height:       6,
                  borderRadius: '50%',
                  background:   '#4CAF50',
                  display:      'inline-block',
                }} />
              </div>
            </div>

            {/* Simulated motors nav */}
            <div style={{
              padding:        '8px 14px',
              background:     '#0D0E10',
              borderBottom:   '1px solid #141618',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              flexShrink:     0,
            }}>
              <span style={{
                fontFamily:    'var(--font-bebas)',
                fontSize:      13,
                color:         '#C8861E',
                letterSpacing: '0.1em',
              }}>
                ROADHOUSE MOTORS
              </span>
              <div style={{ display: 'flex', gap: 12 }}>
                {['INVENTORY', 'CREDIT', 'TEAM'].map((l) => (
                  <span key={l} style={{
                    fontFamily:    'var(--font-dm-mono-studio)',
                    fontSize:      8,
                    color:         '#3A3A38',
                    letterSpacing: '0.08em',
                  }}>
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {/* Feature image */}
            <div style={{
              flex:      1,
              overflow:  'hidden',
              position:  'relative' as const,
              minHeight: 0,
            }}>
              <img
                src="/motors/rh_motors_lambo.png"
                alt="RoadHouse Motors — Saskatchewan dealer platform"
                style={{
                  width:          '100%',
                  height:         '100%',
                  objectFit:      'cover' as const,
                  objectPosition: 'center 30%',
                  display:        'block',
                }}
              />
              <div style={{
                position:      'absolute' as const,
                inset:         0,
                background:    'linear-gradient(to top, rgba(7,8,10,0.75) 0%, transparent 55%)',
                pointerEvents: 'none',
              }} />
            </div>

            {/* Bottom status bar */}
            <div style={{
              padding:        '6px 14px',
              background:     '#0A0B0D',
              borderTop:      '1px solid #141618',
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              flexShrink:     0,
            }}>
              <span style={{
                fontFamily: 'var(--font-dm-mono-studio)',
                fontSize:   8,
                color:      '#3A3A38',
              }}>
                112 vehicles in stock
              </span>
              <span style={{
                fontFamily: 'var(--font-dm-mono-studio)',
                fontSize:   8,
                color:      '#4CAF50',
              }}>
                ● LIVE
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
