'use client'

import Image from 'next/image'
import { useState } from 'react'

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
  const isSvg = imgSrc.endsWith('.svg')

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
      unoptimized={isSvg}
      onError={() => { if (imgSrc !== FALLBACK) setImgSrc(FALLBACK) }}
    />
  )
}
