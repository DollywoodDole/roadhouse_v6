'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { clsx } from 'clsx'
import type { Vehicle } from '@/types/inventory'

const STATUS_BADGE: Record<Vehicle['status'], { label: string; className: string }> = {
  available: { label: 'Available',  className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  pending:   { label: 'Pending',    className: 'bg-amber-500/20  text-amber-400  border border-amber-500/30'  },
  sold:      { label: 'Sold',       className: 'bg-red-500/20    text-red-400    border border-red-500/30'    },
}

interface VehicleCardProps {
  vehicle: Vehicle
  index?: number
}

export default function VehicleCard({ vehicle, index = 0 }: VehicleCardProps) {
  const badge = STATUS_BADGE[vehicle.status]
  const formattedPrice = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(vehicle.price)

  const formattedMsrp = vehicle.msrp
    ? new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: 'CAD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(vehicle.msrp)
    : null

  const formattedMileage = new Intl.NumberFormat('en-CA').format(vehicle.mileage)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: 'easeOut' }}
      className="group bg-[#111111] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#1A1A1A]">
        <Image
          src={vehicle.images[0] ?? '/motors/rh-coming-soon.svg'}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* RoadHouse watermark — hidden on mobile to save space */}
        <div className="absolute bottom-2 left-2 opacity-25 group-hover:opacity-45 transition-opacity hidden sm:block">
          <Image
            src="/motors/rh-logo.png"
            alt="RoadHouse"
            width={72}
            height={25}
            className="object-contain"
            unoptimized
          />
        </div>

        {/* Status badge */}
        <span
          className={clsx(
            'absolute top-2 right-2 text-[9px] md:text-xs font-semibold tracking-widest uppercase px-2 py-0.5 md:px-3 md:py-1 rounded-full backdrop-blur-sm',
            badge.className
          )}
        >
          {badge.label}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 md:p-5 space-y-2 md:space-y-3">
        {/* Year · Stock */}
        <p className="text-[9px] md:text-xs font-medium tracking-widest uppercase text-white/60">
          {vehicle.year} &middot; {vehicle.stock_number}
        </p>

        {/* Make / Model + Trim */}
        <div>
          <h3 className="text-white font-semibold text-sm md:text-lg leading-tight">
            {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-white/70 text-xs md:text-base">{vehicle.trim}</p>
        </div>

        {/* Specs — hidden on mobile to keep cards compact */}
        <p className="hidden sm:flex text-xs text-white/60 flex-wrap gap-x-3 gap-y-1">
          <span>{formattedMileage} km</span>
          <span className="text-white/40">&middot;</span>
          <span>{vehicle.transmission}</span>
          <span className="text-white/40">&middot;</span>
          <span>{vehicle.fuel_type}</span>
        </p>
        {/* Condensed specs for mobile */}
        <p className="sm:hidden text-[10px] text-white/55 truncate">
          {formattedMileage} km &middot; {vehicle.fuel_type}
        </p>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Price + CTA — stacked on mobile, inline on desktop */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-3">
          <div>
            {formattedMsrp && (
              <p className="text-white/50 text-xs md:text-sm line-through">{formattedMsrp}</p>
            )}
            <p className="text-white font-bold text-lg md:text-2xl">{formattedPrice}</p>
            <p className="text-white/50 text-[10px] md:text-xs">CAD + taxes</p>
          </div>

          <Link
            href={`/motors/vehicle/${vehicle.vin}`}
            className={clsx(
              'text-xs md:text-base font-semibold px-3 py-2 md:px-5 md:py-2.5 rounded-lg transition-colors text-center',
              vehicle.status === 'sold'
                ? 'bg-white/5 text-white/50 cursor-not-allowed pointer-events-none'
                : 'bg-white text-black hover:bg-white/90'
            )}
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
