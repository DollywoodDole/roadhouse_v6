'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrambleOnEnter } from '@/lib/studio/animations'

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
    desc: "7–21 days. You're in a shared channel. Daily updates. No black boxes.",
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
  const headingRef   = useRef<HTMLDivElement>(null)
  const stepsRef     = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    if (headingRef.current) {
      scrambleOnEnter(headingRef.current, 'THE ENGAGEMENT.')
    }

    const mm = gsap.matchMedia()

    // ── Desktop: horizontal pinned scroll ──────────────────────────────────
    mm.add('(min-width: 1024px)', () => {
      if (!stepsRef.current || !containerRef.current) return

      const steps      = stepsRef.current.querySelectorAll('[data-process-step]')
      const stepCount  = steps.length

      // First step active, rest muted
      steps.forEach((step, i) => {
        if (i !== 0) {
          gsap.set(step.querySelector('[data-step-title]'), { opacity: 0.3 })
          gsap.set(step.querySelector('[data-step-desc]'),  { opacity: 0.3 })
        }
      })

      const getEndDist = () =>
        stepsRef.current!.scrollWidth - window.innerWidth + 80

      gsap.to(stepsRef.current, {
        x:    () => -getEndDist(),
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          pin:     true,
          scrub:   1,
          end:     () => '+=' + getEndDist(),
          onUpdate(self) {
            const activeIdx = Math.round(self.progress * (stepCount - 1))
            steps.forEach((step, i) => {
              const isActive = i === activeIdx
              gsap.to(step.querySelector('[data-step-title]'), {
                opacity:   isActive ? 1 : 0.3,
                duration:  0.25,
                overwrite: 'auto',
              })
              gsap.to(step.querySelector('[data-step-desc]'), {
                opacity:   isActive ? 1 : 0.3,
                duration:  0.25,
                overwrite: 'auto',
              })
            })
          },
        },
      })
    })

    // ── Mobile: vertical slide-in ───────────────────────────────────────────
    mm.add('(max-width: 1023px)', () => {
      const steps = containerRef.current?.querySelectorAll('[data-process-step]')
      if (!steps?.length) return
      steps.forEach((step, i) => {
        ScrollTrigger.create({
          trigger: step,
          start:   'top 88%',
          once:    true,
          onEnter: () => {
            gsap.fromTo(step,
              { opacity: 0, x: -40 },
              { opacity: 1, x: 0, duration: 0.65, ease: 'power2.out', delay: i * 0.06 }
            )
          },
        })
      })
    })
  }, { scope: containerRef })

  return (
    <section
      ref={containerRef}
      id="process"
      style={{
        borderTop: '1px solid #141618',
        overflow:  'hidden',
      }}
    >
      {/* Heading — sits above the horizontal strip */}
      <div style={{ padding: '64px 48px 32px' }}>
        <div
          ref={headingRef}
          style={{
            fontFamily:    'var(--font-bebas)',
            fontSize:      'clamp(40px, 6vw, 72px)',
            color:         '#E8E0D0',
            lineHeight:    0.95,
            letterSpacing: '0.01em',
          }}
        >
          THE ENGAGEMENT.
        </div>
      </div>

      {/* Steps — horizontal strip on desktop, vertical stack on mobile */}
      <div
        ref={stepsRef}
        className="studio-process-steps"
        style={{
          display:    'flex',
          willChange: 'transform',
        }}
      >
        {STEPS.map((step, i) => (
          <div
            key={step.num}
            data-process-step
            style={{
              flexShrink:   0,
              width:        'clamp(260px, 26vw, 380px)',
              padding:      '32px 48px 64px',
              borderRight:  i < STEPS.length - 1 ? '1px solid #141618' : 'none',
            }}
          >
            {/* Large ghost number */}
            <div style={{
              fontFamily:    'var(--font-bebas)',
              fontSize:      'clamp(80px, 11vw, 160px)',
              lineHeight:    0.85,
              letterSpacing: '0.01em',
              color:         '#0F1114',
              marginBottom:  '16px',
              userSelect:    'none',
            }}>
              {step.num}
            </div>

            {/* Step name */}
            <div
              data-step-title
              style={{
                fontFamily:    'var(--font-bebas)',
                fontSize:      '42px',
                color:         '#E8E0D0',
                letterSpacing: '0.04em',
                lineHeight:    1,
                marginBottom:  '14px',
              }}
            >
              {step.name}
            </div>

            {/* Description */}
            <p
              data-step-desc
              style={{
                fontFamily: 'var(--font-barlow)',
                fontSize:   '13px',
                color:      '#878070',
                lineHeight: 1.7,
                margin:     0,
                fontWeight: 300,
                maxWidth:   '260px',
              }}
            >
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .studio-process-steps {
            flex-direction: column !important;
            will-change: auto !important;
          }
          .studio-process-steps > [data-process-step] {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #141618;
          }
          .studio-process-steps > [data-process-step]:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </section>
  )
}
