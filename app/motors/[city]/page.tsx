import type { Metadata } from 'next'
import Link from 'next/link'
import { getInventory, DEALER_ID } from '@/lib/motors/storage'
import InventoryGrid from '@/components/motors/InventoryGrid'

// proxy.ts: motors.* host rewrites /[city] → /motors/[city] before any auth check.
// /motors is in FULLY_PUBLIC — all /motors/* paths pass through without session resolution.
// Static routes (inventory, credit, privacy, admin) take Next.js precedence over [city].

const BASE = 'https://motors.roadhouse.capital'

const CITIES: Record<string, string> = {
  saskatoon:     'Saskatoon',
  regina:        'Regina',
  'prince-albert': 'Prince Albert',
  'moose-jaw':   'Moose Jaw',
}

export function generateStaticParams() {
  return Object.keys(CITIES).map((city) => ({ city }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>
}): Promise<Metadata> {
  const { city } = await params
  const cityName = CITIES[city] ?? city
  const title = `Used Vehicles ${cityName} | RoadHouse Motors`
  const description = `Browse used cars, trucks, and SUVs available near ${cityName}, Saskatchewan. Updated daily. Dealer DL#331386.`
  const url = `${BASE}/${city}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'RoadHouse Motors',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

function localBusinessJsonLd(cityName: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: 'RoadHouse Motors',
    url: BASE,
    telephone: '+13063818222',
    priceRange: '$5,900 – $96,900 CAD',
    image: `${BASE}/motors/rh-motors-header.jpg`,
    areaServed: { '@type': 'City', name: cityName },
    address: { '@type': 'PostalAddress', addressRegion: 'SK', addressCountry: 'CA' },
    licence: 'DL331386',
  }
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  const cityName = CITIES[city] ?? city

  let vehicles: Awaited<ReturnType<typeof getInventory>> = []
  try {
    vehicles = await getInventory(DEALER_ID)
  } catch {
    // KV unavailable — show empty state
  }

  const otherCities = Object.entries(CITIES).filter(([slug]) => slug !== city)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd(cityName)) }}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-white text-3xl sm:text-4xl font-bold">
            Used Vehicles Near {cityName}, Saskatchewan
          </h1>
          <p className="text-white/60 text-base max-w-2xl leading-relaxed">
            Daily-updated inventory from a Saskatchewan dealer with transparent pricing.
            Browse available vehicles below and submit an inquiry directly on any listing.
            Delivery throughout the province available. Dealer Licence DL#331386.
          </p>
        </div>

        {/* City callout */}
        <div className="bg-white/[0.04] border border-white/10 rounded-xl px-6 py-4">
          <p className="text-white/70 text-sm">
            <span className="font-medium text-white">Serving {cityName} and area.</span>{' '}
            Call{' '}
            <a href="tel:+13063818222" className="text-white hover:underline underline-offset-2">
              (306) 381-8222
            </a>{' '}
            or submit an inquiry on any vehicle listing.
          </p>
        </div>

        {/* Inventory */}
        <InventoryGrid vehicles={vehicles} />

        {/* Other city links */}
        <div className="border-t border-white/[0.08] pt-8">
          <p className="text-white/40 text-sm mb-4">Also serving:</p>
          <div className="flex flex-wrap gap-3">
            {otherCities.map(([slug, name]) => (
              <Link
                key={slug}
                href={`/motors/${slug}`}
                className="text-white/60 hover:text-white text-sm border border-white/10 hover:border-white/25 px-4 py-2 rounded-full transition-colors"
              >
                {name}
              </Link>
            ))}
          </div>
        </div>

        {/* FCAA disclaimer */}
        <p className="text-white/25 text-xs pt-2">
          DL#331386 | Prices exclude taxes &amp; licensing.
        </p>
      </div>
    </>
  )
}
