'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DOC_FEE, DEFAULT_RATE, DEFAULT_TERM } from '@/lib/motors/payments'

const TERMS = [36, 48, 60, 72, 84]

const RATE_TIERS = [
  { label: 'Prime (4.99%)',       rate: 0.0499 },
  { label: 'Near-Prime (7.99%)',  rate: DEFAULT_RATE },
  { label: 'Sub-Prime (9.99%)',   rate: 0.0999 },
  { label: 'Sub-Prime (14.99%)',  rate: 0.1499 },
  { label: 'Sub-Prime (19.99%)',  rate: 0.1999 },
]

function fmtCAD(n: number) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency', currency: 'CAD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n)
}

function calcPayments(price: number, down: number, termMonths: number, annualRate: number) {
  const principal = price + DOC_FEE - down
  if (principal <= 0) return { monthly: 0, biweekly: 0 }
  if (annualRate === 0) {
    const monthly = principal / termMonths
    return { monthly, biweekly: (monthly * 12) / 26 }
  }
  const r = annualRate / 12
  const monthly = (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1)
  return { monthly, biweekly: (monthly * 12) / 26 }
}

interface Props {
  price:         number
  vin:           string
  vehicleLabel?: string
}

export default function PaymentEstimator({ price, vin, vehicleLabel }: Props) {
  const maxDown     = Math.floor(price * 0.5)
  const defaultDown = Math.min(Math.floor(price * 0.1), maxDown)

  const [down,    setDown]    = useState(defaultDown)
  const [term,    setTerm]    = useState(DEFAULT_TERM)
  const [rateIdx, setRateIdx] = useState(1)

  const { monthly, biweekly } = calcPayments(price, down, term, RATE_TIERS[rateIdx].rate)

  const creditHref = vehicleLabel
    ? `/motors/credit?vin=${encodeURIComponent(vin)}&v=${encodeURIComponent(vehicleLabel)}`
    : `/motors/credit?vin=${encodeURIComponent(vin)}`

  return (
    <div className="bg-[#111111] border border-white/10 rounded-xl p-5 space-y-5">
      <h2 className="text-white font-semibold text-base tracking-wide">Estimate Your Payment</h2>

      {/* Down Payment slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-white/50 text-xs font-medium uppercase tracking-wider">Down Payment</label>
          <span className="text-white text-sm font-semibold tabular-nums">{fmtCAD(down)} CAD</span>
        </div>
        <input
          type="range"
          min={0}
          max={maxDown}
          step={500}
          value={down}
          onChange={e => setDown(Number(e.target.value))}
          className="w-full h-1.5 rounded-full cursor-pointer accent-white"
        />
        <div className="flex justify-between text-white/25 text-xs tabular-nums">
          <span>$0</span>
          <span>{fmtCAD(maxDown)}</span>
        </div>
      </div>

      {/* Term buttons */}
      <div className="space-y-2">
        <label className="text-white/50 text-xs font-medium uppercase tracking-wider block">Term</label>
        <div className="flex gap-1.5 flex-wrap">
          {TERMS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTerm(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                t === term
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {t}mo
            </button>
          ))}
        </div>
      </div>

      {/* Rate tier */}
      <div className="space-y-2">
        <label className="text-white/50 text-xs font-medium uppercase tracking-wider block">Rate Tier</label>
        <div className="relative">
          <select
            value={rateIdx}
            onChange={e => setRateIdx(Number(e.target.value))}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-white/30 cursor-pointer"
          >
            {RATE_TIERS.map((tier, i) => (
              <option key={i} value={i}>{tier.label}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Output */}
      <div className="bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-4 text-center space-y-1">
        <p className="text-white text-3xl font-bold tabular-nums">
          ~{fmtCAD(biweekly)}
          <span className="text-white/50 text-base font-normal"> / bi-weekly</span>
        </p>
        <p className="text-white/45 text-sm tabular-nums">~{fmtCAD(monthly)} / month</p>
      </div>

      {/* Disclaimer */}
      <p className="text-white/25 text-[11px] leading-relaxed">
        Estimated only. Includes estimated doc fee of {fmtCAD(DOC_FEE)}. Actual rate determined
        by lender based on credit profile, down payment, and vehicle. Prices exclude taxes &amp; licensing.
      </p>

      {/* CTA */}
      <Link
        href={creditHref}
        className="block w-full bg-white text-black font-semibold text-sm py-3 rounded-xl hover:bg-white/90 transition-colors text-center"
      >
        Get Pre-Qualified →
      </Link>
    </div>
  )
}
