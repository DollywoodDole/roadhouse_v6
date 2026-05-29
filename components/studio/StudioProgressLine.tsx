'use client'

import { useEffect, useRef } from 'react'

export default function StudioProgressLine() {
  const fillRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rafId: number
    const tick = () => {
      if (fillRef.current) {
        const prog = parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--scroll-progress') || '0'
        )
        fillRef.current.style.transform = `scaleY(${prog})`
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div
      data-progress-line
      aria-hidden="true"
      style={{
        position:      'fixed',
        top:           0,
        right:         0,
        width:         '1px',
        height:        '100vh',
        zIndex:        50,
        background:    '#1A1C1F',
        pointerEvents: 'none',
      }}
    >
      <div
        ref={fillRef}
        style={{
          width:           '100%',
          height:          '100%',
          background:      '#C8861E',
          transformOrigin: 'top center',
          transform:       'scaleY(0)',
          willChange:      'transform',
        }}
      />
    </div>
  )
}
