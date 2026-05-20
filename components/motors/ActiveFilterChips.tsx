'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

// All URL params treated as filters (sort is excluded — it's not a filter)
const FILTER_PARAMS = [
  'search',
  'make',
  'model',
  'year_min',
  'year_max',
  'price',
  'status',
  'body_type',
  'fuel_type',
  'transmission',
  'km_min',
  'km_max',
] as const

type FilterParam = (typeof FILTER_PARAMS)[number]

const PARAM_LABEL: Record<FilterParam, (value: string) => string> = {
  search: (v) => `"${v}"`,
  make: (v) => v,
  model: (v) => `Model: ${v}`,
  year_min: (v) => `${v}+`,
  year_max: (v) => `Up to ${v}`,
  price: (v) => {
    const [min, max] = v.split('-').map(Number)
    if (max >= 999999) return `$${(min / 1000).toFixed(0)}k+`
    return `$${(min / 1000).toFixed(0)}k–$${(max / 1000).toFixed(0)}k`
  },
  status: (v) => v.charAt(0).toUpperCase() + v.slice(1),
  body_type: (v) => v,
  fuel_type: (v) => v,
  transmission: (v) => v,
  km_min: (v) => `${Number(v).toLocaleString('en-CA')}+ km`,
  km_max: (v) => `Under ${Number(v).toLocaleString('en-CA')} km`,
}

interface Props {
  count: number
}

export default function ActiveFilterChips({ count }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const chips = FILTER_PARAMS.map((key) => {
    const val = params.get(key)
    if (!val) return null
    return { key, label: PARAM_LABEL[key](val) }
  }).filter(Boolean) as { key: string; label: string }[]

  const remove = (key: string) => {
    const next = new URLSearchParams(params.toString())
    next.delete(key)
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const clearAll = () => {
    // Preserve sort param when clearing filters
    const sort = params.get('sort')
    router.push(sort ? `${pathname}?sort=${sort}` : pathname, { scroll: false })
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mb-5 min-h-[28px]">
      <p className="text-white/40 text-sm shrink-0">
        {count} {count === 1 ? 'vehicle' : 'vehicles'} found
      </p>

      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 bg-white/[0.06] border border-white/10 text-white/65 text-xs px-3 py-1.5 rounded-full"
        >
          {chip.label}
          <button
            onClick={() => remove(chip.key)}
            aria-label={`Remove ${chip.label} filter`}
            className="text-white/35 hover:text-white transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}

      {chips.length > 1 && (
        <button
          onClick={clearAll}
          className="text-white/25 hover:text-white/55 text-xs transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
