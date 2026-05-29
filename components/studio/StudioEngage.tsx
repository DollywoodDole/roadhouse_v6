'use client'

import { useState } from 'react'
import MagneticButton from './MagneticButton'

type Status = 'idle' | 'loading' | 'success' | 'error'

const FIELD: React.CSSProperties = {
  fontFamily:      'var(--font-barlow)',
  fontSize:        '14px',
  color:           '#E8E0D0',
  background:      '#0C0D0F',
  border:          '1px solid #1A1C1F',
  padding:         '12px 14px',
  width:           '100%',
  boxSizing:       'border-box',
  outline:         'none',
  fontWeight:      300,
}

const LABEL: React.CSSProperties = {
  fontFamily:    'var(--font-dm-mono-studio)',
  fontSize:      '10px',
  color:         '#3A3530',
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  display:       'block',
  marginBottom:  '6px',
}

export default function StudioEngage() {
  const [status,  setStatus]  = useState<Status>('idle')
  const [name,    setName]    = useState('')
  const [company, setCompany] = useState('')
  const [email,   setEmail]   = useState('')
  const [brief,   setBrief]   = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/studio/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, company, email, brief }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" style={{ borderTop: '1px solid #141618', padding: '96px 0' }}>
      <div style={{
        maxWidth:       '1400px',
        margin:         '0 auto',
        padding:        '0 1.5rem',
        display:        'flex',
        alignItems:     'flex-start',
        justifyContent: 'space-between',
        gap:            '64px',
        flexWrap:       'wrap' as const,
      }}>

        {/* Left: headline + proof points */}
        <div style={{ minWidth: '260px' }}>
          <div style={{
            fontFamily:    'var(--font-bebas)',
            fontSize:      'clamp(52px, 8vw, 100px)',
            lineHeight:    0.95,
            letterSpacing: '0.01em',
            color:         '#E8E0D0',
          }}>
            <div>WORK /</div>
            <div><span style={{ color: '#C8861E' }}>WITH</span> /</div>
            <div>US.</div>
          </div>
          <p style={{
            fontFamily:    'var(--font-dm-mono-studio)',
            fontSize:      '11px',
            color:         '#3A3530',
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            marginTop:     '20px',
            marginBottom:  '0',
          }}>
            Fixed scope · Full ownership · RoadHouse-built
          </p>

          {/* Proof points */}
          <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {['No retainer required.', 'No lock-in.', 'No surprises.'].map((line) => (
              <div key={line} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '4px', height: '4px', background: '#C8861E', flexShrink: 0 }} />
                <span style={{
                  fontFamily:    'var(--font-dm-mono-studio)',
                  fontSize:      '11px',
                  color:         '#4A4540',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                }}>
                  {line}
                </span>
              </div>
            ))}
          </div>

          {/* Secondary CTA */}
          <div style={{ marginTop: '40px' }}>
            <MagneticButton>
              <a
                href="#work"
                style={{
                  fontFamily:     'var(--font-dm-mono-studio)',
                  fontSize:       '11px',
                  color:          '#5A5550',
                  letterSpacing:  '0.12em',
                  textTransform:  'uppercase' as const,
                  padding:        '12px 24px',
                  textDecoration: 'none',
                  border:         '1px solid #1E1C18',
                  display:        'inline-block',
                  transition:     'border-color 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = '#C8861E'
                  el.style.color = '#C8861E'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.borderColor = '#1E1C18'
                  el.style.color = '#5A5550'
                }}
              >
                View Case Study →
              </a>
            </MagneticButton>
          </div>
        </div>

        {/* Right: contact form */}
        <div style={{ flex: 1, minWidth: '280px', maxWidth: '480px' }}>
          {status === 'success' ? (
            <div style={{
              border:   '1px solid #1A3020',
              background: '#0C1810',
              padding:  '40px 32px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4CAF50' }} />
                <span style={{
                  fontFamily:    'var(--font-dm-mono-studio)',
                  fontSize:      '10px',
                  color:         '#4CAF50',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                }}>Message sent</span>
              </div>
              <p style={{
                fontFamily: 'var(--font-barlow)',
                fontSize:   '15px',
                color:      '#E8E0D0',
                lineHeight: 1.7,
                margin:     '0 0 24px',
                fontWeight: 300,
              }}>
                We&apos;ll review your brief and be in touch within 48 hours.
              </p>
              <span style={{
                fontFamily:    'var(--font-dm-mono-studio)',
                fontSize:      '10px',
                color:         '#4A4540',
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
              }}>
                roadhousesyndicate@gmail.com
              </span>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column' as const, gap: '20px' }}>
              <div style={{
                fontFamily:    'var(--font-dm-mono-studio)',
                fontSize:      '10px',
                color:         '#3A3530',
                letterSpacing: '0.15em',
                textTransform: 'uppercase' as const,
                paddingBottom: '16px',
                borderBottom:  '1px solid #141618',
              }}>
                Start a conversation
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label htmlFor="studio-name" style={LABEL}>Name *</label>
                  <input
                    id="studio-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    style={FIELD}
                  />
                </div>
                <div>
                  <label htmlFor="studio-company" style={LABEL}>Company</label>
                  <input
                    id="studio-company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Optional"
                    style={FIELD}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="studio-email" style={LABEL}>Email *</label>
                <input
                  id="studio-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  style={FIELD}
                />
              </div>

              <div>
                <label htmlFor="studio-brief" style={LABEL}>Brief</label>
                <textarea
                  id="studio-brief"
                  rows={4}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="What are you building? What does success look like?"
                  style={{ ...FIELD, resize: 'vertical' as const }}
                />
              </div>

              {status === 'error' && (
                <p style={{
                  fontFamily:    'var(--font-dm-mono-studio)',
                  fontSize:      '10px',
                  color:         '#C0392B',
                  letterSpacing: '0.1em',
                  margin:        0,
                }}>
                  Failed to send. Email us directly at roadhousesyndicate@gmail.com
                </p>
              )}

              <MagneticButton style={{ alignSelf: 'flex-start' }}>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  style={{
                    fontFamily:    'var(--font-dm-mono-studio)',
                    fontSize:      '11px',
                    background:    status === 'loading' ? '#5A3A18' : '#C8861E',
                    color:         '#07080A',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    padding:       '14px 32px',
                    border:        'none',
                    cursor:        status === 'loading' ? 'wait' : 'pointer',
                    fontWeight:    500,
                    transition:    'background 0.15s ease',
                  }}
                >
                  {status === 'loading' ? 'Sending...' : 'Send Brief ↗'}
                </button>
              </MagneticButton>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
