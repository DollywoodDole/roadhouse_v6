'use client'

/**
 * RoadHouse Capital — Member Portal
 * ───────────────────────────────────
 * /portal — Tier display, $ROAD balance, Stripe Customer Portal link.
 * No auth required — email lookup gates access. Stripe's portal handles
 * billing security on their end.
 */

import { useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface TierMeta {
  displayName:  string
  price:        string
  roadPerMonth: string
}

interface PortalData {
  customer: {
    id:        string
    email:     string | null
    name:      string | null
    createdAt: number
  }
  subscription: {
    id:               string
    status:           string
    startDate:        number
    currentPeriodEnd: number
  } | null
  tier:        string | null
  tierMeta:    TierMeta | null
  roadBalance: number
  portalUrl:   string | null
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PortalPage() {
  const [email,    setEmail]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [data,     setData]     = useState<PortalData | null>(null)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setData(null)

    try {
      const res = await fetch('/api/portal/session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong.')
      } else {
        setData(json)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-rh-black text-rh-text font-cormorant">
      {/* Header */}
      <header className="border-b border-rh-border px-6 py-5 flex items-center justify-between">
        <a href="/" className="text-gold font-semibold tracking-wide text-lg">
          RoadHouse
        </a>
        <span className="text-rh-muted text-sm font-mono">Member Portal</span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Lookup form */}
        {!data && (
          <div>
            <h1 className="text-3xl font-light text-rh-text mb-2">
              Member Portal
            </h1>
            <p className="text-rh-muted mb-10">
              Enter your subscription email to view your membership details.
            </p>

            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm text-gold-pale mb-2"
                >
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

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold text-rh-black font-semibold py-3 rounded hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Looking up…' : 'View my membership'}
              </button>
            </form>

            <p className="mt-6 text-sm text-rh-muted">
              Not a member?{' '}
              <a href="/#membership" className="text-gold hover:underline">
                Join RoadHouse
              </a>
            </p>
          </div>
        )}

        {/* Member dashboard */}
        {data && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-light text-rh-text">
                  {data.customer.name || 'Member'}
                </h1>
                <p className="text-rh-muted text-sm mt-1">{data.customer.email}</p>
              </div>
              <button
                onClick={() => { setData(null); setEmail('') }}
                className="text-rh-muted text-sm hover:text-rh-text transition-colors"
              >
                Sign out
              </button>
            </div>

            {/* Tier card */}
            {data.tierMeta ? (
              <div className="bg-rh-card border border-rh-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-rh-muted uppercase tracking-widest">
                    Membership Tier
                  </span>
                  <span className="text-xs font-mono text-gold bg-gold/10 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <p className="text-2xl font-semibold text-rh-text">
                  {data.tierMeta.displayName}
                </p>
                <p className="text-rh-muted text-sm mt-1">{data.tierMeta.price}</p>
                {data.subscription && (
                  <p className="text-rh-muted text-xs font-mono mt-3">
                    Renews{' '}
                    {new Date(data.subscription.currentPeriodEnd * 1000).toLocaleDateString(
                      'en-CA',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-rh-card border border-rh-border rounded-lg p-6">
                <p className="text-rh-muted">No active membership found.</p>
                <a
                  href="/#membership"
                  className="inline-block mt-3 text-gold text-sm hover:underline"
                >
                  View membership options →
                </a>
              </div>
            )}

            {/* $ROAD balance */}
            <div className="bg-rh-card border border-rh-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-rh-muted uppercase tracking-widest">
                  $ROAD Balance
                </span>
                <span className="text-xs font-mono text-rh-faint bg-rh-elevated px-2 py-0.5 rounded">
                  Pre-launch
                </span>
              </div>
              <p className="text-3xl font-semibold text-gold font-mono">
                {data.roadBalance.toLocaleString()}
              </p>
              <p className="text-rh-muted text-xs mt-2">
                Accruing {data.tierMeta?.roadPerMonth ?? '—'} · Snapshots at mainnet launch
              </p>
              <p className="text-rh-faint text-xs mt-1">
                Connect a Solana wallet to register for your airdrop.
              </p>
            </div>

            {/* Discord */}
            <div className="bg-rh-card border border-rh-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-rh-muted uppercase tracking-widest">
                  Discord
                </span>
              </div>
              <p className="text-rh-text text-sm mb-3">
                Run <span className="font-mono text-gold bg-gold/10 px-1.5 py-0.5 rounded">/verify</span> in the RoadHouse Discord to link your membership and receive your role.
              </p>
              <a
                href="https://discord.gg/wwhhKcnQJ3"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-gold hover:underline"
              >
                Join Discord →
              </a>
            </div>

            {/* Billing portal */}
            <div className="pt-2">
              {data.portalUrl ? (
                <a
                  href={data.portalUrl}
                  className="block w-full text-center bg-rh-elevated border border-rh-border text-rh-text py-3 rounded hover:border-gold hover:text-gold transition-colors text-sm"
                >
                  Manage billing & invoices →
                </a>
              ) : (
                <p className="text-rh-faint text-xs text-center">
                  Billing portal unavailable — contact{' '}
                  <a href="mailto:roadhousesyndicate@gmail.com" className="text-gold hover:underline">
                    roadhousesyndicate@gmail.com
                  </a>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
