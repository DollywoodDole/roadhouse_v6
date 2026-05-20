'use client'

import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 15 }, (_, i) => CURRENT_YEAR - i)

const PRICE_OPTIONS = [
  { label: 'Under $20k',   value: '0-20000'      },
  { label: '$20k – $35k',  value: '20000-35000'   },
  { label: '$35k – $50k',  value: '35000-50000'   },
  { label: '$50k – $70k',  value: '50000-70000'   },
  { label: '$70k+',        value: '70000-999999'  },
]

const SORT_OPTIONS = [
  { label: 'Recently added',       value: 'newest'      },
  { label: 'Price: low to high',   value: 'price_asc'   },
  { label: 'Price: high to low',   value: 'price_desc'  },
  { label: 'Year: newest first',   value: 'year_desc'   },
  { label: 'Year: oldest first',   value: 'year_asc'    },
  { label: 'Kilometres: low',      value: 'km_asc'      },
]

// All params treated as filters (sort excluded — clearing filters preserves sort)
const FILTER_PARAMS = [
  'search', 'make', 'model', 'year_min', 'year_max', 'price',
  'status', 'body_type', 'fuel_type', 'transmission', 'km_min', 'km_max',
]

const inputClass =
  'w-full bg-white border border-gray-200 text-gray-800 text-base rounded-lg ' +
  'px-3.5 py-3 focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400'

const selectClass =
  'w-full bg-white border border-gray-200 text-gray-800 text-base rounded-lg ' +
  'px-3.5 py-3 focus:outline-none focus:border-gray-400 transition-colors appearance-none cursor-pointer'

const labelClass = 'block text-gray-400 text-xs font-medium uppercase tracking-wider mb-1.5'

// Thumb styling for native range inputs
const rangeClass =
  'w-full h-1 cursor-pointer appearance-none bg-transparent ' +
  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 ' +
  '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-900 [&::-webkit-slider-thumb]:cursor-grab ' +
  '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full ' +
  '[&::-moz-range-thumb]:bg-gray-900 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-grab'

