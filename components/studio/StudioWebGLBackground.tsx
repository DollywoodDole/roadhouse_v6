'use client'

import { StudioWebGLDynamic } from './webgl'

export default function StudioWebGLBackground() {
  return (
    <>
      {/* Layer 0: WebGL canvas — fixed, never remounts */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <StudioWebGLDynamic />
      </div>

      {/* Layer 1: gradient veil — fixed between WebGL and page content */}
      <div
        aria-hidden="true"
        style={{
          position:      'fixed',
          inset:         0,
          zIndex:        1,
          pointerEvents: 'none',
          background:    'linear-gradient(to bottom, rgba(7,8,10,0.0) 0%, rgba(7,8,10,0.2) 30%, rgba(7,8,10,0.75) 65%, rgba(7,8,10,1.0) 100%)',
        }}
      />
    </>
  )
}
