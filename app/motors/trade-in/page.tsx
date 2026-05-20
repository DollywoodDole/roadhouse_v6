import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import TradeInForm from '@/components/motors/TradeInForm'

const BASE      = 'https://motors.roadhouse.capital'
const OG_IMAGE  = `${BASE}/motors/rh-motors-header.jpg`

export const metadata: Metadata = {
  title: 'Value Your Trade-In | RoadHouse Motors Saskatchewan',
  description:
    "Tell us about your vehicle and we'll send you a real appraisal within 24 hours. No obligation. Saskatchewan-wide.",
  alternates: { canonical: `${BASE}/trade-in` },
  openGraph: {
    title: 'Value Your Trade-In | RoadHouse Motors Saskatchewan',
    description:
      "Tell us about your vehicle and we'll send you a real appraisal within 24 hours. No obligation. Saskatchewan-wide.",
    url:      `${BASE}/trade-in`,
    siteName: 'RoadHouse Motors',
    images: [{ url: OG_IMAGE, width: 2560, height: 1440, alt: 'RoadHouse Motors' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Value Your Trade-In | RoadHouse Motors Saskatchewan',
    description: "Tell us about your vehicle and we'll send you a real appraisal within 24 hours. No obligation. Saskatchewan-wide.",
    images:      [OG_IMAGE],
  },
}

const faqItems = [
  {
    q: 'Do you take vehicles with liens or outstanding loans?',
    a: "Yes. If you still owe on your vehicle, we can work with your lender to pay out the balance. If the payout is higher than our appraised value, the difference becomes part of your new deal — we'll walk you through the numbers clearly before anything is signed.",
  },
  {
    q: "Do I have to buy a vehicle from you to trade in?",
    a: "No. We'll appraise your vehicle regardless of whether you're buying. If the number works for you and you want to move it, we can make that happen independently of any purchase.",
  },
  {
    q: "What if I owe more than my vehicle is worth?",
    a: "That's called being upside-down, and it's more common than people think. We'll tell you exactly where you stand. There are options — rolling the difference into a new deal is one of them — and we'll explain each clearly without pressure.",
  },
  {
    q: 'Do you take high-mileage or older vehicles?',
    a: "Submit it and let us have a look. High mileage and age aren't automatic disqualifiers — condition, market demand, and the specific vehicle matter more than the odometer alone.",
  },
  {
    q: 'Do you take ATVs, SBSs, or other powersports?',
    a: "Yes. We consider ATVs, side-by-sides, and other powersports on a case-by-case basis. Include the details in the form and we'll get back to you.",
  },
]

const faqJsonLd = {
  '@context':  'https://schema.org',
  '@type':     'FAQPage',
  mainEntity: faqItems.map(({ q, a }) => ({
    '@type': 'Question',
    name:    q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Tell us about your vehicle',
    desc:  'Fill out the form below — year, make, model, mileage, and condition. No photos required.',
  },
  {
    step: '02',
    title: 'We review and text you back',
    desc:  "A real person looks at your submission and sends you an honest appraisal number — within 24 hours.",
  },
  {
    step: '03',
    title: 'Bring it in or we come to you',
    desc:  "If the number works, we'll arrange the rest. Saskatchewan-wide. No obligation to proceed.",
  },
]

export default function TradeInPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <div className="space-y-3 max-w-2xl">
          <p className="text-white/30 text-xs font-semibold tracking-widest uppercase">
            Trade-In Appraisal
          </p>
          <h1 className="text-white text-3xl sm:text-4xl font-bold leading-tight">
            What&rsquo;s your vehicle worth?
          </h1>
          <p className="text-white/55 text-lg leading-relaxed">
            Real appraisal from a real human within 24 hours. No obligation.
            No instant computer estimate — just a straight number from someone
            who knows Saskatchewan vehicles.
          </p>
        </div>

        {/* ── Form + sidebar ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 items-start">

          {/* Form */}
          <Suspense fallback={null}>
            <TradeInForm />
          </Suspense>

          {/* Sidebar — sticky on desktop */}
          <div className="hidden lg:block space-y-6 lg:sticky lg:top-24">

            {/* How it works */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 space-y-6">
              <h2 className="text-white/35 text-xs font-semibold tracking-widest uppercase">
                How It Works
              </h2>
              {HOW_IT_WORKS.map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <span className="text-amber-500/60 font-mono text-xs font-bold mt-0.5 shrink-0 w-6">
                    {step}
                  </span>
                  <div>
                    <p className="text-white/80 text-sm font-semibold">{title}</p>
                    <p className="text-white/40 text-sm leading-relaxed mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust signals */}
            <div className="space-y-3">
              {[
                'No instant estimate — actual human review',
                'No obligation to buy or sell',
                'Works with liens and financing',
                'Powersports and ATVs welcome',
                'Saskatchewan-wide',
              ].map(line => (
                <div key={line} className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-amber-500/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-white/50 text-sm">{line}</span>
                </div>
              ))}
            </div>

            {/* Call CTA */}
            <a
              href="tel:+13063818222"
              className="flex items-center gap-3 text-white/45 hover:text-white/70 text-sm transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              Prefer to call? (306) 381-8222
            </a>
          </div>
        </div>

        {/* ── How it works strip — mobile only ────────────────────────── */}
        <div className="lg:hidden border-t border-white/[0.06] pt-10">
          <h2 className="text-white/35 text-xs font-semibold tracking-widest uppercase mb-8">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="space-y-2">
                <span className="text-amber-500/60 font-mono text-xs font-bold">{step}</span>
                <p className="text-white/80 text-sm font-semibold">{title}</p>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <div className="border-t border-white/[0.06] pt-12 space-y-8 max-w-3xl">
          <h2 className="text-white text-xl font-semibold">Common Questions</h2>
          <div className="space-y-6">
            {faqItems.map(({ q, a }) => (
              <div key={q} className="space-y-2">
                <h3 className="text-white/85 text-base font-semibold">{q}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer nav ──────────────────────────────────────────────── */}
        <div className="border-t border-white/[0.06] pt-8 flex flex-wrap gap-6">
          <Link
            href="/motors/inventory"
            className="inline-flex items-center gap-2 text-white/35 hover:text-white/65 text-sm transition-colors"
          >
            <span aria-hidden>←</span> Browse Inventory
          </Link>
          <Link
            href="/motors/credit"
            className="inline-flex items-center gap-2 text-white/35 hover:text-white/65 text-sm transition-colors"
          >
            Get Pre-Qualified →
          </Link>
        </div>

        {/* FCAA disclaimer */}
        <p className="text-white/20 text-xs">
          DL#331386 | Prices exclude taxes &amp; licensing.
        </p>
      </div>
    </>
  )
}
