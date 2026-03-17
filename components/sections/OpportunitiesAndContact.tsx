'use client'

import { siteConfig } from '@/lib/site-config'

import { useState } from 'react'
import { ExternalLink, Loader2, Send, CheckCircle } from 'lucide-react'

const ROLES = [
  {
    status: 'Now Hiring',
    statusColor: 'text-green-400 border-green-400/30 bg-green-400/5',
    title: 'Translators',
    desc: 'Expanding the RoadHouse internationally. Skilled translators to adapt content across multiple languages — written and spoken. Proficiency in 2+ languages required. Familiarity with tech, gaming, or streaming culture a plus.',
    tags: ['Multilingual', 'Content Adaptation', 'Streaming Familiarity', 'Remote'],
    apply: 'https://x.com/dollywooddole',
    applyLabel: 'Apply via DM on X',
  },
  {
    status: 'Now Hiring',
    statusColor: 'text-green-400 border-green-400/30 bg-green-400/5',
    title: 'VOD Clip Assistants',
    desc: 'Long-form streams (8–12 hours) need expert eyes to find the gold buried in the runtime. Watch, identify highlights, clip, and organize VOD content with speed and taste. No lazy cuts. High standards apply.',
    tags: ['Video Editing', 'Kick / VODs', 'Attention to Detail', 'Remote'],
    apply: 'https://x.com/dollywooddole',
    applyLabel: 'Apply via DM on X',
  },
  {
    status: 'Open Application',
    statusColor: 'text-rh-muted border-rh-border',
    title: 'Rare Talent',
    desc: "Don't see your role listed? If you bring something exceptional — physics, synthesis, software, design, community management, tokenomics — reach out. The RoadHouse is always interested in what we haven't thought of yet.",
    tags: ['Any Discipline', 'High Standards', 'Discretion Required'],
    apply: `mailto:${siteConfig.contactEmail}`,
    applyLabel: 'Send Email',
  },
]

const INQUIRY_TYPES = [
  'Select a category',
  'Investor — SAFE / SAFT',
  'Strategic Partnership',
  'Guild Application',
  'Sponsorship Inquiry',
  'Media / Press',
  'Coconut Cowboy — Retail',
  'Employment Application',
  'General Question',
]

