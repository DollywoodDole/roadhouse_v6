'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import StudioScene from './StudioScene'

export default function StudioWebGL() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        style={{ background: '#07080A' }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <StudioScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
