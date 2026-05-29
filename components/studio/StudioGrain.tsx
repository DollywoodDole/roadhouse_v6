'use client'

import { useEffect, useRef } from 'react'

export default function StudioGrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef  = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    const render = () => {
      const { width, height } = canvas
      const image = ctx.createImageData(width, height)
      const data  = image.data
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0
        data[i]     = v
        data[i + 1] = v
        data[i + 2] = v
        data[i + 3] = 22
      }
      ctx.putImageData(image, 0, 0)
      frameRef.current = requestAnimationFrame(render)
    }
    render()

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        8000,
        pointerEvents: 'none',
        opacity:       0.032,
        mixBlendMode:  'overlay',
      }}
    />
  )
}
