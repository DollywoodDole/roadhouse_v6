'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function LenisProvider() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({
      duration:    1.4,
      easing:      (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    // Sync ScrollTrigger + emit velocity and progress as CSS vars
    lenis.on('scroll', (e: { velocity: number; progress: number }) => {
      ScrollTrigger.update()
      document.documentElement.style.setProperty('--scroll-velocity', String(Math.abs(e.velocity)))
      document.documentElement.style.setProperty('--scroll-progress', String(e.progress))
    })

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(raf)
    }
  }, [])

  return null
}
