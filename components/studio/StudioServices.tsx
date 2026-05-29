'use client'

import { useState } from 'react'

type ActiveView = 'client' | 'house'

interface Service {
  num:   string
  label: string
  word:  string
  desc:  string
  tiers: string[]
}

const CLIENT_SERVICES: Service[] = [
  {
    num:   '01',
    label: 'Web',
    word:  'Build',
    desc:  'Custom platforms, dealer systems, and member infrastructure. Built to own, not to rent.',
    tiers: [
      'Foundation  $1.5–2.5K',
      'Growth      $3.5–6.5K',
      'Enterprise  $8–25K+',
    ],
  },
  {
    num:   '02',
    label: 'Brand',
    word:  'Mark',
    desc:  'Identity systems, visual language, and positioning for operators who need to hold ground.',
    tiers: [
      'Identity',
      'Social',
      'Video',
      'Copy',
    ],
  },
  {
    num:   '03',
    label: 'Growth',
    word:  'Move',
    desc:  'Acquisition, retention, and conversion infrastructure. Organic-first, paid-ready.',
    tiers: [
      'Local SEO',
      'Technical Audit',
      'Paid Creative',
    ],
  },
]

const HOUSE_SERVICES: Service[] = [
  {
    num:   '01',
    label: 'Broadcast',
    word:  'Signal',
    desc:  'Live streaming infrastructure, multi-platform distribution, and studio production pipeline.',
    tiers: [],
  },
  {
    num:   '02',
    label: 'Content',
    word:  'Produce',
    desc:  'Long-form video, short-form clips, and documentary-grade storytelling for the ecosystem.',
    tiers: [],
  },
  {
    num:   '03',
    label: 'Vault',
    word:  'IP',
    desc:  'Owned intellectual property — formats, brands, and content assets that compound over time.',
    tiers: [],
  },
]

export default function StudioServices({ activeView }: { activeView: ActiveView }) {
  const [hovered, setHovered]   = useState<number | null>(null)
  const services                = activeView === 'client' ? CLIENT_SERVICES : HOUSE_SERVICES
  const isClient                = activeView === 'client'

  return (
    <>
    <style>{`
      .studio-services-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        border-top: 1px solid #141618;
      }
      @media (max-width: 768px) {
        .studio-services-grid {
          grid-template-columns: 1fr !important;
        }
        .studio-services-grid > div {
          border-right: none !important;
        }
      }
    `}</style>
    <div className="studio-services-grid" style={{ borderTop: '1px solid #141618' }}>
      {services.map((s, i) => {
        const isHov = hovered === i
        return (
          <div
            key={s.word}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding:      '40px 32px',
              borderRight:  i < 2 ? `1px solid ${isHov ? '#C8861E' : '#141618'}` : 'none',
              borderBottom: `1px solid ${isHov ? '#C8861E' : '#141618'}`,
              borderLeft:   `3px solid ${isHov ? '#C8861E' : 'transparent'}`,
              transition:   'border-color 0.18s ease',
              cursor:       'default',
              display:      'flex',
              flexDirection: 'column' as const,
            }}
          >
            <div style={{
              fontFamily:    'var(--font-dm-mono-studio)',
              fontSize:      '10px',
              color:         isHov ? '#C8861E' : '#3A3530',
              letterSpacing: '0.15em',
              textTransform: 'uppercase' as const,
              marginBottom:  '20px',
              transition:    'color 0.18s ease',
            }}>
              {s.num} / {s.label}
            </div>
            <div style={{
              fontFamily:    'var(--font-bebas)',
              fontSize:      '56px',
              color:         isHov ? '#E8E0D0' : '#5A5550',
              lineHeight:    1,
              letterSpacing: '0.02em',
              marginBottom:  '20px',
              transition:    'color 0.18s ease',
            }}>
              {s.word.toUpperCase()}
            </div>
            <p style={{
              fontFamily: 'var(--font-barlow)',
              fontSize:   '14px',
              color:      '#5A5550',
              lineHeight: 1.75,
              margin:     '0 0 20px',
              fontWeight: 300,
              flex:       1,
            }}>
              {s.desc}
            </p>

            {/* Tier detail — client view only, shown on hover */}
            {isClient && (
              <ul style={{
                listStyle:   'none',
                padding:     0,
                margin:      0,
                opacity:     isHov ? 1 : 0,
                transform:   isHov ? 'translateY(0)' : 'translateY(6px)',
                transition:  'opacity 0.2s ease, transform 0.2s ease',
                borderTop:   '1px solid #1A1C1F',
                paddingTop:  '16px',
              }}>
                {s.tiers.map((tier) => (
                  <li
                    key={tier}
                    style={{
                      fontFamily:    'var(--font-dm-mono-studio)',
                      fontSize:      '10px',
                      color:         '#5A5550',
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
