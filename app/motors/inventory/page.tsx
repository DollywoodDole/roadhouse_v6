import { Suspense } from 'react'
import { getInventory, seedInventory, getInventoryCount } from '@/lib/motors/storage'
import { SEED_VEHICLES, SEED_DEALER_ID } from '@/lib/motors/seed'
import InventoryGrid from '@/components/motors/InventoryGrid'
import FilterBar from '@/components/motors/FilterBar'
import type { InventoryFilters, VehicleStatus } from '@/types/inventory'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function parseFilters(sp: Record<string, string | string[] | undefined>): InventoryFilters {
  const filters: InventoryFilters = {}

  const make = sp['make']
  if (typeof make === 'string' && make) filters.make = make

  const yearMin = sp['year_min']
  if (typeof yearMin === 'string' && yearMin) filters.year_min = parseInt(yearMin, 10)

  const price = sp['price']
  if (typeof price === 'string' && price) {
    const [min, max] = price.split('-').map(Number)
    if (!isNaN(min)) filters.price_min = min
    if (!isNaN(max)) filters.price_max = max
  }

  const status = sp['status']
  if (typeof status === 'string' && status) {
    filters.status = status as VehicleStatus
  }

  return filters
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const sp = await searchParams

  // Auto-seed on first visit if KV is empty
  const count = await getInventoryCount(SEED_DEALER_ID)
  if (count === 0) {
    await seedInventory(SEED_VEHICLES)
  }

  const filters  = parseFilters(sp)
  const vehicles = await getInventory(SEED_DEALER_ID, filters)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Banner */}
      <div className="border border-white/10 rounded-xl overflow-hidden" style={{ aspectRatio: '16 / 7.2' }}>
        <img src="/motors/rh-motors-header.svg" alt="RoadHouse Motors" className="w-full h-full object-cover block" />
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-10" />}>
        <FilterBar />
      </Suspense>

      {/* Grid */}
      <InventoryGrid vehicles={vehicles} />
    </div>
  )
}
