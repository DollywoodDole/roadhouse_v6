'use client'

/**
 * WebGLBackground.jsx
 * RoadHouse Capital — Obsidian Compound ambient layer
 *
 * Drop-in replacement / overlay for the .rh-dash background.
 * Renders a Three.js particle field + slow drift geometry behind
 * all dashboard content. Zero impact on layout — position: fixed,
 * pointer-events: none, z-index: 0.
 *
 * Usage in RoadHouseDashboard.jsx:
 *   import WebGLBackground from '@/components/dashboard/WebGLBackground'
 *   // Inside the .rh-dash root div, as first child:
 *   <WebGLBackground />
 *
 * Deps (already in package.json or add once):
 *   npm install three
 *
 * Brand tokens (from CLAUDE.md dashboard design system):
 *   --bg      #0a0a08
 *   --accent  #e8c84a   (gold)
 *   --accent2 #ff5c35   (ember)
 *   --accent3 #4af0c8   (teal)
 */

import { useEffect, useRef, useCallback } from 'react'

// ─── constants ───────────────────────────────────────────────────────────────

const BG          = 0x0a0a08
const GOLD        = 0xe8c84a
const EMBER       = 0xff5c35
const TEAL        = 0x4af0c8
const WARM_WHITE  = 0xede8dc

const PARTICLE_COUNT  = 420
const RING_SEGMENTS   = 64
const MOUSE_STRENGTH  = 0.06   // how hard mouse nudges particles
const DRIFT_SPEED     = 0.00018

// ─── component ───────────────────────────────────────────────────────────────

