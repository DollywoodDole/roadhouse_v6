import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getVehicleByVin } from '@/lib/motors/storage'
import { SEED_DEALER_ID } from '@/lib/motors/seed'
import { clsx } from 'clsx'

interface PageProps {
  params: Promise<{ vin: string }>
}

const STATUS_STYLE = {
  available: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  pending:   'bg-amber-500/20  text-amber-400  border border-amber-500/30',
  sold:      'bg-red-500/20    text-red-400    border border-red-500/30',
}

function SpecRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/[0.06]">
      <span className="text-white/40 text-sm">{label}</span>
      <span className="text-white text-sm font-medium text-right ml-4">{value}</span>
    </div>
  )
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { vin }   = await params
  const vehicle   = await getVehicleByVin(SEED_DEALER_ID, vin)

  if (!vehicle) notFound()

  const formattedPrice = new Intl.NumberFormat('en-CA', {
    style: 'currency', currency: 'CAD', minimumFractionDigits: 0,
  }).format(vehicle.price)

  const formattedMsrp = vehicle.msrp
    ? new Intl.NumberFormat('en-CA', {
        style: 'currency', currency: 'CAD', minimumFractionDigits: 0,
      }).format(vehicle.msrp)
    : null

  const formattedMileage = `${new Intl.NumberFormat('en-CA').format(vehicle.mileage)} km`

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back link */}
      <Link
        href="/motors/inventory"
        className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors"
      >
        <span aria-hidden>←</span> Back to Inventory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left — image + specs */}
        <div className="lg:col-span-3 space-y-6">
          {/* Hero image */}
          <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#1A1A1A]">
            <Image
              src={vehicle.images[0] ?? '/Hero-backround.jpg'}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            {/* RoadHouse watermark */}
            <div className="absolute bottom-4 left-4 opacity-25">
              <Image src="/rh-logo.png" alt="RoadHouse" width={96} height={33} className="object-contain" unoptimized />
            </div>
            <span
              className={clsx(
                'absolute top-4 right-4 text-[10px] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full backdrop-blur-sm',
                STATUS_STYLE[vehicle.status]
              )}
            >
              {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
            </span>
          </div>

          {/* Spec table */}
          <div className="bg-[#111111] border border-white/10 rounded-xl px-5 py-2">
            <h2 className="text-white/50 text-[10px] font-semibold tracking-widest uppercase py-3 border-b border-white/[0.06]">
              Vehicle Specifications
            </h2>
            <SpecRow label="VIN"               value={vehicle.vin} />
            <SpecRow label="Stock #"           value={vehicle.stock_number} />
            <SpecRow label="Year"              value={vehicle.year} />
            <SpecRow label="Make"              value={vehicle.make} />
            <SpecRow label="Model"             value={vehicle.model} />
            <SpecRow label="Trim"              value={vehicle.trim} />
            <SpecRow label="Body Style"        value={vehicle.body_style} />
            <SpecRow label="Mileage"           value={formattedMileage} />
            <SpecRow label="Fuel Type"         value={vehicle.fuel_type} />
            <SpecRow label="Transmission"      value={vehicle.transmission} />
            <SpecRow label="Exterior Colour"   value={vehicle.exterior_color} />
            <SpecRow label="Interior Colour"   value={vehicle.interior_color} />
          </div>
        </div>

        {/* Right — title, price, features, CTA */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title block */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-1">
              {vehicle.year} &middot; {vehicle.stock_number}
            </p>
            <h1 className="text-white text-2xl font-bold leading-tight">
              {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-white/50 text-base">{vehicle.trim}</p>
          </div>

          {/* Price block */}
          <div className="bg-[#111111] border border-white/10 rounded-xl p-5 space-y-1">
            {formattedMsrp && (
              <p className="text-white/30 text-sm line-through">MSRP {formattedMsrp}</p>
            )}
            <p className="text-white text-3xl font-bold">{formattedPrice}</p>
            <p className="text-white/30 text-xs">CAD + applicable taxes</p>
          </div>

          {/* Features */}
          <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
            <h2 className="text-white/50 text-[10px] font-semibold tracking-widest uppercase mb-4">
              Features &amp; Options
            </h2>
            <div className="flex flex-wrap gap-2">
              {vehicle.features.map((f) => (
                <span
                  key={f}
                  className="bg-white/5 border border-white/10 text-white/60 text-xs px-3 py-1.5 rounded-full"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          {vehicle.description && (
            <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
              <h2 className="text-white/50 text-[10px] font-semibold tracking-widest uppercase mb-3">
                About This Vehicle
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">{vehicle.description}</p>
            </div>
          )}

          {/* CTA */}
          <button
            className="w-full bg-white text-black font-semibold text-sm py-3.5 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
            disabled={vehicle.status === 'sold'}
          >
            {vehicle.status === 'sold' ? 'Vehicle Sold' : 'Request Info'}
          </button>

          <p className="text-white/20 text-xs text-center">
            A sales representative will contact you within one business day.
          </p>
        </div>
      </div>
    </div>
  )
}
