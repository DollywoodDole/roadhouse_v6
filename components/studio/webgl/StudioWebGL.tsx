'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import StudioScene from './StudioScene'

export default function StudioWebGL() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 9], fov: 55 }}
        style={{ background: '#07080A', width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={typeof window !== 'undefined' ? [1, Math.min(window.devicePixelRatio, 2)] : 1}
      >
        <Suspense fallback={null}>
          <StudioScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
