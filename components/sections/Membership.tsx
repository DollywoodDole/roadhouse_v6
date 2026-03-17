'use client'

import { siteConfig } from '@/lib/site-config'

import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'

const TIERS = [
  {
    id: 'regular',
    rank: '02',
    name: 'Regular',
    price: '$9.99',
    period: '/mo',
    lux: '100 $ROAD',
    icon: '◇',
    borderClass: 'tier-regular',
    priceId: siteConfig.stripe.subscriptions.regular,
    features: [
      'Community Discord access',
      'Member-only chat channels',
      'Minor proposal voting rights',
      'RoadHouse newsletter',
      'Early access to stream notifications',
      '100 $ROAD governance tokens / mo',
    ],
    cta: 'Join as Regular',
  },
  {
    id: 'ranch-hand',
    rank: '03',
    name: 'Ranch Hand',
    price: '$29.99',
    period: '/mo',
    lux: '500 $ROAD',
    icon: '◆',
    borderClass: 'tier-ranch',
    highlight: true,
    priceId: siteConfig.stripe.subscriptions.ranch,
    features: [
      'All Regular benefits',
      'Guild participation rights',
      'Revenue-share eligibility',
      'Treasury proposal voting',
      'Exclusive VOD archive access',
      'Sponsorship deal previews',
      '500 $ROAD governance tokens / mo',
    ],
    cta: 'Become a Ranch Hand',
  },
  {
    id: 'partner',
    rank: '04',
    name: 'Partner',
    price: '$99.99',
    period: '/mo',
    lux: '2,000 $ROAD',
    icon: '⬡',
    borderClass: 'tier-partner',
    priceId: siteConfig.stripe.subscriptions.partner,
    features: [
      'All Ranch Hand benefits',
      'Guild leadership candidacy',
      'Full treasury visibility',
      'Direct sponsorship deal access',
      'Investor memo access',
      'Monthly 1-on-1 with Founder',
      '2,000 $ROAD governance tokens / mo',
    ],
    cta: 'Become a Partner',
  },
]

async function startSubscription(priceId: string | null | undefined) {
  if (!priceId) {
    alert(`This membership tier is not yet available. Check back soon or contact ${siteConfig.contactEmail}.`)
    return
  }
  const res = await fetch('/api/subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId }),
  })
  const data = await res.json()
  if (data.url) window.location.href = data.url
  else alert('Subscription error. Please try again.')
}

export default function Membership() {
  const [loading, setLoading] = useState<string | null>(null)

  const subscribe = async (tier: typeof TIERS[0]) => {
    setLoading(tier.id)
    try {
      await startSubscription(tier.priceId)
    } finally {
      setLoading(null)
    }
  }

  return (
    <section id="membership" className="px-8 lg:px-16 py-20 border-t border-rh-border">
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Membership Ladder — Earned, Not Purchased</div>
        <h2 className="text-4xl lg:text-5xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Digital <span className="text-gold">Membership</span>
        </h2>
        <p className="text-rh-muted text-sm mt-3 max-w-xl tracking-wide">
          Access is earned through participation. Each tier unlocks governance rights, revenue-share allocation, and $ROAD tokens.
          Cancel anytime. Upgrade when you've earned it.
        </p>
        <div className="gold-line mt-4 max-w-xs" />
      </div>

      {/* Discord CTA */}
      <div className="mb-10 p-4 bg-rh-card border border-rh-border rounded-lg flex items-center gap-4 max-w-2xl">
        <span className="text-3xl">💬</span>
        <div className="flex-1">
          <div className="text-sm text-rh-text font-medium mb-0.5">Members get Discord access</div>
          <div className="text-[11px] text-rh-muted">Join the private Discord server — active community, guild channels, and direct access to the team.</div>
        </div>
        <a
          href="https://discord.gg/wwhhKcnQJ3"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 text-[10px] tracking-widest uppercase border border-[#5865F2]/40 text-[#7289DA] hover:bg-[#5865F2]/10 rounded transition-colors whitespace-nowrap"
        >
          Join Discord
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIERS.map(tier => (
          <div
            key={tier.id}
            className={`bg-rh-card rounded-lg overflow-hidden flex flex-col card-glow border-2 ${tier.borderClass} ${
              tier.highlight ? 'relative' : ''
            }`}
          >
            {tier.highlight && (
              <div className="stripe-btn text-center text-rh-black text-[9px] tracking-[0.4em] uppercase py-1.5 font-medium">
                Most Popular
              </div>
            )}
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-[10px] tracking-[0.3em] text-rh-faint uppercase mb-1">{tier.rank}</div>
                  <h3
                    className="text-2xl font-light italic text-rh-text"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    {tier.icon} {tier.name}
                  </h3>
                </div>
                <div className="text-right">
                  <div
                    className="text-3xl font-light text-gold"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    {tier.price}
                  </div>
                  <div className="text-[10px] text-rh-faint">{tier.period} CAD</div>
                </div>
              </div>

              <div className="text-[10px] tracking-widest uppercase text-gold-dark mb-4">{tier.lux}</div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-[11px] text-rh-muted leading-relaxed">
                    <Check size={11} className="mt-0.5 text-gold shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => subscribe(tier)}
                disabled={loading === tier.id || !tier.priceId}
                className={`w-full py-3 text-[11px] tracking-widest uppercase font-medium rounded flex items-center justify-center gap-2 transition-all ${
                  tier.highlight
                    ? 'stripe-btn text-rh-black'
                    : 'border border-rh-border text-rh-text hover:border-gold/40 hover:bg-gold/5'
                } disabled:opacity-60`}
              >
                {loading === tier.id ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : !tier.priceId ? (
                  'Coming Soon'
                ) : (
                  tier.cta
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[11px] text-rh-faint text-center tracking-wider">
        Recurring billing via Stripe · Cancel anytime in your member portal · $ROAD tokens accrued monthly
      </p>

      {/* Upper tiers teaser */}
      <div className="mt-8 p-5 bg-rh-card border border-rh-border rounded-lg max-w-2xl mx-auto text-center">
        <div className="text-[10px] tracking-[0.3em] uppercase text-rh-faint mb-2">Steward · Praetor</div>
        <p className="text-[12px] text-rh-muted leading-relaxed">
          Higher tiers (Steward at 10,000 $ROAD · Praetor at 50,000 $ROAD) are invitation-only — earned through demonstrated long-term commitment, not purchased.{' '}
          <a href={`mailto:${siteConfig.contactEmail}`} className="text-gold hover:underline">
            Inquire directly.
          </a>
        </p>
      </div>
    </section>
  )
}
