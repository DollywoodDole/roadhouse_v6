'use client'

import { useState } from 'react'

type ActiveView = 'client' | 'house'

interface Service {
  num: string
  label: string
  word: string
  desc: string
}

const CLIENT_SERVICES: Service[] = [
  {
    num: '01',
    label: 'Web',
    word: 'Build',
    desc: 'Custom platforms, dealer systems, and member infrastructure. Built to own, not to rent.',
  },
  {
    num: '02',
    label: 'Brand',
    word: 'Mark',
    desc: 'Identity systems, visual language, and positioning for operators who need to hold ground.',
  },
  {
    num: '03',
    label: 'Growth',
    word: 'Move',
    desc: 'Acquisition, retention, and conversion infrastructure. Organic-first, paid-ready.',
  },
]

const HOUSE_SERVICES: Service[] = [
  {
    num: '01',
    label: 'Broadcast',
    word: 'Signal',
    desc: 'Live streaming infrastructure, multi-platform distribution, and studio production pipeline.',
  },
  {
    num: '02',
    label: 'Content',
    word: 'Produce',
    desc: 'Long-form video, short-form clips, and documentary-grade storytelling for the ecosystem.',
  },
  {
    num: '03',
    label: 'Vault',
    word: 'IP',
    desc: 'Owned intellectual property — formats, brands, and content assets that compound over time.',
  },
]

export default function StudioServices({ activeView }: { activeView: ActiveView }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const services = activeView === 'client' ? CLIENT_SERVICES : HOUSE_SERVICES

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      borderTop: '1px solid #141618',
    }}>
      {services.map((s, i) => {
        const isHovered = hovered === i
        return (
          <div
            key={s.word}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: '40px 32px',
              borderRight: i < 2 ? `1px solid ${isHovered ? '#C8861E' : '#141618'}` : 'none',
              borderBottom: `1px solid ${isHovered ? '#C8861E' : '#141618'}`,
              borderLeft: `3px solid ${isHovered ? '#C8861E' : 'transparent'}`,
              transition: 'border-color 0.18s ease',
              cursor: 'default',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-dm-mono-studio)',
              fontSize: '10px',
              color: isHovered ? '#C8861E' : '#3A3530',
              letterSpacing: '0.15em',
              textTransform: 'uppercase' as const,
              marginBottom: '20px',
              transition: 'color 0.18s ease',
            }}>
              {s.num} / {s.label}
            </div>
            <div style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '56px',
              color: isHovered ? '#E8E0D0' : '#5A5550',
              lineHeight: 1,
              letterSpacing: '0.02em',
              marginBottom: '20px',
              transition: 'color 0.18s ease',
            }}>
              {s.word.toUpperCase()}
            </div>
            <p style={{
              fontFamily: 'var(--font-barlow)',
              fontSize: '14px',
              color: '#5A5550',
              lineHeight: 1.75,
              margin: 0,
              fontWeight: 300,
            }}>
              {s.desc}
            </p>
          </div>
        )
      })}
    </div>
  )
}
