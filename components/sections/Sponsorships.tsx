'use client'

import { siteConfig } from '@/lib/site-config'

import { useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'

const PACKAGES = [
  {
    id: 'trail-blazer',
    name: 'Trail Blazer',
    price: '$500',
    period: 'CAD / month',
    priceId: siteConfig.stripe.sponsorships.trailBlazer,
    features: [
      'Logo in stream overlays',
      'Verbal mention on stream (1× per session)',
      'Social media shoutout (1× / week on X + TikTok)',
      'Discord sponsor role',
      'Logo in newsletter',
    ],
    reach: '~5k / mo',
    badge: null,
  },
  {
    id: 'frontier',
    name: 'Frontier',
    price: '$1,500',
    period: 'CAD / month',
    priceId: siteConfig.stripe.sponsorships.frontier,
    features: [
      'All Trail Blazer benefits',
      'Dedicated 5-min stream segment / week',
      'Sponsored TikTok content (2× / month)',
      'Product integration / review opportunity',
      'Co-branded community event',
      'Analytics report monthly',
    ],
    reach: '~20k / mo',
    badge: 'Recommended',
  },
  {
    id: 'praetor',
    name: 'Praetor',
    price: '$5,000',
    period: 'CAD / month',
    priceId: siteConfig.stripe.sponsorships.praetor,
    features: [
      'All Frontier benefits',
      'Full IP licensing rights for campaign',
      'RoadHouse Summit presenting sponsor',
      'Custom content series (4 videos)',
      'DAO-endorsed partnership announcement',
      'Co-branded merch drop opportunity',
      'Monthly strategic call with Founder',
    ],
    reach: '~100k+ / mo (compound growth)',
    badge: 'Premium',
  },
]

const PLATFORMS = [
  {
    name: 'Kick',
    handle: 'dollywooddole',
    url: 'https://kick.com/dollywooddole',
    icon: '⬡',
    desc: 'Long-form streams (8–12 hrs) · Engaged tech/culture audience · Pre-roll and overlay placements',
    format: 'Stream sponsorship',
    color: '#53FC18',
  },
  {
    name: 'TikTok @roadhousesyndicate',
    handle: '@roadhousesyndicate',
    url: 'https://www.tiktok.com/@roadhousesyndicate',
    marketplace: 'https://www.tiktok.com/business/en-US/creator-marketplace',
    icon: '♪',
    desc: 'Brand stories, Coconut Cowboy content, community highlights · Short-form viral formats',
    format: 'Branded content · Creator Marketplace',
    color: '#FE2C55',
  },
  {
    name: 'TikTok @dollywooddole',
    handle: '@dollywooddole',
    url: 'https://www.tiktok.com/@dollywooddole',
    marketplace: 'https://www.tiktok.com/business/en-US/creator-marketplace',
    icon: '♪',
    desc: 'Personal tech/physics/synthesis content · Authentic audience · Rapid growth',
    format: 'Branded content · Creator Marketplace',
    color: '#FE2C55',
  },
  {
    name: 'X / Twitter',
    handle: '@dollywooddole',
    url: 'https://x.com/dollywooddole',
    icon: '𝕏',
    desc: 'Community updates, tech discussion, direct audience engagement · Sponsorship threads',
    format: 'Sponsored posts · X Ads',
    color: '#FFFFFF',
  },
]

async function requestSponsorshipInvoice(packageName: string) {
  window.location.href = `mailto:${siteConfig.contactEmail}?subject=Sponsorship Inquiry — ${packageName}&body=Hi,%0A%0AI'm interested in the ${packageName} sponsorship package.%0A%0ACompany:%0AWebsite:%0AProduct/Service:%0AGoals:%0A%0AThanks`
}

export default function Sponsorships() {
  const [loading, setLoading] = useState<string | null>(null)

  return (
    <section id="sponsorships" className="px-8 lg:px-16 py-20 border-t border-rh-border">
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Praetorian Holdings — Brand Partnerships</div>
        <h2 className="text-4xl lg:text-5xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Sponsor the <span className="text-gold">RoadHouse</span>
        </h2>
        <p className="text-rh-muted text-sm mt-3 max-w-xl tracking-wide">
          Reach a curated, high-standard audience across streaming, short-form video, and community platforms.
          Authentic integrations only. No logo-pasting — real partnerships.
        </p>
        <div className="gold-line mt-4 max-w-xs" />
      </div>

      {/* Packages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {PACKAGES.map(pkg => (
          <div
            key={pkg.id}
            className={`bg-rh-card border rounded-lg p-6 flex flex-col card-glow ${
              pkg.badge === 'Recommended' ? 'border-gold/40' : 'border-rh-border'
            }`}
          >
            {pkg.badge && (
              <div className="text-[9px] tracking-[0.3em] uppercase text-gold mb-3">{pkg.badge}</div>
            )}
            <h3
              className="text-2xl font-light italic text-rh-text mb-1"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              {pkg.name}
            </h3>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-light text-gold" style={{ fontFamily: 'var(--font-cormorant)' }}>
                {pkg.price}
              </span>
              <span className="text-[10px] text-rh-faint">{pkg.period}</span>
            </div>
            <div className="text-[10px] tracking-wider text-gold-dark mb-5">Est. reach: {pkg.reach}</div>

            <ul className="space-y-2 flex-1 mb-6">
              {pkg.features.map(f => (
                <li key={f} className="text-[11px] text-rh-muted leading-relaxed flex items-start gap-2">
                  <span className="text-gold mt-0.5">·</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => requestSponsorshipInvoice(pkg.name)}
              className={`w-full py-2.5 text-[11px] tracking-widest uppercase font-medium rounded transition-all ${
                pkg.badge === 'Recommended'
                  ? 'stripe-btn text-rh-black'
                  : 'border border-rh-border text-rh-text hover:border-gold/40 hover:bg-gold/5'
              }`}
            >
              Request Package
            </button>
          </div>
        ))}
      </div>

      {/* Platform breakdown */}
      <div className="mb-8">
        <h3
          className="text-2xl font-light italic text-rh-text mb-6"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Platform <span className="text-gold">Reach</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLATFORMS.map(p => (
            <div key={p.name} className="bg-rh-card border border-rh-border rounded-lg p-5 card-glow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: p.color }} className="text-lg">{p.icon}</span>
                    <span className="text-sm font-medium text-rh-text">{p.name}</span>
                  </div>
                  <div className="text-[10px] tracking-widest text-rh-faint">{p.format}</div>
                </div>
                <div className="flex gap-2">
                  {'marketplace' in p && p.marketplace && (
                    <a
                      href={p.marketplace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 text-[9px] tracking-widest uppercase border border-[#FE2C55]/30 text-[#FE2C55] hover:bg-[#FE2C55]/5 rounded transition-colors flex items-center gap-1"
                    >
                      Creator MKT <ExternalLink size={8} />
                    </a>
                  )}
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 text-[9px] tracking-widest uppercase border border-rh-border text-rh-muted hover:border-gold/30 hover:text-gold rounded transition-colors flex items-center gap-1"
                  >
                    View <ExternalLink size={8} />
                  </a>
                </div>
              </div>
              <p className="text-[11px] text-rh-muted leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TikTok Creator Marketplace callout */}
      <div className="p-5 bg-rh-card border border-[#FE2C55]/20 rounded-lg flex flex-col md:flex-row items-start md:items-center gap-4">
        <span className="text-4xl">♪</span>
        <div className="flex-1">
          <h4 className="text-base font-medium text-rh-text mb-1">TikTok Creator Marketplace</h4>
          <p className="text-[11px] text-rh-muted leading-relaxed">
            Both <strong className="text-rh-text">@roadhousesyndicate</strong> and <strong className="text-rh-text">@dollywooddole</strong> are available through the TikTok Creator Marketplace for official brand partnership campaigns.
            Use the platform for campaign management, analytics, and payments — or contact directly for custom integrations.
          </p>
        </div>
        <a
          href="https://www.tiktok.com/business/en-US/creator-marketplace"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 text-[10px] tracking-widest uppercase border border-[#FE2C55]/30 text-[#FE2C55] hover:bg-[#FE2C55]/5 rounded transition-colors whitespace-nowrap flex items-center gap-2"
        >
          Open Creator Marketplace <ExternalLink size={10} />
        </a>
      </div>

      <p className="mt-6 text-[11px] text-rh-faint text-center tracking-wider">
        Custom packages available · Invoiced via Stripe or e-transfer · Contact{' '}
        <a href={`mailto:${siteConfig.contactEmail}`} className="text-gold hover:underline">
          {siteConfig.contactEmail}
        </a>
      </p>
    </section>
  )
}
