'use client'

import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'

const MAKES = [
  'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Ford', 'GMC',
  'Honda', 'Hyundai', 'Jeep', 'Kia', 'Lincoln', 'Mazda', 'Mitsubishi',
  'Nissan', 'RAM', 'Subaru', 'Toyota', 'Volkswagen',
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 15 }, (_, i) => CURRENT_YEAR - i)

const PRICE_OPTIONS = [
  { label: 'Under $20k',    value: '0-20000'     },
  { label: '$20k – $35k',   value: '20000-35000'  },
  { label: '$35k – $50k',   value: '35000-50000'  },
  { label: '$50k – $70k',   value: '50000-70000'  },
  { label: '$70k+',         value: '70000-999999'  },
]

const inputClass =
  'w-full bg-white border border-gray-200 text-gray-800 text-base rounded-lg ' +
  'px-3.5 py-3 focus:outline-none focus:border-gray-400 ' +
  'transition-colors placeholder:text-gray-400'

const selectClass =
  'w-full bg-white border border-gray-200 text-gray-800 text-base rounded-lg ' +
  'px-3.5 py-3 focus:outline-none focus:border-gray-400 ' +
  'transition-colors appearance-none cursor-pointer'

const labelClass = 'block text-gray-400 text-xs font-medium uppercase tracking-wider mb-1.5'

const ChevronDown = () => (
  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

interface FilterSidebarProps {
  vehicleCount: number
}

export default function FilterSidebar({ vehicleCount }: FilterSidebarProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)

  const push = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      router.push(`${pathname}?${next.toString()}`)
    },
    [router, pathname, params]
  )

  const clearAll = () => router.push(pathname)

  const hasFilters =
    params.get('search') ||
    params.get('make') ||
    params.get('price') ||
    params.get('year_min') ||
    params.get('status')

  const body = (
    <div className="flex flex-col gap-5">
      <p className="text-gray-400 text-xs uppercase tracking-wider">
        {vehicleCount} {vehicleCount === 1 ? 'vehicle' : 'vehicles'} found
      </p>

      {/* Search */}
      <div>
        <label className={labelClass}>Search</label>
        <input
          type="search"
          placeholder="Year, make, model, colour…"
          defaultValue={params.get('search') ?? ''}
          onChange={(e) => push('search', e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Make */}
      <div>
        <label className={labelClass}>Make</label>
        <div className="relative">
          <select
            value={params.get('make') ?? ''}
            onChange={(e) => push('make', e.target.value)}
            className={selectClass}
          >
            <option value="">All Makes</option>
            {MAKES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <ChevronDown />
          </div>
        </div>
      </div>

      {/* Year */}
      <div>
        <label className={labelClass}>Year (from)</label>
        <div className="relative">
          <select
            value={params.get('year_min') ?? ''}
            onChange={(e) => push('year_min', e.target.value)}
            className={selectClass}
          >
            <option value="">All Years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}+</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <ChevronDown />
          </div>
        </div>
      </div>

      {/* Price */}
      <div>
        <label className={labelClass}>Price Range</label>
        <div className="relative">
          <select
            value={params.get('price') ?? ''}
            onChange={(e) => push('price', e.target.value)}
            className={selectClass}
          >
            <option value="">Any Price</option>
            {PRICE_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <ChevronDown />
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <label className={labelClass}>Status</label>
        <div className="relative">
          <select
            value={params.get('status') ?? ''}
            onChange={(e) => push('status', e.target.value)}
            className={selectClass}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="pending">Pending</option>
            <option value="sold">Sold</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <ChevronDown />
          </div>
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-gray-400 text-xs uppercase tracking-wider hover:text-gray-600 transition-colors text-left"
        >
          Clear all filters
        </button>
      )}

      <div className="border-t border-gray-100" />

      <Link
        href="/motors/credit"
        className="block w-full bg-gray-900 text-white text-sm font-semibold tracking-wider uppercase px-4 py-3.5 rounded text-center hover:bg-gray-700 transition-colors"
      >
        Apply for Credit
      </Link>
    </div>
  )

  return (
    <>
      {/* Mobile toggle — styled for the dark inventory section it lives in */}
      <div className="md:hidden mb-5">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 border border-white/[0.12] rounded-lg px-4 py-2.5 text-white/70 hover:text-white hover:border-white/25 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h18M7 12h10M11 20h2" />
          </svg>
          Filters
          {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-white/50 ml-0.5" />}
        </button>
      </div>

      {/* Desktop sidebar — white panel in dark inventory section */}
      <aside className="hidden md:block w-60 shrink-0">
        <div className="sticky top-24 bg-white rounded-xl p-5 shadow-sm">
          {body}
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-white z-50 overflow-y-auto p-6 md:hidden">
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-800 text-sm font-medium">Filters</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close filters"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {body}
          </aside>
        </>
      )}
    </>
  )
}