export default function WebGLBackground({ className = '' }) {
  const mountRef  = useRef(null)
  const stateRef  = useRef({})  // holds THREE objects across renders

  const handleResize = useCallback(() => {
    const s = stateRef.current
    if (!s.renderer || !s.camera) return
    s.renderer.setSize(window.innerWidth, window.innerHeight)
    s.camera.aspect = window.innerWidth / window.innerHeight
    s.camera.updateProjectionMatrix()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let THREE
    let animId

    // Dynamic import so Next.js SSR doesn't choke
    import('three').then((mod) => {
      THREE = mod

      const W = window.innerWidth
      const H = window.innerHeight

      // ── renderer ────────────────────────────────────────────────────────────
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'low-power',
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.setSize(W, H)
      renderer.setClearColor(BG, 1)
      mountRef.current?.appendChild(renderer.domElement)

      // ── scene / camera ───────────────────────────────────────────────────────
      const scene  = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200)
      camera.position.set(0, 0, 28)

      // ── ambient fog to soften far geometry ───────────────────────────────────
      scene.fog = new THREE.FogExp2(BG, 0.022)

      // ── particles ────────────────────────────────────────────────────────────
      const positions  = new Float32Array(PARTICLE_COUNT * 3)
      const colors     = new Float32Array(PARTICLE_COUNT * 3)
      const sizes      = new Float32Array(PARTICLE_COUNT)
      const velocities = []  // stored separately (not a buffer attr)

      const palette = [GOLD, EMBER, TEAL, WARM_WHITE, WARM_WHITE]  // weighted towards warm

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        // spherical distribution with slight disk bias
        const theta  = Math.random() * Math.PI * 2
        const phi    = Math.acos(2 * Math.random() - 1)
        const r      = 10 + Math.random() * 22

        positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55  // squash Y
        positions[i * 3 + 2] = r * Math.cos(phi)

        // velocity: slow constant drift + random jitter seed
        velocities.push({
          x: (Math.random() - 0.5) * 0.004,
          y: (Math.random() - 0.5) * 0.002,
          z: (Math.random() - 0.5) * 0.003,
          phase: Math.random() * Math.PI * 2,
          speed: 0.3 + Math.random() * 0.7,
        })

        const hex   = palette[Math.floor(Math.random() * palette.length)]
        const c     = new THREE.Color(hex)
        // dim most particles; a few pop bright
        const bright = Math.random() < 0.12 ? 1.0 : 0.15 + Math.random() * 0.3
        colors[i * 3]     = c.r * bright
        colors[i * 3 + 1] = c.g * bright
        colors[i * 3 + 2] = c.b * bright

        sizes[i] = 1.2 + Math.random() * 2.8
      }

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geo.setAttribute('color',    new THREE.BufferAttribute(colors,    3))
      geo.setAttribute('size',     new THREE.BufferAttribute(sizes,     1))

      // Custom shader material — soft round points, vertex-colored
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime:       { value: 0 },
          uPixelRatio: { value: renderer.getPixelRatio() },
        },
        vertexShader: /* glsl */`
          attribute float size;
          varying vec3 vColor;
          uniform float uPixelRatio;
          void main() {
            vColor = color;
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * uPixelRatio * (280.0 / -mvPos.z);
            gl_Position  = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: /* glsl */`
          varying vec3 vColor;
          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            if (d > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.25, 0.5, d);
            gl_FragColor = vec4(vColor, alpha * 0.72);
          }
        `,
        vertexColors:  true,
        transparent:   true,
        depthWrite:    false,
        blending:      THREE.AdditiveBlending,
      })

      const particles = new THREE.Points(geo, mat)
      scene.add(particles)

      // ── floating rings ────────────────────────────────────────────────────────
      const rings = []

      const ringDefs = [
        { radius: 6.5,  tube: 0.012, color: GOLD,  opacity: 0.18, tiltX: 0.4,  tiltZ: 0.2,  speed: 0.00022 },
        { radius: 11.0, tube: 0.008, color: TEAL,  opacity: 0.12, tiltX: -0.6, tiltZ: 0.5,  speed: -0.00015 },
        { radius: 15.5, tube: 0.006, color: EMBER, opacity: 0.10, tiltX: 0.2,  tiltZ: -0.3, speed: 0.00010 },
      ]

      for (const def of ringDefs) {
        const rGeo = new THREE.TorusGeometry(def.radius, def.tube, 4, RING_SEGMENTS)
        const rMat = new THREE.MeshBasicMaterial({
          color:       def.color,
          transparent: true,
          opacity:     def.opacity,
          depthWrite:  false,
        })
        const ring = new THREE.Mesh(rGeo, rMat)
        ring.rotation.x = def.tiltX
        ring.rotation.z = def.tiltZ
        ring.userData    = { speed: def.speed }
        scene.add(ring)
        rings.push(ring)
      }

      // ── subtle horizon glow plane ─────────────────────────────────────────────
      const glowGeo = new THREE.PlaneGeometry(120, 8)
      const glowMat = new THREE.MeshBasicMaterial({
        color:       GOLD,
        transparent: true,
        opacity:     0.018,
        depthWrite:  false,
        side:        THREE.DoubleSide,
      })
      const glow = new THREE.Mesh(glowGeo, glowMat)
      glow.position.set(0, -9, -18)
      scene.add(glow)

      // ── mouse influence ───────────────────────────────────────────────────────
      const mouse = { x: 0, y: 0, tx: 0, ty: 0 }

      const onMouseMove = (e) => {
        mouse.tx = (e.clientX / window.innerWidth  - 0.5) * 2
        mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2
      }
      window.addEventListener('mousemove', onMouseMove, { passive: true })

      // ── animation loop ────────────────────────────────────────────────────────
      let t = 0

      const tick = () => {
        animId = requestAnimationFrame(tick)
        t += DRIFT_SPEED

        // lerp mouse
        mouse.x += (mouse.tx - mouse.x) * 0.04
        mouse.y += (mouse.ty - mouse.y) * 0.04

        // camera subtle parallax from mouse
        camera.position.x += (mouse.x * 1.8 - camera.position.x) * 0.02
        camera.position.y += (-mouse.y * 1.2 - camera.position.y) * 0.02
        camera.lookAt(0, 0, 0)

        // update particle positions
        const pos = geo.attributes.position.array
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const v = velocities[i]
          pos[i * 3]     += v.x + Math.sin(t * v.speed + v.phase) * 0.002
          pos[i * 3 + 1] += v.y + Math.cos(t * v.speed + v.phase * 1.3) * 0.0015
          pos[i * 3 + 2] += v.z

          // wrap: keep particles in sphere
          const dx = pos[i * 3]
          const dy = pos[i * 3 + 1]
          const dz = pos[i * 3 + 2]
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (dist > 34) {
            pos[i * 3]     *= 0.3
            pos[i * 3 + 1] *= 0.3
            pos[i * 3 + 2] *= 0.3
          }
        }
        geo.attributes.position.needsUpdate = true

        // rotate rings
        for (const ring of rings) {
          ring.rotation.y += ring.userData.speed
        }

        // breathe glow
        glowMat.opacity = 0.012 + Math.sin(t * 60) * 0.006

        mat.uniforms.uTime.value = t

        renderer.render(scene, camera)
      }

      tick()

      // stash refs for cleanup + resize
      stateRef.current = { renderer, camera, scene }

      window.addEventListener('resize', handleResize)

      // cleanup
      return () => {
        cancelAnimationFrame(animId)
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('mousemove', onMouseMove)
        renderer.dispose()
        geo.dispose()
        mat.dispose()
        if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
          mountRef.current.removeChild(renderer.domElement)
        }
      }
    })

    return () => {
      if (animId) cancelAnimationFrame(animId)
    }
  }, [handleResize])

  return (
    <div
      ref={mountRef}
      className={className}
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        0,
        pointerEvents: 'none',
        overflow:      'hidden',
      }}
      aria-hidden="true"
    />
  )
}
