'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { processEntrance } from '@/lib/studio/animations'

const STEPS = [
  {
    num:  '01',
    name: 'DISCOVERY',
    desc: '15-minute call. We learn your operation, your constraints, and what success actually looks like.',
  },
  {
    num:  '02',
    name: 'PROPOSAL',
    desc: 'Fixed scope delivered in 48 hours. Exact deliverables, exact price. No discovery invoices.',
  },
  {
    num:  '03',
    name: 'BUILD',
    desc: "7\u201321 days. You're in a shared channel. Daily updates. No black boxes.",
  },
  {
    num:  '04',
    name: 'DELIVERY',
    desc: 'All source files, credentials, and assets transferred. Zero lock-in. You own everything.',
  },
  {
    num:  '05',
    name: 'GROW',
    desc: 'Optional retainer from $350/mo. Maintenance, growth, or expansion — only if it makes sense.',
  },
]

export default function StudioProcess() {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return
    const steps = containerRef.current.querySelectorAll('[data-process-step]')
    if (steps.length) processEntrance(steps)
  }, { scope: containerRef })

  return (
    <section
      ref={containerRef}
      id="process"
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
            How it works
          </span>
          <div style={{
            fontFamily:    'var(--font-bebas)',
            fontSize:      'clamp(40px, 6vw, 72px)',
            color:         '#E8E0D0',
            lineHeight:    0.95,
            letterSpacing: '0.01em',
            marginTop:     '12px',
          }}>
            THE ENGAGEMENT.
          </div>
        </div>

        {/* Steps */}
        <div
          className="studio-process-grid"
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            borderTop:           '1px solid #141618',
          }}
        >
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              data-process-step
              style={{
                padding:     '40px 28px',
                borderRight: i < 4 ? '1px solid #141618' : 'none',
              }}
            >
              <div style={{
                fontFamily:    'var(--font-bebas)',
                fontSize:      '80px',
                color:         '#5A3A18',
                lineHeight:    1,
                letterSpacing: '0.01em',
                marginBottom:  '16px',
                userSelect:    'none',
              }}>
                {step.num}
              </div>
              <div style={{
                fontFamily:    'var(--font-bebas)',
                fontSize:      '24px',
                color:         '#E8E0D0',
                letterSpacing: '0.06em',
                marginBottom:  '14px',
                lineHeight:    1,
              }}>
                {step.name}
              </div>
              <p style={{
                fontFamily: 'var(--font-barlow)',
                fontSize:   '13px',
                color:      '#5A5550',
                lineHeight: 1.7,
                margin:     0,
                fontWeight: 300,
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .studio-process-grid {
            grid-template-columns: 1fr !important;
          }
          .studio-process-grid > div {
            border-right: none !important;
            border-bottom: 1px solid #141618;
          }
        }
      `}</style>
    </section>
  )
}
