'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TradeInBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="flex items-center justify-between gap-4 bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-3.5 mb-8">
      <p className="text-white/60 text-sm">
        Have a vehicle to trade?{' '}
        <Link
          href="/motors/trade-in"
          className="text-amber-400 hover:text-amber-300 transition-colors underline underline-offset-2"
        >
          Get a real appraisal in 24 hours →
        </Link>
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 text-white/25 hover:text-white/60 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )
}
