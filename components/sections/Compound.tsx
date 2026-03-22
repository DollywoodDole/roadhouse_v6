'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useState } from 'react'
import { motion } from 'framer-motion'

const MILESTONES = [
  { period: '2026 Q2', label: 'Site identified and optioned' },
  { period: '2026 Q4', label: 'First community event on-site' },
  { period: '2027',    label: 'Full compound operational' },
]

export default function Compound() {
  const { ref, isVisible } = useScrollReveal()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Compound Waitlist',
          email,
          type: 'Compound — Waitlist Interest',
          message: 'Compound waitlist signup',
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Something went wrong.')
      }
      setStatus('success')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  return (
    <section id="compound" className="px-8 lg:px-16 py-20">
      <motion.div
        ref={ref as React.RefObject<HTMLDivElement>}
        initial={{ opacity: 0, y: 24 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="mb-10">
          <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">
            Year 2 — Saskatchewan · Physical Infrastructure
          </div>
          <h2
            className="text-5xl lg:text-7xl font-light italic"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            The Compound{' '}
            <span className="block text-3xl lg:text-4xl mt-1">
              <span className="text-rh-faint">Coming </span>
              <span className="text-gold">Q4 2026</span>
            </span>
          </h2>
          <div className="gold-line mt-4 max-w-xs" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left — Prose + milestones */}
          <div>
            <p className="text-rh-muted text-sm leading-relaxed mb-8 tracking-wide max-w-lg">
              RoadHouse is building a physical home in rural Saskatchewan. A compound for the community — events, residencies, creative production, and the kind of conversations that don&apos;t happen on stream.
            </p>
            <div className="space-y-4">
              {MILESTONES.map(m => (
                <div
                  key={m.period}
                  className="flex gap-4 pl-4 border-l border-gold/30"
                >
                  <div className="shrink-0">
                    <div
                      className="text-lg font-light italic text-gold"
                      style={{ fontFamily: 'var(--font-cormorant)' }}
                    >
                      {m.period}
                    </div>
                  </div>
                  <div className="text-[11px] text-rh-muted leading-relaxed self-center tracking-wide">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Waitlist card */}
          <div className="bg-rh-card border border-rh-border rounded-lg p-6 self-start">
            <div
              className="text-xl font-light italic text-rh-text mb-1"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Get early access
            </div>
            <p className="text-[11px] text-rh-faint mb-5 tracking-wider">
              Be first to know when compound events open.
            </p>

            {status === 'success' ? (
              <div className="flex items-center gap-2 text-gold text-sm">
                <span className="text-base">✓</span>
                <span style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
                  You&apos;re on the list.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-rh-surface border border-rh-border rounded px-3 py-2.5 text-[12px] text-rh-text placeholder:text-rh-faint focus:outline-none focus:border-gold/40 transition-colors tracking-wider"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="stripe-btn w-full py-2.5 text-rh-black text-[10px] tracking-widest uppercase font-medium rounded disabled:opacity-60"
                >
                  {status === 'loading' ? 'Sending…' : 'Notify Me'}
                </button>
                {status === 'error' && (
                  <p className="text-[11px] text-red-400 tracking-wider">{errorMsg}</p>
                )}
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
