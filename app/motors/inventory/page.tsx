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
      <div
        className="relative border border-white/10 rounded-xl overflow-hidden px-6 py-12 sm:py-16"
        style={{ backgroundImage: 'url(/motors/rh-motors-header.svg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-black/55 rounded-xl" />
        <div className="relative z-10">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-white/60 mb-1">
            RoadHouse Motors · Saskatchewan
          </p>
          <h1 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">
            RoadHouse Motors
          </h1>
          <p className="text-white/60 text-sm mt-1">
            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in inventory
          </p>
        </div>
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
