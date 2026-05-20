import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getInventory, getInventoryCount, DEALER_ID } from '@/lib/motors/storage'
import InventoryGrid from '@/components/motors/InventoryGrid'
import FilterSidebar from '@/components/motors/FilterSidebar'
import HeroSection from '@/components/motors/HeroSection'
import type { InventoryFilters, VehicleStatus } from '@/types/inventory'

const BASE = 'https://motors.roadhouse.capital'
const OG_IMAGE = { url: `${BASE}/motors/rh-motors-header.jpg`, width: 2560, height: 1440 }
const TWITTER_IMAGE = `${BASE}/motors/rh-motors-header.jpg`

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams
  const make = typeof sp['make'] === 'string' ? sp['make'] : null

  if (make) {
    const title = `Used ${make} Vehicles for Sale in Saskatchewan | RoadHouse Motors`
    const description = `Browse used ${make} trucks, SUVs, and cars at RoadHouse Motors. Certified pre-owned ${make} inventory in Saskatchewan. Delivery available. Dealer Licence DL331386.`
    const url = `${BASE}/inventory?make=${encodeURIComponent(make)}`
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: { title, description, url, images: [OG_IMAGE] },
      twitter: { card: 'summary_large_image', title, description, images: [TWITTER_IMAGE] },
    }
  }

  return {
    title: 'Used Vehicles for Sale in Saskatchewan | RoadHouse Motors',
    description: 'Browse certified pre-owned trucks, SUVs, and cars at RoadHouse Motors. Competitive pricing, Saskatchewan delivery available. Dealer Licence DL331386.',
    alternates: { canonical: `${BASE}/inventory` },
    openGraph: {
      title: 'Used Vehicles for Sale in Saskatchewan | RoadHouse Motors',
      description: 'Certified pre-owned trucks, SUVs, and cars. Saskatchewan delivery available.',
      url: `${BASE}/inventory`,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Used Vehicles for Sale in Saskatchewan | RoadHouse Motors',
      description: 'Certified pre-owned trucks, SUVs, and cars. Saskatchewan delivery available.',
      images: [TWITTER_IMAGE],
    },
  }
}

function parseFilters(sp: Record<string, string | string[] | undefined>): InventoryFilters {
  const filters: InventoryFilters = {}

  const search = sp['search']
  if (typeof search === 'string' && search) filters.search = search

  const make = sp['make']
  if (typeof make === 'string' && make) filters.make = make

  const model = sp['model']
  if (typeof model === 'string' && model) filters.model = model

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

function itemListJsonLd(vehicles: Awaited<ReturnType<typeof getInventory>>, make: string | null) {
  const available = vehicles.filter(v => v.status === 'available').slice(0, 20)
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: make ? `Used ${make} Vehicles for Sale in Saskatchewan` : 'Used Vehicles for Sale in Saskatchewan',
    numberOfItems: available.length,
    itemListElement: available.map((v, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Car',
        name: `${v.year} ${v.make} ${v.model} ${v.trim}`,
        url: `${BASE}/vehicle/${v.vin}`,
        offers: { '@type': 'Offer', price: v.price, priceCurrency: 'CAD' },
      },
    })),
  }
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const sp = await searchParams

  const filters = parseFilters(sp)
  const [vehicles, allVehicles] = await Promise.all([
    getInventory(DEALER_ID, filters),
    getInventory(DEALER_ID),
  ])

  const makes = [...new Set(
    allVehicles.filter(v => v.status !== 'sold').map(v => v.make)
  )].sort()

  const activeMake = typeof sp['make'] === 'string' && sp['make'] ? sp['make'] : null

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd(vehicles, activeMake)) }}
      />

      {/* Hero — sticky so the top edge locks to the header while content scrolls over it */}
      <HeroSection make={activeMake ?? undefined} />

      {/* Inventory — overlaps the hero's bottom fade and slides up over it on scroll */}
      <div className="relative z-10 bg-[#0A0A0A] -mt-14 md:-mt-32 pb-16">
        <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex flex-col md:flex-row gap-4 md:gap-10">

            <Suspense fallback={null}>
              <FilterSidebar vehicleCount={vehicles.length} makes={makes} />
            </Suspense>

            <div className="flex-1 min-w-0">
              <InventoryGrid vehicles={vehicles} />
            </div>

          </div>

          {/* Meet the founder — tasteful single-line link card */}
          <div className="mt-14 border-t border-white/[0.06] pt-8">
            <a
              href="/motors/team"
              className="group inline-flex items-center gap-2 text-white/35 hover:text-white/65 text-sm transition-colors"
            >
              Built and curated by Dalton Ellscheid — Saskatchewan-born, frontier-bred.
              <span className="text-white/20 group-hover:text-white/45 transition-colors" aria-hidden>→</span>
            </a>
          </div>

        </div>
      </div>

    </div>
  )
}
