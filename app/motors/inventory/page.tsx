import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getInventory, getInventoryCount, seedInventory } from '@/lib/motors/storage'
import { SEED_VEHICLES, SEED_DEALER_ID } from '@/lib/motors/seed'
import InventoryGrid from '@/components/motors/InventoryGrid'
import FilterSidebar from '@/components/motors/FilterSidebar'
import HeroSection from '@/components/motors/HeroSection'
import type { InventoryFilters, VehicleStatus } from '@/types/inventory'

export const metadata: Metadata = {
  title: 'Used Vehicles for Sale in Saskatchewan | RoadHouse Motors',
  description: 'Browse certified pre-owned trucks, SUVs, and cars at RoadHouse Motors. Competitive pricing, Saskatchewan delivery available. Dealer Licence DL331386.',
  alternates: { canonical: 'https://motors.roadhouse.capital/inventory' },
  openGraph: {
    title: 'Used Vehicles for Sale in Saskatchewan | RoadHouse Motors',
    description: 'Certified pre-owned trucks, SUVs, and cars. Saskatchewan delivery available.',
    url: 'https://motors.roadhouse.capital/inventory',
    images: [{ url: 'https://motors.roadhouse.capital/motors/rh-motors-header.jpg', width: 2560, height: 1440 }],
  },
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function parseFilters(sp: Record<string, string | string[] | undefined>): InventoryFilters {
  const filters: InventoryFilters = {}

  const search = sp['search']
  if (typeof search === 'string' && search) filters.search = search

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
  if (typeof status === 'string' && status) filters.status = status as VehicleStatus

  return filters
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const sp = await searchParams

  const count = await getInventoryCount(SEED_DEALER_ID)
  if (count === 0) await seedInventory(SEED_VEHICLES)

  const filters  = parseFilters(sp)
  const vehicles = await getInventory(SEED_DEALER_ID, filters)

  return (
    <div>

      {/* Hero — sticky so the top edge locks to the header while content scrolls over it */}
      <HeroSection />

      {/* Inventory — overlaps the hero's bottom fade and slides up over it on scroll */}
      <div className="relative z-10 bg-[#0A0A0A] -mt-14 md:-mt-32 pb-16">
        <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex flex-col md:flex-row gap-4 md:gap-10">

            <Suspense fallback={null}>
              <FilterSidebar vehicleCount={vehicles.length} />
            </Suspense>

            <div className="flex-1 min-w-0">
              <InventoryGrid vehicles={vehicles} />
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}
