'use client'

import { useRef, ReactNode } from 'react'
import gsap from 'gsap'

interface Props {
  children: ReactNode
  strength?: number
  style?: React.CSSProperties
}

export default function MagneticButton({ children, strength = 0.35, style }: Props) {
  const wrapRef  = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    const x    = e.clientX - rect.left - rect.width  / 2
    const y    = e.clientY - rect.top  - rect.height / 2
    gsap.to(innerRef.current, {
      x: x * strength,
      y: y * strength,
      duration: 0.35,
      ease: 'power2.out',
    })
  }

  const onLeave = () => {
    gsap.to(innerRef.current, {
      x: 0,
      y: 0,
      duration: 0.6,
      ease: 'power3.out',
    })
  }

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ display: 'inline-block', ...style }}
    >
      <div ref={innerRef}>
        {children}
      </div>
    </div>
  )
}
