import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Application Received | RoadHouse Motors',
  description: 'Your credit application has been received. We\'ll be in touch within one business day.',
  robots: { index: false, follow: false },
}

const steps = [
  {
    number: '01',
    heading: 'Application reviewed',
    body: 'Our finance team goes through every application personally — no automated rejections.',
  },
  {
    number: '02',
    heading: 'We call you',
    body: 'Expect a call within one business day to discuss your options and next steps.',
  },
  {
    number: '03',
    heading: 'Drive away',
    body: 'We work with all credit situations. Our job is to get you into the right vehicle.',
  },
]

export default function ThankYouPage() {
  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#0A0A0A] flex flex-col items-center justify-center px-4 py-20">

      {/* Check mark */}
      <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-8">
        <svg className="w-7 h-7 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Heading */}
      <h1 className="text-4xl sm:text-5xl font-light text-white tracking-tight text-center mb-4">
        Application Received
      </h1>
      <p className="text-white/50 text-base text-center max-w-md leading-relaxed mb-16">
        We&apos;ll review your information and reach out within one business day.
        If you need to speak with someone sooner, call us directly.
      </p>

      {/* Phone CTA */}
      <a
        href="tel:+13063818222"
        className="flex items-center gap-3 border border-white/10 rounded-xl px-6 py-4 text-white/70 hover:text-white hover:border-white/25 transition-colors mb-16"
      >
        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
        </svg>
        <span className="text-sm font-medium tracking-wide">(306) 381-8222</span>
      </a>

      {/* What happens next */}
      <div className="w-full max-w-2xl mb-16">
        <p className="text-white/30 text-xs uppercase tracking-widest text-center mb-8">What happens next</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden">
          {steps.map((step) => (
            <div key={step.number} className="bg-[#0A0A0A] p-6">
              <span className="text-white/20 text-xs font-mono tracking-widest block mb-3">{step.number}</span>
              <h3 className="text-white text-sm font-medium mb-2">{step.heading}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Back to inventory */}
      <Link
        href="/motors/inventory"
        className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Browse inventory
      </Link>

    </div>
  )
}
