'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

const FALLBACK = '/motors/rh-coming-soon.svg'

interface VehicleImageProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
  width?: number
  height?: number
}

export default function VehicleImage({ src, alt, fill, className, sizes, priority, width, height }: VehicleImageProps) {
  const [imgSrc, setImgSrc] = useState(src)

  // Sync state when src prop changes (e.g. gallery cycling between photos)
  useEffect(() => { setImgSrc(src) }, [src])

  // Bypass Next.js optimization for external CDN URLs — the optimizer fails at
  // large sizes (detail page ~60vw), triggering onError → coming-soon fallback.
  // Local /public/ assets are still optimized normally.
  const unoptimized = imgSrc.startsWith('http') || imgSrc.endsWith('.svg')

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
      onError={() => { if (imgSrc !== FALLBACK) setImgSrc(FALLBACK) }}
    />
  )
}
