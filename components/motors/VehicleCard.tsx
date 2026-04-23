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
          src={vehicle.images[0] ?? '/Hero-backround.jpg'}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* RoadHouse watermark */}
        <div className="absolute bottom-3 left-3 opacity-30 group-hover:opacity-50 transition-opacity">
          <Image
            src="/rh-logo.png"
            alt="RoadHouse"
            width={80}
            height={28}
            className="object-contain"
          />
        </div>

        {/* Status badge */}
        <span
          className={clsx(
            'absolute top-3 right-3 text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full backdrop-blur-sm',
            badge.className
          )}
        >
          {badge.label}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Year · Stock */}
        <p className="text-[10px] font-medium tracking-widest uppercase text-white/40">
          {vehicle.year} &middot; {vehicle.stock_number}
        </p>

        {/* Make Model / Trim */}
        <div>
          <h3 className="text-white font-semibold text-base leading-tight">
            {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-white/50 text-sm">{vehicle.trim}</p>
        </div>

        {/* Specs row */}
        <p className="text-[11px] text-white/40 flex flex-wrap gap-x-3 gap-y-1">
          <span>{formattedMileage} km</span>
          <span className="text-white/20">&middot;</span>
          <span>{vehicle.transmission}</span>
          <span className="text-white/20">&middot;</span>
          <span>{vehicle.fuel_type}</span>
        </p>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            {formattedMsrp && (
              <p className="text-white/30 text-xs line-through">{formattedMsrp}</p>
            )}
            <p className="text-white font-bold text-xl">{formattedPrice}</p>
            <p className="text-white/30 text-[10px]">CAD + taxes</p>
          </div>

          <Link
            href={`/motors/vehicle/${vehicle.vin}`}
            className={clsx(
              'text-sm font-semibold px-4 py-2 rounded-lg transition-colors',
              vehicle.status === 'sold'
                ? 'bg-white/5 text-white/30 cursor-not-allowed pointer-events-none'
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