const ChevronDown = () => (
  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

interface FilterSidebarProps {
  vehicleCount: number
  makes: string[]
  bodyStyles: string[]
  fuelTypes: string[]
  transmissions: string[]
  mileageMax: number
  // Options available in the current filtered result set — used to grey-out impossible choices
  availableBodyStyles: string[]
  availableFuelTypes: string[]
  availableTransmissions: string[]
}

function ChipGroup({
  options,
  param,
  available,
}: {
  options: string[]
  param: string
  available: string[]
}) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const active = params.get(param) ?? ''

  const toggle = (val: string) => {
    const next = new URLSearchParams(params.toString())
    if (active === val) next.delete(param)
    else next.set(param, val)
    router.push(`${pathname}?${next.toString()}`, { scroll: false })
  }

  if (options.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5" role="group">
      {options.map((opt) => {
        const isActive = active === opt
        const isAvailable = available.includes(opt)
        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            aria-pressed={isActive}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              isActive
                ? 'bg-gray-900 text-white border-gray-900'
                : isAvailable
                ? 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                : 'bg-white text-gray-300 border-gray-100 cursor-pointer'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export default function FilterSidebar({
  vehicleCount,
  makes,
  bodyStyles,
  fuelTypes,
  transmissions,
  mileageMax,
  availableBodyStyles,
  availableFuelTypes,
  availableTransmissions,
}: FilterSidebarProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchVal, setSearchVal] = useState(params.get('search') ?? '')
  const [modelVal, setModelVal]   = useState(params.get('model') ?? '')
  const [kmMinVal, setKmMinVal]   = useState(Number(params.get('km_min') ?? 0))
  const [kmMaxVal, setKmMaxVal]   = useState(Number(params.get('km_max') ?? mileageMax))
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const kmDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeFilterCount = FILTER_PARAMS.filter((k) => params.get(k)).length

  const push = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      router.push(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [router, pathname, params]
  )

  const pushDebounced = useCallback(
    (key: string, value: string, ms = 300) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => push(key, value), ms)
    },
    [push]
  )

  const pushKmDebounced = useCallback(
    (min: number, max: number) => {
      if (kmDebounceRef.current) clearTimeout(kmDebounceRef.current)
      kmDebounceRef.current = setTimeout(() => {
        const next = new URLSearchParams(params.toString())
        if (min > 0) next.set('km_min', String(min))
        else next.delete('km_min')
        if (max < mileageMax) next.set('km_max', String(max))
        else next.delete('km_max')
        router.push(`${pathname}?${next.toString()}`, { scroll: false })
      }, 200)
    },
    [params, router, pathname, mileageMax]
  )

  const clearAll = () => {
    setSearchVal('')
    setModelVal('')
    setKmMinVal(0)
    setKmMaxVal(mileageMax)
    const sort = params.get('sort')
    router.push(sort ? `${pathname}?sort=${sort}` : pathname, { scroll: false })
  }

  const hasFilters = FILTER_PARAMS.some((k) => params.get(k))

  const body = (
    <div className="flex flex-col gap-5">
      {/* Sort */}
      <div>
        <label htmlFor="sort-select" className={labelClass}>Sort by</label>
        <div className="relative">
          <select
            id="sort-select"
            value={params.get('sort') ?? 'newest'}
            onChange={(e) => push('sort', e.target.value === 'newest' ? '' : e.target.value)}
            className={selectClass}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <ChevronDown />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Count */}
      <p className="text-gray-400 text-xs uppercase tracking-wider">
        {vehicleCount} {vehicleCount === 1 ? 'vehicle' : 'vehicles'} found
      </p>

      {/* Keyword search */}
      <div>
        <label htmlFor="search-input" className={labelClass}>Search</label>
        <input
          id="search-input"
          type="search"
          placeholder="Year, make, model, colour…"
          value={searchVal}
          onChange={(e) => {
            setSearchVal(e.target.value)
            pushDebounced('search', e.target.value)
          }}
          className={inputClass}
        />
      </div>

      {/* Make */}
      <div>
        <label htmlFor="make-select" className={labelClass}>Make</label>
        <div className="relative">
          <select
            id="make-select"
            value={params.get('make') ?? ''}
            onChange={(e) => push('make', e.target.value)}
            className={selectClass}
          >
            <option value="">All Makes</option>
            {makes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <ChevronDown />
          </div>
        </div>
      </div>

      {/* Model */}
      <div>
        <label htmlFor="model-input" className={labelClass}>Model</label>
        <input
          id="model-input"
          type="text"
          placeholder="e.g. F-150, RAV4…"
          value={modelVal}
          onChange={(e) => {
            setModelVal(e.target.value)
            pushDebounced('model', e.target.value)
          }}
          className={inputClass}
        />
      </div>

      {/* Body type chips */}
      {bodyStyles.length > 0 && (
        <div>
          <p className={labelClass} id="body-type-label">Body Type</p>
          <div aria-labelledby="body-type-label">
            <ChipGroup options={bodyStyles} param="body_type" available={availableBodyStyles} />
          </div>
        </div>
      )}

      {/* Year range */}
      <div>
        <p className={labelClass}>Year</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <label htmlFor="year-min" className="sr-only">Year from</label>
            <select
              id="year-min"
              value={params.get('year_min') ?? ''}
              onChange={(e) => push('year_min', e.target.value)}
              className={selectClass}
            >
              <option value="">From</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <ChevronDown />
            </div>
          </div>
          <div className="relative">
            <label htmlFor="year-max" className="sr-only">Year to</label>
            <select
              id="year-max"
              value={params.get('year_max') ?? ''}
              onChange={(e) => push('year_max', e.target.value)}
              className={selectClass}
            >
              <option value="">To</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <ChevronDown />
            </div>
          </div>
        </div>
      </div>

      {/* Price */}
      <div>
        <label htmlFor="price-select" className={labelClass}>Price Range</label>
        <div className="relative">
          <select
            id="price-select"
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

      {/* Mileage range — dual native range inputs */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className={labelClass + ' mb-0'}>Kilometres</p>
          <p className="text-gray-400 text-xs">
            {kmMinVal > 0 ? `${kmMinVal.toLocaleString('en-CA')}` : '0'}
            {' – '}
            {kmMaxVal < mileageMax ? `${kmMaxVal.toLocaleString('en-CA')}` : `${mileageMax.toLocaleString('en-CA')}+`}
          </p>
        </div>
        <div className="relative h-6 flex items-center" aria-label="Kilometre range slider">
          {/* Track background */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full" />
          {/* Active track fill */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-1 bg-gray-700 rounded-full"
            style={{
              left: `${(kmMinVal / mileageMax) * 100}%`,
              right: `${100 - (kmMaxVal / mileageMax) * 100}%`,
            }}
          />
          {/* Min handle */}
          <input
            type="range"
            min={0}
            max={mileageMax}
            step={5000}
            value={kmMinVal}
            aria-label="Minimum kilometres"
            onChange={(e) => {
              const val = Math.min(Number(e.target.value), kmMaxVal - 5000)
              setKmMinVal(val)
              pushKmDebounced(val, kmMaxVal)
            }}
            className={`absolute inset-x-0 ${rangeClass}`}
            style={{ zIndex: kmMinVal > mileageMax * 0.9 ? 5 : 3 }}
          />
          {/* Max handle */}
          <input
            type="range"
            min={0}
            max={mileageMax}
            step={5000}
            value={kmMaxVal}
            aria-label="Maximum kilometres"
            onChange={(e) => {
              const val = Math.max(Number(e.target.value), kmMinVal + 5000)
              setKmMaxVal(val)
              pushKmDebounced(kmMinVal, val)
            }}
            className={`absolute inset-x-0 ${rangeClass}`}
            style={{ zIndex: 4 }}
          />
        </div>
      </div>

      {/* Fuel type chips */}
      {fuelTypes.length > 0 && (
        <div>
          <p className={labelClass} id="fuel-type-label">Fuel Type</p>
          <div aria-labelledby="fuel-type-label">
            <ChipGroup options={fuelTypes} param="fuel_type" available={availableFuelTypes} />
          </div>
        </div>
      )}

      {/* Transmission chips */}
      {transmissions.length > 0 && (
        <div>
          <p className={labelClass} id="transmission-label">Transmission</p>
          <div aria-labelledby="transmission-label">
            <ChipGroup options={transmissions} param="transmission" available={availableTransmissions} />
          </div>
        </div>
      )}

      {/* Status */}
      <div>
        <label htmlFor="status-select" className={labelClass}>Status</label>
        <div className="relative">
          <select
            id="status-select"
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
        Get Pre-Qualified
      </Link>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <div className="md:hidden mb-5">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 border border-white/[0.12] rounded-lg px-4 py-2.5 text-white/70 hover:text-white hover:border-white/25 transition-colors text-sm"
          aria-expanded={mobileOpen}
          aria-controls="filter-drawer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h18M7 12h10M11 20h2" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-white/20 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-60 shrink-0">
        <div className="sticky top-24 bg-white rounded-xl p-5 shadow-sm max-h-[calc(100vh-7rem)] overflow-y-auto">
          {body}
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/70 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside
            id="filter-drawer"
            className="fixed inset-y-0 left-0 w-72 bg-white z-50 overflow-y-auto p-6 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-800 text-sm font-medium">
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-gray-900 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close filters"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
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
