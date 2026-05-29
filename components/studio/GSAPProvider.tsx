'use client'

import { useEffect } from 'react'
import { registerGSAP } from '@/lib/studio/animations'

export default function GSAPProvider() {
  useEffect(() => {
    registerGSAP()
  }, [])
  return null
}
