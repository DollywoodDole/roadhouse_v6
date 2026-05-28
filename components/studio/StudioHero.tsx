'use client'

import { useState } from 'react'
import StudioServices from './StudioServices'
import MotorsCaseStudy from './MotorsCaseStudy'

type ActiveView = 'client' | 'house'

export default function StudioHero() {
  const [activeView, setActiveView] = useState<ActiveView>('client')

  return (
    <section id="work" style={{ padding: '80px 0 0' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Label row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
        }}>
          <span style={{
            fontFamily: 'var(--font-dm-mono-studio)',
            fontSize: '11px',
            color: '#C8861E',
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
          }}>
            Roadhouse Studio
          </span>
          <span style={{
            fontFamily: 'var(--font-dm-mono-studio)',
            fontSize: '11px',
            color: '#2A2520',
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
          }}>
            System One · Est. 2026
          </span>
        </div>

        {/* Giant headline */}
        <div style={{
          fontFamily: 'var(--font-bebas)',
          fontSize: 'clamp(72px, 12vw, 156px)',
          lineHeight: 0.9,
          letterSpacing: '0.01em',
        }}>
          <div style={{ color: '#E8E0D0' }}>OPERATORS</div>
          <div style={{ color: '#E8E0D0' }}>BUILD</div>
          <div style={{ color: '#C8861E' }}>DIFFERENT.</div>
        </div>

        {/* Amber rule */}
        <div style={{ height: '1.5px', background: '#C8861E', margin: '36px 0 40px' }} />

        {/* Sub-row: body copy + toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '40px',
          flexWrap: 'wrap' as const,
          marginBottom: '64px',
        }}>
          <p style={{
            fontFamily: 'var(--font-barlow)',
            fontSize: '16px',
            color: '#5A5550',
            lineHeight: 1.75,
            maxWidth: '480px',
            margin: 0,
            fontWeight: 300,
          }}>
            RoadHouse Studio builds the infrastructure behind the ecosystem —
            platforms, identities, content, and owned IP.
            Operators only. No tourism.
          </p>

          {/* Toggle */}
          <div style={{ display: 'flex', flexShrink: 0 }}>
            {(['client', 'house'] as ActiveView[]).map((view, i) => {
              const label = view === 'client' ? 'For Clients' : 'For the House'
              const active = activeView === view
              return (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  style={{
                    fontFamily: 'var(--font-dm-mono-studio)',
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    padding: '11px 22px',
                    border: `1px solid ${active ? '#C8861E' : '#1E1C18'}`,
                    borderLeft: i === 1 ? `1px solid ${active ? '#C8861E' : '#1E1C18'}` : undefined,
                    background: active ? '#C8861E' : 'transparent',
                    color: active ? '#07080A' : '#4A4540',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Services + case study — driven by activeView */}
        <StudioServices activeView={activeView} />
        <MotorsCaseStudy activeView={activeView} />

      </div>
    </section>
  )
}
