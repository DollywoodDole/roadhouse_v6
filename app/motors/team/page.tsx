import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { TEAM } from '@/lib/motors/team'

const BASE = 'https://motors.roadhouse.capital'

export const metadata: Metadata = {
  title: 'Meet RoadHouse Motors | Founded by Dalton Ellscheid',
  description:
    'I grew up on Saskatchewan roads. RoadHouse Motors is built for the kind of life people actually live out here.',
  alternates: { canonical: `${BASE}/team` },
  openGraph: {
    title: 'Meet RoadHouse Motors | Founded by Dalton Ellscheid',
    description:
      'I grew up on Saskatchewan roads. RoadHouse Motors is built for the kind of life people actually live out here.',
    url: `${BASE}/team`,
    siteName: 'RoadHouse Motors',
    images: [
      {
        url: `${BASE}/motors/rh-motors-header.jpg`,
        width: 2560,
        height: 1440,
        alt: 'RoadHouse Motors',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meet RoadHouse Motors | Founded by Dalton Ellscheid',
    description:
      'I grew up on Saskatchewan roads. RoadHouse Motors is built for the kind of life people actually live out here.',
    images: [`${BASE}/motors/rh-motors-header.jpg`],
  },
}


export default function TeamPage() {
  const featured = TEAM.filter((m) => m.featured).sort((a, b) => a.order - b.order)
  // Non-featured members — grid below. Currently empty; add members to TEAM[] in lib/motors/team.ts
  const rest = TEAM.filter((m) => !m.featured).sort((a, b) => a.order - b.order)

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Page header */}
      <div className="space-y-2">
        <h1 className="text-white text-3xl sm:text-4xl font-bold">Meet the Team</h1>
        <p className="text-white/40 text-base">Saskatchewan-born. Frontier-bred.</p>
      </div>

      {/* Featured members — 2-column hero layout */}
      {featured.map((member) => (
        <div
          key={member.slug}
          className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-start"
        >
          {/* Photo — left on desktop, top on mobile */}
          <div className="lg:col-span-2 max-w-sm w-full mx-auto lg:mx-0">
            <div className="aspect-[4/5] w-full relative overflow-hidden rounded-2xl">
              <Image
                src={member.photoUrl}
                alt={member.name}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 384px"
                priority
                unoptimized
              />
            </div>
          </div>

          {/* Bio — right on desktop */}
          <div className="lg:col-span-3 space-y-8">
            <div>
              <h2 className="text-white text-2xl sm:text-3xl font-bold">{member.name}</h2>
              <p className="text-white/45 text-base mt-1">{member.title}</p>
            </div>

            {/* Bio paragraphs */}
            <div className="space-y-5">
              {member.bio
                .trim()
                .split('\n\n')
                .map((para, i) => (
                  <p key={i} className="text-white/65 text-base leading-relaxed">
                    {para}
                  </p>
                ))}
            </div>

            {/* Pull quote — between bio and contact CTAs */}
            {member.pullQuote && (
              <blockquote className="border-l-2 border-amber-500/50 pl-6 py-1">
                <p className="text-amber-400/90 text-xl sm:text-2xl italic leading-snug font-serif">
                  &ldquo;{member.pullQuote}&rdquo;
                </p>
              </blockquote>
            )}

            {/* Contact CTAs */}
            {member.contact && (
              <div className="flex flex-wrap gap-3 pt-1">
                {member.contact.phone && (
                  <a
                    href={`tel:${member.contact.phone}`}
                    className="inline-flex items-center gap-2 bg-white text-black font-semibold text-sm px-5 py-3 rounded-lg hover:bg-white/90 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    (306) 381-8222
                  </a>
                )}
                {member.contact.email && (
                  <a
                    href={`mailto:${member.contact.email}`}
                    className="inline-flex items-center gap-2 border border-white/15 text-white font-medium text-sm px-5 py-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                      />
                    </svg>
                    Email Dalton
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* ── Non-featured team grid ──────────────────────────────────────────────
          Empty for now. Add non-featured members to TEAM[] in lib/motors/team.ts
          and they'll appear here automatically.
         ─────────────────────────────────────────────────────────────────────── */}
      {rest.length > 0 && (
        <div className="border-t border-white/[0.08] pt-12">
          <h2 className="text-white text-xl font-semibold mb-8">The Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((member) => (
              <div
                key={member.slug}
                className="bg-white/[0.03] border border-white/10 rounded-xl p-6 space-y-4"
              >
                <div className="w-14 h-14 rounded-full bg-white/[0.06] flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-white/20"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{member.name}</p>
                  <p className="text-white/45 text-xs mt-0.5">{member.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back to inventory */}
      <div className="border-t border-white/[0.08] pt-8">
        <Link
          href="/motors/inventory"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          <span aria-hidden>←</span> Browse Inventory
        </Link>
      </div>

      {/* FCAA disclaimer */}
      <p className="text-white/20 text-xs">
        DL#331386 | Prices exclude taxes &amp; licensing.
      </p>
    </div>
  )
}
