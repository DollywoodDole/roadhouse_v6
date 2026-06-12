'use client'

import { useEffect } from 'react'
import { fbq } from '@/lib/motors/pixel'

interface Props {
  vin: string
  name: string
  price?: number
}

// Fires Meta Pixel ViewContent on VDP mount. Renders nothing.
export default function PixelViewContent({ vin, name, price }: Props) {
  useEffect(() => {
    fbq('track', 'ViewContent', {
      content_ids:  [vin],
      content_name: name,
      content_type: 'vehicle',
      ...(price && price > 0 ? { value: price, currency: 'CAD' } : {}),
    })
  }, [vin, name, price])
  return null
}
