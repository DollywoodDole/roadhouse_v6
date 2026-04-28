import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getVehicleByVin } from '@/lib/motors/storage'
import { SEED_DEALER_ID } from '@/lib/motors/seed'
import { clsx } from 'clsx'
import type { Vehicle } from '@/types/inventory'

interface PageProps {
  params: Promise<{ vin: string }>
}

const BASE = 'https://motors.roadhouse.capital'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0 }).format(n)

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { vin } = await params
  const vehicle = await getVehicleByVin(SEED_DEALER_ID, vin)

  if (!vehicle) return { title: 'Vehicle Not Found | RoadHouse Motors' }

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

function vehicleJsonLd(v: Vehicle) {
  const availability =
    v.status === 'available' ? 'https://schema.org/InStock' :
    v.status === 'pending'   ? 'https://schema.org/PreOrder' :
                               'https://schema.org/SoldOut'

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

const STATUS_STYLE = {
  available: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  pending:   'bg-amber-500/20  text-amber-400  border border-amber-500/30',
  sold:      'bg-red-500/20    text-red-400    border border-red-500/30',
}

function SpecRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/[0.06]">
      <span className="text-white/50 text-sm">{label}</span>
      <span className="text-white text-sm font-medium text-right ml-4">{value}</span>
    </div>
  )
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { vin }   = await params
  const vehicle   = await getVehicleByVin(SEED_DEALER_ID, vin)

  if (!vehicle) notFound()

  const formattedPrice    = fmt(vehicle.price)
  const formattedMsrp     = vehicle.msrp ? fmt(vehicle.msrp) : null
  const formattedMileage  = `${new Intl.NumberFormat('en-CA').format(vehicle.mileage)} km`
  const creditHref        = `/motors/credit?vehicle=${encodeURIComponent(`${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`)}`

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleJsonLd(vehicle)) }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Back */}
        <Link
          href="/motors/inventory"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
        >
          <span aria-hidden>←</span> Back to Inventory
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left — images + specs */}
          <div className="lg:col-span-3 space-y-6">
            {/* Primary image */}
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#1A1A1A]">
              <Image
                src={vehicle.images[0] ?? '/motors/rh-coming-soon.svg'}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 opacity-25">
                <Image src="/motors/rh-logo.png" alt="RoadHouse" width={96} height={33} className="object-contain" unoptimized />
              </div>
              <span className={clsx(
                'absolute top-4 right-4 text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full backdrop-blur-sm',
                STATUS_STYLE[vehicle.status]
              )}>
                {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
              </span>
            </div>

            {/* Additional images */}
            {vehicle.images.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {vehicle.images.slice(1, 8).map((src, i) => (
                  <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[#1A1A1A]">
                    <Image
                      src={src}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} — photo ${i + 2}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes="25vw"
                    />
                  </div>
                ))}
              </div>
            )}

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

            {/* CTAs */}
            {vehicle.status !== 'sold' ? (
              <div className="space-y-3">
                <Link
                  href={creditHref}
                  className="block w-full bg-white text-black font-semibold text-base py-3.5 rounded-xl hover:bg-white/90 transition-colors text-center"
                >
                  Apply for Financing
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
    </>
  )
}
