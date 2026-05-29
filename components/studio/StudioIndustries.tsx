'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { sectionEntrance, scrambleOnEnter } from '@/lib/studio/animations'

const INDUSTRIES = [
  { name: 'AUTOMOTIVE',   code: 'AUT', count: '01', desc: 'Dealer platforms, inventory sync, lead pipelines' },
  { name: 'AGRICULTURE',  code: 'AGR', count: '02', desc: 'Equipment management, land ops, cooperative tools' },
  { name: 'TRADES',       code: 'TRD', count: '03', desc: 'Service quoting, crew management, client portals' },
  { name: 'HOSPITALITY',  code: 'HSP', count: '04', desc: 'Booking infrastructure, event ops, brand systems' },
  { name: 'RETAIL',       code: 'RTL', count: '05', desc: 'Inventory, loyalty, and conversion infrastructure' },
  { name: 'PROFESSIONAL', code: 'PRO', count: '06', desc: 'Practice sites, client intake, and authority brand' },
]

export default function StudioIndustries() {
  const [hovered, setHovered] = useState<number | null>(null)
  const containerRef          = useRef<HTMLElement>(null)
  const headingRef            = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return

    if (headingRef.current) {
      scrambleOnEnter(headingRef.current, 'THE OPERATORS.')
    }

    const tiles = containerRef.current.querySelectorAll('[data-industry-tile]')
    if (tiles.length) sectionEntrance(tiles)
  }, { scope: containerRef })

  return (
    <section
      ref={containerRef}
      id="house"
      style={{ borderTop: '1px solid #141618', padding: '96px 0' }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Section label */}
        <div style={{ marginBottom: '60px' }}>
          <span style={{
            fontFamily:    'var(--font-dm-mono-studio)',
            fontSize:      '11px',
            color:         '#C8861E',
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
          }}>
            Who we serve
          </span>
          <div
            ref={headingRef}
            style={{
              fontFamily:    'var(--font-bebas)',
              fontSize:      'clamp(40px, 6vw, 72px)',
              color:         '#E8E0D0',
              lineHeight:    0.95,
              letterSpacing: '0.01em',
              marginTop:     '12px',
            }}
          >
            THE OPERATORS.
          </div>
        </div>

        {/* 3×2 grid */}
        <div
          className="studio-industries-grid"
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            border:              '1px solid #141618',
          }}
        >
          {INDUSTRIES.map((ind, i) => {
            const isHov = hovered === i
            return (
              <div
                key={ind.name}
                data-industry-tile
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  padding:      '40px 36px',
                  borderRight:  (i % 3 < 2) ? `1px solid ${isHov ? '#C8861E' : '#141618'}` : 'none',
                  borderBottom: (i < 3)      ? `1px solid ${isHov ? '#C8861E' : '#141618'}` : 'none',
                  borderTop:    `3px solid ${isHov ? '#C8861E' : 'transparent'}`,
                  transition:   'border-color 0.18s ease, background 0.18s ease',
                  background:   isHov ? '#0C0D0F' : 'transparent',
                  cursor:       'default',
                  position:     'relative' as const,
                }}
              >
                {/* 3-char code — top right, rotates on hover */}
                <div style={{
                  position:      'absolute',
                  top:           '20px',
                  right:         '20px',
                  display:       'flex',
                  alignItems:    'center',
                  gap:           '8px',
                }}>
                  {/* Count badge */}
                  <span style={{
                    fontFamily:    'var(--font-dm-mono-studio)',
                    fontSize:      '8px',
                    color:         isHov ? '#07080A' : 'transparent',
                    background:    isHov ? '#C8861E' : 'transparent',
                    letterSpacing: '0.1em',
                    padding:       '2px 5px',
                    transition:    'color 0.18s ease, background 0.18s ease',
                  }}>
                    {ind.count}
                  </span>
                  <span style={{
                    fontFamily:    'var(--font-dm-mono-studio)',
                    fontSize:      '10px',
                    color:         isHov ? '#C8861E' : '#2A2520',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase' as const,
                    transition:    'color 0.18s ease, transform 0.25s ease',
                    display:       'inline-block',
                    transform:     isHov ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}>
                    {ind.code}
                  </span>
                </div>

                <div style={{
                  fontFamily:    'var(--font-bebas)',
                  fontSize:      '36px',
                  color:         isHov ? '#E8E0D0' : '#4A4540',
                  letterSpacing: '0.04em',
                  lineHeight:    1,
                  marginBottom:  '16px',
                  transition:    'color 0.18s ease',
                }}>
                  {ind.name}
                </div>
                <p style={{
                  fontFamily: 'var(--font-barlow)',
                  fontSize:   '13px',
                  color:      isHov ? '#878070' : '#5A5450',
                  lineHeight: 1.6,
                  margin:     0,
                  fontWeight: 300,
                  transition: 'color 0.18s ease',
                }}>
                  {ind.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .studio-industries-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 560px) {
          .studio-industries-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
