'use client'

import { useState } from 'react'
import Image from 'next/image'
import { clsx } from 'clsx'
import VehicleImage from './VehicleImage'
import type { Vehicle } from '@/types/inventory'

const STATUS_STYLE: Record<Vehicle['status'], string> = {
  available: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  pending:   'bg-amber-500/20  text-amber-400  border border-amber-500/30',
  sold:      'bg-red-500/20    text-red-400    border border-red-500/30',
}

interface VehicleGalleryProps {
  images: string[]
  alt: string
  status: Vehicle['status']
}

export default function VehicleGallery({ images, alt, status }: VehicleGalleryProps) {
  const [current, setCurrent] = useState(0)
  const total = images.length
  const src = images[current] ?? '/motors/rh-coming-soon.svg'

  const prev = () => setCurrent((i) => (i - 1 + total) % total)
  const next = () => setCurrent((i) => (i + 1) % total)

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#1A1A1A]">
        <VehicleImage
          src={src}
          alt={`${alt} — photo ${current + 1}`}
          fill
          className="object-cover"
          priority={current === 0}
          sizes="(max-width: 1024px) 100vw, 60vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Cover dealer watermark in top-right of CDN photos */}
        <div className="absolute top-0 right-0 w-[42%] h-[40%] bg-gradient-to-bl from-black via-black/70 to-transparent pointer-events-none" />

        {/* RH watermark */}
        <div className="absolute bottom-4 left-4 opacity-25">
          <Image src="/motors/rh-logo.png" alt="RoadHouse" width={96} height={33} className="object-contain" unoptimized />
        </div>

        {/* Status badge */}
        <span className={clsx(
          'absolute top-4 right-4 text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full backdrop-blur-sm',
          STATUS_STYLE[status]
        )}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>

        {total > 1 && (
          <>
            {/* Prev arrow */}
            <button
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Next arrow */}
            <button
              onClick={next}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Counter */}
            <div className="absolute bottom-4 right-4 bg-black/45 backdrop-blur-sm text-white/75 text-xs px-2.5 py-1 rounded-full">
              {current + 1} / {total}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {images.map((imgSrc, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`View photo ${i + 1}`}
              className={clsx(
                'relative aspect-[4/3] rounded-lg overflow-hidden bg-[#1A1A1A] transition-all duration-150',
                i === current
                  ? 'ring-2 ring-white/60 opacity-100'
                  : 'opacity-45 hover:opacity-75'
              )}
            >
              <VehicleImage
                src={imgSrc}
                alt={`${alt} — photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 25vw, 15vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
