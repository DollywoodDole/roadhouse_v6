'use client'

/**
 * RoadHouse Capital — Member Portal
 * ───────────────────────────────────
 * /portal — Sends a billing portal link to the member's email on file.
 * No auth required and no member data returned — portal URL is emailed
 * to the address Stripe has on record, not returned to the requester.
 */

import { useState } from 'react'
import { siteConfig } from '@/lib/site-config'
import NetworkIndicator from '@/components/wallet/NetworkIndicator'
import WalletButton from '@/components/wallet/WalletButton'

export default function PortalPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [sent,    setSent]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res  = await fetch('/api/portal/session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const json = await res.json()
      if (res.status === 429) {
        setError(json.error ?? 'Too many requests. Please wait an hour.')
      } else {
        // Uniform OK regardless of whether account exists — show sent state
        setSent(true)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-rh-black text-rh-text font-cormorant">
      <header className="border-b border-rh-border px-6 py-5 flex items-center justify-between">
        <a href="/" className="text-gold font-semibold tracking-wide text-lg">
          RoadHouse
        </a>
        <div className="flex items-center gap-3">
          <NetworkIndicator />
          <WalletButton />
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-16">
        {!sent ? (
          <div>
            <h1 className="text-3xl font-light text-rh-text mb-2">Member Portal</h1>
            <p className="text-rh-muted mb-10 text-sm leading-relaxed">
              Enter your subscription email. If an account exists, we&apos;ll send a
              billing portal link to that address.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm text-gold-pale mb-2">
                  Subscription email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full bg-rh-surface border border-rh-border rounded px-4 py-3 text-rh-text placeholder-rh-faint focus:outline-none focus:border-gold text-base"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold text-rh-black font-semibold py-3 rounded hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending…' : 'Send portal link'}
              </button>
            </form>

            <p className="mt-6 text-sm text-rh-muted">
              Not a member?{' '}
              <a href="/#membership" className="text-gold hover:underline">Join RoadHouse</a>
            </p>
            <p className="mt-3 text-sm">
              <a href="/" className="text-rh-faint hover:text-rh-muted transition-colors">
                ← Back to roadhouse.capital
              </a>
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-light text-rh-text mb-4">Check your inbox</h1>
            <p className="text-rh-muted text-sm leading-relaxed mb-8">
              If a RoadHouse account exists for <span className="text-rh-text">{email}</span>,
              a billing portal link has been sent to that address. The link grants
              access to your billing settings — do not forward it.
            </p>
            <p className="text-rh-muted text-sm mb-6">
              Didn&apos;t receive it? Check your spam folder, or contact{' '}
              <a href={`mailto:${siteConfig.contactEmail}`} className="text-gold hover:underline">
                {siteConfig.contactEmail}
              </a>
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="text-sm text-rh-faint hover:text-rh-muted transition-colors"
            >
              ← Try a different email
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
