'use client'

import { useState } from 'react'

type ActiveView = 'client' | 'house'

interface Service {
  label: string
  word:  string
  desc:  string
  tiers: string[]
}

const CLIENT_SERVICES: Service[] = [
  {
    label: 'Web',
    word:  'Build',
    desc:  'Custom platforms, dealer systems, and member infrastructure. Built to own, not to rent.',
    tiers: ['Foundation  $1.5–2.5K', 'Growth      $3.5–6.5K', 'Enterprise  $8–25K+'],
  },
  {
    label: 'Brand',
    word:  'Mark',
    desc:  'Identity systems, visual language, and positioning for operators who need to hold ground.',
    tiers: ['Identity', 'Social', 'Video', 'Copy'],
  },
  {
    label: 'Growth',
    word:  'Move',
    desc:  'Acquisition, retention, and conversion infrastructure. Organic-first, paid-ready.',
    tiers: ['Local SEO', 'Technical Audit', 'Paid Creative'],
  },
]

const HOUSE_SERVICES: Service[] = [
  {
    label: 'Broadcast',
    word:  'Signal',
    desc:  'Live streaming infrastructure, multi-platform distribution, and studio production pipeline.',
    tiers: [],
  },
  {
    label: 'Content',
    word:  'Produce',
    desc:  'Long-form video, short-form clips, and documentary-grade storytelling for the ecosystem.',
    tiers: [],
  },
  {
    label: 'Vault',
    word:  'IP',
    desc:  'Owned intellectual property — formats, brands, and content assets that compound over time.',
    tiers: [],
  },
]

export default function StudioServices({ activeView }: { activeView: ActiveView }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const services              = activeView === 'client' ? CLIENT_SERVICES : HOUSE_SERVICES
  const isClient              = activeView === 'client'

  return (
    <>
      <style>{`
        .studio-services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid #141618;
        }
        @media (max-width: 768px) {
          .studio-services-grid { grid-template-columns: 1fr !important; }
          .studio-services-grid > div { border-right: none !important; }
        }
      `}</style>
      <div className="studio-services-grid">
        {services.map((s, i) => {
          const isHov = hovered === i
          return (
            <div
              key={s.word}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding:       '40px 32px',
                borderRight:   i < 2 ? `1px solid ${isHov ? '#C8861E' : '#141618'}` : 'none',
                borderBottom:  `1px solid ${isHov ? '#C8861E' : '#141618'}`,
                transition:    'border-color 0.15s ease',
                cursor:        'default',
                display:       'flex',
                flexDirection: 'column' as const,
                position:      'relative' as const,
                // Subtle amber radial gradient top-left on hover
                background: isHov
                  ? 'radial-gradient(circle at 0% 0%, rgba(200,134,30,0.05) 0%, transparent 60%)'
                  : 'transparent',
              }}
            >
              {/* Number + label row */}
              <div style={{
                display:       'flex',
                alignItems:    'flex-end',
                justifyContent:'space-between',
                marginBottom:  '16px',
              }}>
                <span style={{
                  fontFamily:    'var(--font-dm-mono-studio)',
                  fontSize:      '10px',
                  color:         isHov ? '#C8861E' : '#5A5450',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase' as const,
                  transition:    'color 0.15s ease',
                }}>
                  {s.label}
                </span>
              </div>

              {/* Word + animated amber underline */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  fontFamily:    'var(--font-bebas)',
                  fontSize:      '56px',
                  color:         isHov ? '#E8E0D0' : '#878070',
                  lineHeight:    1,
                  letterSpacing: '0.02em',
                  transition:    'color 0.15s ease',
                }}>
                  {s.word.toUpperCase()}
                </div>
                {/* Animated underline */}
                <div style={{
                  height:          '1.5px',
                  background:      '#C8861E',
                  transform:       isHov ? 'scaleX(1)' : 'scaleX(0)',
                  transformOrigin: 'left center',
                  transition:      'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  marginTop:       '4px',
                }} />
              </div>

              <p style={{
                fontFamily: 'var(--font-barlow)',
                fontSize:   '14px',
                color:      '#878070',
                lineHeight: 1.75,
                margin:     '0 0 20px',
                fontWeight: 300,
                flex:       1,
              }}>
                {s.desc}
              </p>

              {/* Tier detail — client view, staggered reveal on hover */}
              {isClient && s.tiers.length > 0 && (
                <ul style={{
                  listStyle:  'none',
                  padding:    0,
                  margin:     0,
                  borderTop:  '1px solid #1A1C1F',
                  paddingTop: '16px',
                }}>
                  {s.tiers.map((tier) => (
                    <li
                      key={tier}
                      style={{
                        fontFamily:    'var(--font-dm-mono-studio)',
                        fontSize:      '9px',
                        color:         '#878070',
                        letterSpacing: '0.1em',
                        lineHeight:    2,
                        whiteSpace:    'pre' as const,
                      }}
                    >
                      {tier}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