export default function OpportunitiesAndContact() {
  const [formData, setFormData] = useState({ name: '', email: '', type: 'Select a category', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.type === 'Select a category') return
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) {
        setSendError(data.error || 'Failed to send. Please try again.')
      } else {
        setSent(true)
      }
    } catch {
      setSendError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Opportunities */}
      <section id="opportunities" className="px-8 lg:px-16 py-20 border-t border-rh-border">
        <div className="mb-10">
          <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Talent With Standards Always Welcome</div>
          <h2 className="text-4xl lg:text-5xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Open <span className="text-gold">Opportunities</span>
          </h2>
          <p className="text-rh-muted text-sm mt-3 max-w-xl tracking-wide">
            The RoadHouse is growing. We're looking for people who show up, do the work, and understand that discretion
            isn't a policy — it's a personality trait.
          </p>
          <div className="gold-line mt-4 max-w-xs" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {ROLES.map(role => (
            <div key={role.title} className="bg-rh-card border border-rh-border rounded-lg p-6 card-glow flex flex-col">
              <span className={`self-start px-2 py-0.5 text-[9px] tracking-widest uppercase border rounded mb-3 ${role.statusColor}`}>
                {role.status}
              </span>
              <h3
                className="text-xl font-light italic text-rh-text mb-3"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                {role.title}
              </h3>
              <p className="text-[11px] text-rh-muted leading-relaxed mb-4 flex-1">{role.desc}</p>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {role.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-[9px] tracking-wider border border-rh-border text-rh-faint rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <a
                href={role.apply}
                target={role.apply.startsWith('http') ? '_blank' : undefined}
                rel={role.apply.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="stripe-btn block text-center py-2.5 text-rh-black text-[10px] tracking-widest uppercase font-medium rounded"
              >
                {role.applyLabel}
              </a>
            </div>
          ))}
        </div>

        <div className="bg-rh-card border border-rh-border rounded-lg p-5 max-w-2xl">
          <div className="text-[10px] tracking-[0.3em] uppercase text-rh-faint mb-2">How to Apply</div>
          <p className="text-[11px] text-rh-muted leading-relaxed">
            All applications: X DMs{' '}
            <a href="https://x.com/dollywooddole" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
              @dollywooddole
            </a>{' '}
            or email{' '}
            <a href={`mailto:${siteConfig.contactEmail}`} className="text-gold hover:underline">
              {siteConfig.contactEmail}
            </a>
            {' '}· Include relevant experience and a work sample if applicable · We read everything.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="px-8 lg:px-16 py-20 border-t border-rh-border">
        <div className="mb-10">
          <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Serious Inquiries · Serious People</div>
          <h2 className="text-4xl lg:text-5xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Get in <span className="text-gold">Touch</span>
          </h2>
          <div className="gold-line mt-4 max-w-xs" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Contact channels */}
          <div>
            <h3
              className="text-xl font-light italic text-rh-text mb-5"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Contact Channels
            </h3>
            <div className="space-y-3 mb-8">
              {[
                { icon: '✉', label: 'Business Email', value: siteConfig.contactEmail, href: `mailto:${siteConfig.contactEmail}` },
                { icon: '✉', label: 'Direct / Founder', value: siteConfig.founderEmail, href: `mailto:${siteConfig.founderEmail}` },
                { icon: '𝕏', label: 'X / Twitter DMs', value: '@dollywooddole', href: 'https://x.com/dollywooddole' },
                { icon: '▶', label: 'Kick Stream', value: 'kick.com/dollywooddole', href: 'https://kick.com/dollywooddole' },
                { icon: '💬', label: 'Discord', value: 'Via membership or DM on X', href: 'https://discord.gg/wwhhKcnQJ3' },
              ].map(ch => (
                <a
                  key={ch.label}
                  href={ch.href}
                  target={ch.href.startsWith('http') ? '_blank' : undefined}
                  rel={ch.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-4 p-4 bg-rh-card border border-rh-border rounded-lg hover:border-gold/30 hover:bg-rh-elevated transition-all group"
                >
                  <span className="text-gold text-base w-5 text-center">{ch.icon}</span>
                  <div className="flex-1">
                    <div className="text-[10px] tracking-widest uppercase text-rh-faint">{ch.label}</div>
                    <div className="text-[12px] text-rh-text group-hover:text-gold transition-colors">{ch.value}</div>
                  </div>
                  <ExternalLink size={12} className="text-rh-faint group-hover:text-gold transition-colors" />
                </a>
              ))}
            </div>

            {/* Entity info */}
            <div className="p-5 bg-rh-card border border-rh-border rounded-lg">
              <div className="text-[10px] tracking-[0.3em] uppercase text-rh-faint mb-2">Entity</div>
              <p className="text-[12px] text-rh-muted leading-relaxed">
                Praetorian Holdings Corp.<br />
                Saskatchewan, Canada · CCPC<br />
                Dalton Ellscheid — Founder & CTO
              </p>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h3
              className="text-xl font-light italic text-rh-text mb-5"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Send an Inquiry
            </h3>

            {sent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle size={40} className="text-gold mb-4" />
                <div className="text-xl font-light italic text-rh-text mb-2" style={{ fontFamily: 'var(--font-cormorant)' }}>
                  Message Sent
                </div>
                <p className="text-[12px] text-rh-muted">Message received. We read and respond to every legitimate inquiry.</p>
                <button onClick={() => setSent(false)} className="mt-4 text-[10px] tracking-widest uppercase text-gold hover:underline">
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase text-rh-faint mb-1.5">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      className="w-full bg-rh-card border border-rh-border rounded px-3 py-2.5 text-[12px] text-rh-text placeholder-rh-faint focus:outline-none focus:border-gold/40 transition-colors"
                      placeholder="Dalton Ellscheid"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase text-rh-faint mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                      className="w-full bg-rh-card border border-rh-border rounded px-3 py-2.5 text-[12px] text-rh-text placeholder-rh-faint focus:outline-none focus:border-gold/40 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] tracking-widest uppercase text-rh-faint mb-1.5">Inquiry Type</label>
                  <select
                    required
                    value={formData.type}
                    onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
                    className="w-full bg-rh-card border border-rh-border rounded px-3 py-2.5 text-[12px] text-rh-text focus:outline-none focus:border-gold/40 transition-colors"
                  >
                    {INQUIRY_TYPES.map(t => (
                      <option key={t} value={t} disabled={t === 'Select a category'}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] tracking-widest uppercase text-rh-faint mb-1.5">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                    className="w-full bg-rh-card border border-rh-border rounded px-3 py-2.5 text-[12px] text-rh-text placeholder-rh-faint focus:outline-none focus:border-gold/40 transition-colors resize-none"
                    placeholder="Keep it concise. We read everything."
                  />
                </div>

                {sendError && (
                  <p className="text-[11px] text-red-400 text-center">{sendError}</p>
                )}

                <button
                  type="submit"
                  disabled={sending || formData.type === 'Select a category'}
                  className="stripe-btn w-full py-3 text-rh-black text-[11px] tracking-widest uppercase font-medium rounded flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <><Send size={13} /> Send Message →</>}
                </button>

                <p className="text-[10px] text-rh-faint text-center">
                  No unsolicited follows. Serious inquiries only.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
