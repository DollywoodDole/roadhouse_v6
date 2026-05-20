import type { Metadata } from 'next'
import Link from 'next/link'
import VehicleGallery from '@/components/motors/VehicleGallery'
import PaymentEstimator from '@/components/motors/PaymentEstimator'
import StickyCallBar from '@/components/motors/StickyCallBar'
import VehicleLeadForm from '@/components/motors/VehicleLeadForm'
import { getVehicleByVin, DEALER_ID } from '@/lib/motors/storage'
import type { Vehicle } from '@/types/inventory'
import ReviewCarousel from '@/components/motors/ReviewCarousel'
import { REVIEWS, REVIEWS_ENABLED } from '@/lib/motors/reviews'

interface PageProps {
  params: Promise<{ vin: string }>
}

const BASE = 'https://motors.roadhouse.capital'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(n)

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { vin } = await params
  const vehicle = await getVehicleByVin(DEALER_ID, vin)

  if (!vehicle) {
    return {
      title: 'Vehicle Sold | RoadHouse Motors Saskatchewan',
      description: 'This vehicle has sold. Browse current used vehicle inventory in Saskatchewan at RoadHouse Motors.',
      robots: 'noindex',
    }
  }

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim} for Sale | RoadHouse Motors SK`
  const description =
    `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim} — ` +
    `${new Intl.NumberFormat('en-CA').format(vehicle.mileage)} km, ` +
    `${vehicle.exterior_color}, ${vehicle.transmission}. ` +
    `${fmt(vehicle.price)} CAD. Saskatchewan delivery available.`
  const image = vehicle.images[0] ?? `${BASE}/motors/rh-motors-header.jpg`
  const url = `${BASE}/vehicle/${vin}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'RoadHouse Motors',
      type: 'website',
      images: [{ url: image, width: 1200, height: 800, alt: `${vehicle.year} ${vehicle.make} ${vehicle.model}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

function breadcrumbJsonLd(v: Vehicle) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'RoadHouse Motors', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Inventory', item: `${BASE}/inventory` },
      { '@type': 'ListItem', position: 3, name: `${v.year} ${v.make} ${v.model} ${v.trim}`, item: `${BASE}/vehicle/${v.vin}` },
    ],
  }
}

function vehicleJsonLd(v: Vehicle) {
  const availability =
    v.status === 'available' ? 'https://schema.org/InStock' :
    v.status === 'pending'   ? 'https://schema.org/PreOrder' :
                               'https://schema.org/SoldOut'

  const image = v.images[0]?.startsWith('http') ? v.images[0] : null

  return {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: `${v.year} ${v.make} ${v.model} ${v.trim}`,
    brand: { '@type': 'Brand', name: v.make },
    model: v.model,
    vehicleModelDate: String(v.year),
    vehicleConfiguration: v.trim,
    bodyType: v.body_style,
    color: v.exterior_color,
    vehicleInteriorColor: v.interior_color,
    fuelType: v.fuel_type,
    vehicleTransmission: v.transmission,
    vin: v.vin,
    itemCondition: 'https://schema.org/UsedCondition',
    ...(image ? { image } : {}),
    ...(v.description ? { description: v.description } : {}),
    mileageFromOdometer: {
      '@type': 'QuantitativeValue',
      value: v.mileage,
      unitCode: 'KMT',
    },
    offers: {
      '@type': 'Offer',
      price: v.price,
      priceCurrency: 'CAD',
      availability,
      url: `${BASE}/vehicle/${v.vin}`,
      seller: {
        '@type': 'AutoDealer',
        name: 'RoadHouse Motors',
        url: BASE,
        telephone: '+13063818222',
        address: { '@type': 'PostalAddress', addressRegion: 'SK', addressCountry: 'CA' },
      },
    },
  }
}

function SpecRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/[0.06]">
      <span className="text-white/50 text-sm">{label}</span>
      <span className="text-white text-sm font-medium text-right ml-4">{value}</span>
    </div>
  )
}

function SoldVehiclePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <p className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-4">Vehicle Status</p>
      <h1 className="text-white text-3xl font-bold mb-4">
        This vehicle has sold — but we have more.
      </h1>
      <p className="text-white/60 text-base leading-relaxed mb-10">
        Saskatchewan&rsquo;s inventory moves fast. Browse current available vehicles below,
        or call us directly at{' '}
        <a href="tel:+13063818222" className="text-white hover:underline underline-offset-2">
          (306) 381-8222
        </a>.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/motors/inventory"
          className="inline-flex items-center justify-center bg-white text-black font-semibold text-base px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors"
        >
          Browse Available Inventory
        </Link>
      </div>
      <p className="text-white/25 text-xs mt-10">
        DL#331386 | Prices exclude taxes &amp; licensing.
      </p>
    </div>
  )
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { vin }   = await params
  const vehicle   = await getVehicleByVin(DEALER_ID, vin)

  if (!vehicle) {
    return <SoldVehiclePage />
  }

  const formattedPrice    = fmt(vehicle.price)
  const formattedMsrp     = vehicle.msrp ? fmt(vehicle.msrp) : null
  const formattedMileage  = `${new Intl.NumberFormat('en-CA').format(vehicle.mileage)} km`
  const creditHref        = `/motors/credit?vehicle=${encodeURIComponent(`${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`)}`
  const vehicleInterest   = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleJsonLd(vehicle)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(vehicle)) }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 space-y-10">
        {/* Back */}
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href="/motors/inventory"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
          >
            <span aria-hidden>←</span> Back to Inventory
          </Link>
          <Link
            href={`/motors/inventory?make=${encodeURIComponent(vehicle.make)}`}
            className="inline-flex items-center gap-1 text-white/35 hover:text-white/70 text-sm transition-colors"
          >
            Browse more {vehicle.make} vehicles <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left — images + specs */}
          <div className="lg:col-span-3 space-y-6">
            <VehicleGallery
              images={vehicle.images.length > 0 ? vehicle.images : ['/motors/rh-coming-soon.svg']}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              status={vehicle.status}
            />

            {/* Spec table */}
            <div className="bg-[#111111] border border-white/10 rounded-xl px-5 py-2">
              <h2 className="text-white/50 text-xs font-semibold tracking-widest uppercase py-3 border-b border-white/[0.06]">
                Vehicle Specifications
              </h2>
              <SpecRow label="VIN"             value={vehicle.vin} />
              <SpecRow label="Stock #"         value={vehicle.stock_number} />
              <SpecRow label="Year"            value={vehicle.year} />
              <SpecRow label="Make"            value={vehicle.make} />
              <SpecRow label="Model"           value={vehicle.model} />
              <SpecRow label="Trim"            value={vehicle.trim} />
              <SpecRow label="Body Style"      value={vehicle.body_style} />
              <SpecRow label="Mileage"         value={formattedMileage} />
              <SpecRow label="Fuel Type"       value={vehicle.fuel_type} />
              <SpecRow label="Transmission"    value={vehicle.transmission} />
              <SpecRow label="Exterior Colour" value={vehicle.exterior_color} />
              <SpecRow label="Interior Colour" value={vehicle.interior_color} />
            </div>
          </div>

          {/* Right — title, price, features, CTAs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-white/35 mb-1">
                {vehicle.year} &middot; {vehicle.stock_number}
              </p>
              <h1 className="text-white text-2xl font-bold leading-tight">
                {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-white/60 text-base mt-0.5">{vehicle.trim}</p>
            </div>

            {/* Price */}
            <div className="bg-[#111111] border border-white/10 rounded-xl p-5 space-y-1">
              {formattedMsrp && (
                <p className="text-white/35 text-sm line-through">MSRP {formattedMsrp}</p>
              )}
              <p className="text-white text-3xl font-bold">{formattedPrice}</p>
              <p className="text-white/35 text-xs">CAD + applicable taxes</p>
            </div>

            {/* Payment Estimator */}
            {vehicle.status !== 'sold' && vehicle.price > 0 && (
              <PaymentEstimator price={vehicle.price} vin={vehicle.vin} />
            )}

            {/* CTAs */}
            {vehicle.status !== 'sold' ? (
              <div className="space-y-3">
                <Link
                  href={creditHref}
                  className="block w-full bg-white text-black font-semibold text-base py-3.5 rounded-xl hover:bg-white/90 transition-colors text-center"
                >
                  Get Pre-Qualified
                </Link>
                <a
                  href="tel:+13063818222"
                  className="flex items-center justify-center gap-2 w-full border border-white/15 text-white font-medium text-base py-3.5 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  (306) 381-8222
                </a>
              </div>
            ) : (
              <div className="bg-[#111111] border border-white/10 rounded-xl p-4 text-center">
                <p className="text-white/40 text-sm">This vehicle has been sold.</p>
                <Link href="/motors/inventory" className="mt-2 inline-block text-white/60 hover:text-white text-sm underline underline-offset-2 transition-colors">
                  Browse available inventory →
                </Link>
              </div>
            )}

            <p className="text-white/25 text-xs text-center">
              Dealer Licence DL331386 · Saskatchewan, Canada
            </p>

            {/* Lead Form */}
            {vehicle.status !== 'sold' && (
              <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
                <h2 className="text-white/50 text-xs font-semibold tracking-widest uppercase mb-4">
                  Interested in this vehicle?
                </h2>
                <VehicleLeadForm vehicleInterest={vehicleInterest} vin={vin} />
              </div>
            )}

            {/* Trade-in CTA */}
            {vehicle.status !== 'sold' && (
              <Link
                href="/motors/trade-in"
                className="flex items-center justify-between bg-white/[0.02] border border-white/[0.08] rounded-xl px-5 py-4 hover:border-white/15 transition-colors group"
              >
                <div>
                  <p className="text-white/65 text-sm font-medium group-hover:text-white/85 transition-colors">
                    Trading in? Get yours appraised first
                  </p>
                  <p className="text-white/30 text-xs mt-0.5">Real appraisal in 24 hours · No obligation</p>
                </div>
                <span className="text-white/25 group-hover:text-white/55 transition-colors ml-4" aria-hidden>→</span>
              </Link>
            )}

            {/* Review carousel — gated; invisible until REVIEWS_ENABLED (≥ 3 real reviews) */}
            {REVIEWS_ENABLED && (
              <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
                <h2 className="text-white/50 text-xs font-semibold tracking-widest uppercase mb-5">
                  What Customers Say
                </h2>
                <ReviewCarousel reviews={REVIEWS} />
              </div>
            )}

            {/* Features */}
            {vehicle.features.length > 0 && (
              <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
                <h2 className="text-white/50 text-xs font-semibold tracking-widest uppercase mb-4">
                  Features &amp; Options
                </h2>
                <div className="flex flex-wrap gap-2">
                  {vehicle.features.map((f) => (
                    <span key={f} className="bg-white/5 border border-white/10 text-white/65 text-xs px-3 py-1.5 rounded-full">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {vehicle.description && (
              <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
                <h2 className="text-white/50 text-xs font-semibold tracking-widest uppercase mb-3">
                  About This Vehicle
                </h2>
                <p className="text-white/65 text-sm leading-relaxed">{vehicle.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <StickyCallBar />
    </>
  )
}
