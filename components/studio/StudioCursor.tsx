'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function StudioCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)

  useEffect(() => {
    // Touch/pointer-coarse devices — hide entirely
    if (window.matchMedia('(hover: none)').matches) return

    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    // Hide system cursor on studio pages
    document.documentElement.style.cursor = 'none'

    // Initial off-screen position
    gsap.set([dot, ring], { x: -100, y: -100 })
    mounted.current = true

    const onMove = (e: MouseEvent) => {
      gsap.to(dot,  { x: e.clientX, y: e.clientY, duration: 0.08, ease: 'none' })
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.32, ease: 'power2.out' })
    }

    const onEnterInteractive = () => {
      gsap.to(ring, { width: 44, height: 44, opacity: 0.5, duration: 0.2, ease: 'power2.out' })
      gsap.to(dot,  { opacity: 0, duration: 0.1 })
    }
    const onLeaveInteractive = () => {
      gsap.to(ring, { width: 28, height: 28, opacity: 0.8, duration: 0.25, ease: 'power2.out' })
      gsap.to(dot,  { opacity: 1, duration: 0.15 })
    }

    const attachListeners = () => {
      document
        .querySelectorAll('a, button, [role="button"], [data-cursor-hover]')
        .forEach((el) => {
          el.addEventListener('mouseenter', onEnterInteractive)
          el.addEventListener('mouseleave', onLeaveInteractive)
        })
    }

    attachListeners()

    const observer = new MutationObserver(attachListeners)
    observer.observe(document.body, { childList: true, subtree: true })

    window.addEventListener('mousemove', onMove, { passive: true })

    return () => {
      document.documentElement.style.cursor = ''
      window.removeEventListener('mousemove', onMove)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      {/* Trailing ring */}
      <div
        ref={ringRef}
        aria-hidden="true"
        suppressHydrationWarning
        style={{
          position:      'fixed',
          top:           0,
          left:          0,
          width:         '28px',
          height:        '28px',
          border:        '1.5px solid #C8861E',
          transform:     'translate(-200px, -200px)',
          pointerEvents: 'none',
          zIndex:        9997,
          opacity:       0.8,
          borderRadius:  '50%',
          willChange:    'transform',
        }}
      />
      {/* Dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        suppressHydrationWarning
        style={{
          position:      'fixed',
          top:           0,
          left:          0,
          width:         '4px',
          height:        '4px',
          background:    '#C8861E',
          transform:     'translate(-200px, -200px)',
          pointerEvents: 'none',
          zIndex:        9998,
          borderRadius:  '50%',
          willChange:    'transform',
        }}
      />
    </>
  )
}
