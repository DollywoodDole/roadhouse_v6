'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const onScroll = () => {
      // Positive translateY makes the container drift down as the page scrolls up,
      // so the hero visually moves at 85% of normal scroll speed — classic depth effect.
      el.style.transform = `translateY(${window.scrollY * 0.15}px)`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      ref={heroRef}
      className="relative w-full will-change-transform"
      style={{ aspectRatio: '1534 / 1025', minHeight: '320px' }}
    >
      {/* Container ratio = image ratio → object-cover never crops */}
      <Image
        src="/motors/rh_motors_lambo.png"
        alt=""
        fill
        className="object-cover"
        style={{ objectPosition: 'center 82%' }}
        priority
        unoptimized
      />

      {/* Top — seals flush to header */}
      <div className="absolute inset-x-0 top-0 h-[18%] bg-gradient-to-b from-[#0A0A0A] to-transparent" />
      {/* Bottom — fades into inventory */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/25 to-transparent" />
      {/* Left — soft edge */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/30 via-transparent to-transparent" />

      {/* Text */}
      <div className="absolute bottom-14 left-0 right-0 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-white leading-tight">
          Browse Inventory
        </h1>
        <p className="mt-2 text-white/55 text-base font-normal">
          Certified pre-owned · Saskatchewan delivery available
        </p>
      </div>
    </div>
  )
}
