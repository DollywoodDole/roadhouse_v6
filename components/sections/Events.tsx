'use client'

import { siteConfig } from '@/lib/site-config'

import { useState } from 'react'
import { Loader2, Calendar, MapPin, ExternalLink } from 'lucide-react'

const EVENTS = [
  {
    id: 'stream-marathon-q2',
    name: 'Q2 Stream Marathon',
    type: 'Online · Kick',
    date: 'June 2026',
    location: 'kick.com/dollywooddole',
    price: 0,
    display: 'Free',
    desc: '24-hour community stream event. Live Q&A, synthesis sessions, DAO community vote showcase. All tiers welcome.',
    status: 'upcoming',
    badge: 'Free',
    priceId: null,
  },
  {
    id: 'sk-meetup-2026',
    name: 'Saskatchewan Meetup',
    type: 'In-Person · Saskatoon',
    date: 'July 2026',
    location: 'Saskatoon, SK',
    price: 2500,
    display: '$25 CAD',
    desc: 'First in-person RoadHouse community gathering. Drinks, synthesizers, and good conversation. Members only.',
    status: 'upcoming',
    badge: 'Members',
    priceId: siteConfig.stripe.events.skMeetup,
  },
  {
    id: 'rh-summit-2026',
    name: 'RoadHouse Summit',
    type: 'In-Person · TBA',
    date: 'Q4 2026',
    location: 'Location TBA',
    price: 9900,
    display: '$99 CAD',
    desc: 'Full-day summit: panels, workshops, guild introductions, investor presentations, and Coconut Cowboy bar service.',
    status: 'early-access',
    badge: 'Early Access',
    priceId: siteConfig.stripe.events.summit,
  },
  {
    id: 'compound-opening',
    name: 'Compound Opening Event',
    type: 'In-Person · Saskatchewan',
    date: 'Year 2 — 2027',
    location: 'Saskatchewan (TBA)',
    price: 0,
    display: 'TBA',
    desc: 'The grand opening of the physical RoadHouse compound. Frontier Guild milestone event. Steward+ priority access.',
    status: 'announced',
    badge: 'Announced',
    priceId: null,
  },
]

async function buyTicket(priceId: string, eventName: string) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, metadata: { event: eventName, type: 'event-ticket' } }),
  })
  const data = await res.json()
  if (data.url) window.location.href = data.url
  else alert('Checkout error. Please try again.')
}

const statusColors: Record<string, string> = {
  upcoming: 'text-green-400 border-green-400/30 bg-green-400/5',
  'early-access': 'text-gold border-gold/30 bg-gold/5',
  announced: 'text-rh-muted border-rh-border',
}

export default function Events() {
  const [loading, setLoading] = useState<string | null>(null)

  const buy = async (event: typeof EVENTS[0]) => {
    if (!event.priceId) return
    setLoading(event.id)
    try {
      await buyTicket(event.priceId, event.name)
    } finally {
      setLoading(null)
    }
  }

  return (
    <section id="events" className="px-8 lg:px-16 py-20 border-t border-rh-border">
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Frontier Guild — Events & Gatherings</div>
        <h2 className="text-4xl lg:text-5xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Upcoming <span className="text-gold">Events</span>
        </h2>
        <p className="text-rh-muted text-sm mt-3 max-w-xl tracking-wide">
          Online streams, Saskatchewan meetups, and the compound opening. Real-world infrastructure for a real community.
        </p>
        <div className="gold-line mt-4 max-w-xs" />
      </div>

      <div className="space-y-4">
        {EVENTS.map(event => (
          <div
            key={event.id}
            className="bg-rh-card border border-rh-border rounded-lg p-6 card-glow flex flex-col md:flex-row md:items-center gap-6"
          >
            {/* Date column */}
            <div className="md:w-28 shrink-0 text-center md:text-left">
              <div className="text-[10px] tracking-widest uppercase text-rh-faint mb-1">
                <Calendar size={10} className="inline mr-1" />
                Date
              </div>
              <div
                className="text-xl font-light text-gold"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                {event.date}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-lg font-medium text-rh-text tracking-wide">{event.name}</h3>
                <span className={`px-2 py-0.5 text-[9px] tracking-widest uppercase border rounded ${statusColors[event.status]}`}>
                  {event.badge}
                </span>
              </div>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-[10px] tracking-wider text-gold-dark">{event.type}</span>
                <span className="text-[10px] text-rh-faint flex items-center gap-1">
                  <MapPin size={9} />
                  {event.location}
                </span>
              </div>
              <p className="text-[11px] text-rh-muted leading-relaxed">{event.desc}</p>
            </div>

            {/* CTA */}
            <div className="md:w-36 shrink-0 flex flex-col items-start md:items-end gap-2">
              <div
                className="text-2xl font-light text-gold"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                {event.display}
              </div>
              {event.priceId ? (
                <button
                  onClick={() => buy(event)}
                  disabled={loading === event.id}
                  className="stripe-btn w-full py-2 text-rh-black text-[10px] tracking-widest uppercase font-medium rounded flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {loading === event.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    'Get Ticket'
                  )}
                </button>
              ) : event.price === 0 && event.status === 'upcoming' ? (
                <a
                  href="https://kick.com/dollywooddole"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 text-center text-[10px] tracking-widest uppercase border border-green-400/30 text-green-400 hover:bg-green-400/5 rounded transition-colors flex items-center justify-center gap-1"
                >
                  Watch Free <ExternalLink size={9} />
                </a>
              ) : (
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="w-full py-2 text-center text-[10px] tracking-widest uppercase border border-rh-border text-rh-muted hover:border-gold/30 hover:text-gold rounded transition-colors"
                >
                  Notify Me
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[11px] text-rh-faint text-center tracking-wider">
        Tickets via Stripe · Prices CAD · Refundable up to 48 hrs before event
      </p>
    </section>
  )
}
