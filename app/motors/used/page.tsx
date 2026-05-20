import type { Metadata } from 'next'
import Link from 'next/link'
import { getInventory, DEALER_ID } from '@/lib/motors/storage'
import InventoryGrid from '@/components/motors/InventoryGrid'

const BASE = 'https://motors.roadhouse.capital'

export const metadata: Metadata = {
  title: 'Used Vehicles Saskatchewan | RoadHouse Motors',
  description:
    'Pre-owned cars, trucks, and SUVs for sale in Saskatchewan. Updated daily from local dealers. Transparent pricing. DL#331386.',
  alternates: { canonical: `${BASE}/used` },
  openGraph: {
    title: 'Used Vehicles Saskatchewan | RoadHouse Motors',
    description:
      'Pre-owned cars, trucks, and SUVs for sale in Saskatchewan. Updated daily from local dealers. Transparent pricing. DL#331386.',
    url: `${BASE}/used`,
    siteName: 'RoadHouse Motors',
    images: [
      {
        url: `${BASE}/motors/rh-motors-header.jpg`,
        width: 2560,
        height: 1440,
        alt: 'RoadHouse Motors',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Used Vehicles Saskatchewan | RoadHouse Motors',
    description:
      'Pre-owned cars, trucks, and SUVs for sale in Saskatchewan. Updated daily. Transparent pricing. DL#331386.',
    images: [`${BASE}/motors/rh-motors-header.jpg`],
  },
}

const CITIES = [
  { slug: 'saskatoon',     name: 'Saskatoon' },
  { slug: 'regina',        name: 'Regina' },
  { slug: 'prince-albert', name: 'Prince Albert' },
  { slug: 'moose-jaw',     name: 'Moose Jaw' },
]

function itemListJsonLd(vehicles: Awaited<ReturnType<typeof getInventory>>) {
  const available = vehicles.filter((v) => v.status === 'available').slice(0, 20)
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Used Vehicles for Sale in Saskatchewan',
    url: `${BASE}/used`,
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

export default async function UsedPage() {
  let vehicles: Awaited<ReturnType<typeof getInventory>> = []
  try {
    vehicles = await getInventory(DEALER_ID)
  } catch {
    // KV unavailable — show empty state
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd(vehicles)) }}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-white text-3xl sm:text-4xl font-bold">
            Used Vehicles for Sale in Saskatchewan
          </h1>
          <p className="text-white/50 text-base">
            Pre-owned inventory updated daily. Transparent pricing. No games.
          </p>
        </div>

        {/* Off-lease callout */}
        <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl px-6 py-5 space-y-3">
          <h2 className="text-amber-400 font-semibold text-base">
            Off-Lease Inventory Incoming
          </h2>
          <p className="text-white/65 text-sm leading-relaxed">
            A wave of off-lease vehicles is hitting the Saskatchewan market in 2026.
            Register for early access before they hit the lot.
          </p>
          <a
            href="mailto:roadhousesyndicate@gmail.com?subject=Off-Lease%20Waitlist%20%E2%80%94%20RoadHouse%20Motors"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            Join the Waitlist
          </a>
        </div>

        {/* Inventory */}
        <InventoryGrid vehicles={vehicles} />

        {/* City quick-links */}
        <div className="border-t border-white/[0.08] pt-8 space-y-4">
          <p className="text-white/40 text-sm">Serving Saskatchewan including:</p>
          <div className="flex flex-wrap gap-3">
            {CITIES.map(({ slug, name }) => (
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
