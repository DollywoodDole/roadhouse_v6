'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { clsx } from 'clsx'

const MAKES = ['Ford', 'RAM', 'Chevrolet', 'Toyota', 'Jeep', 'Hyundai']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i)

const PRICE_OPTIONS = [
  { label: 'Under $30k',   value: '0-30000'   },
  { label: '$30k – $50k',  value: '30000-50000' },
  { label: '$50k – $70k',  value: '50000-70000' },
  { label: '$70k+',        value: '70000-999999' },
]

const selectClass = clsx(
  'bg-[#1A1A1A] border border-white/10 text-white/70 text-sm rounded-lg px-3 py-2',
  'focus:outline-none focus:border-white/30 focus:text-white transition-colors',
  'appearance-none cursor-pointer hover:border-white/20'
)

export default function FilterBar() {
  const router     = useRouter()
  const pathname   = usePathname()
  const params     = useSearchParams()

  const push = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString())
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      router.push(`${pathname}?${next.toString()}`)
    },
    [router, pathname, params]
  )

  const clearAll = () => router.push(pathname)

  const hasFilters =
    params.get('make') ||
    params.get('price') ||
    params.get('year_min') ||
    params.get('status')

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Make */}
      <select
        value={params.get('make') ?? ''}
        onChange={(e) => push('make', e.target.value)}
        className={selectClass}
        aria-label="Filter by make"
      >
        <option value="">All Makes</option>
        {MAKES.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      {/* Year */}
      <select
        value={params.get('year_min') ?? ''}
        onChange={(e) => push('year_min', e.target.value)}
        className={selectClass}
        aria-label="Filter by year"
      >
        <option value="">All Years</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>{y}+</option>
        ))}
      </select>

      {/* Price range */}
      <select
        value={params.get('price') ?? ''}
        onChange={(e) => push('price', e.target.value)}
        className={selectClass}
        aria-label="Filter by price"
      >
        <option value="">All Prices</option>
        {PRICE_OPTIONS.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>

      {/* Status */}
      <select
        value={params.get('status') ?? ''}
        onChange={(e) => push('status', e.target.value)}
        className={selectClass}
        aria-label="Filter by status"
      >
        <option value="">All Status</option>
        <option value="available">Available</option>
        <option value="pending">Pending</option>
        <option value="sold">Sold</option>
      </select>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-white/40 text-sm hover:text-white/70 transition-colors underline underline-offset-2"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
