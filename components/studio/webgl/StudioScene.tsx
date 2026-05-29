'use client'

import { useRef, useState, useMemo, useEffect, MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

// ── Arm definitions ───────────────────────────────────────────────────────────

interface ArmDef {
  id:     string
  label:  string
  sub:    string
  r:      number
  spd:    number
  phase:  number
  size:   number
  bright: boolean
}

const ARMS: ArmDef[] = [
  { id: 'capital', label: 'CAPITAL', sub: 'roadhouse.capital',        r: 5.98, spd: 0.0018, phase: 0,    size: 0.43, bright: true  },
  { id: 'motors',  label: 'MOTORS',  sub: 'motors.roadhouse.capital', r: 4.15, spd: 0.004,  phase: 2.09, size: 0.30, bright: true  },
  { id: 'studio',  label: 'STUDIO',  sub: 'studio.roadhouse.capital', r: 2.99, spd: 0.007,  phase: 4.19, size: 0.33, bright: true  },
  { id: 'faber',   label: 'FABER',   sub: 'faber.roadhouse.capital',  r: 7.97, spd: 0.0012, phase: 1.05, size: 0.22, bright: false },
]

// ── Camera waypoints — scroll-driven journey ──────────────────────────────────

const WAYPOINTS = [
  { p: 0.0, z: 9, y: 0,    fov: 55 },
  { p: 0.3, z: 6, y: 0.5,  fov: 50 },
  { p: 0.6, z: 4, y: -0.3, fov: 46 },
  { p: 1.0, z: 9, y: 0,    fov: 55 },
]

function lerpWaypoints(progress: number): { z: number; y: number; fov: number } {
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const a = WAYPOINTS[i], b = WAYPOINTS[i + 1]
    if (progress >= a.p && progress <= b.p) {
      const t = (progress - a.p) / (b.p - a.p)
      return {
        z:   a.z   + (b.z   - a.z)   * t,
        y:   a.y   + (b.y   - a.y)   * t,
        fov: a.fov + (b.fov - a.fov) * t,
      }
    }
  }
  return { z: 9, y: 0, fov: 55 }
}

// ── Scene states per scroll section ──────────────────────────────────────────

type SectionId = 'hero' | 'services' | 'process' | 'engage'

const SECTION_STATES: Record<SectionId, { rotSpeed: number; lineOpacity: number; ambient: number; particleSpeed: number }> = {
  hero:     { rotSpeed: 1.0, lineOpacity: 1.0, ambient: 0.10, particleSpeed: 1.0 },
  services: { rotSpeed: 1.3, lineOpacity: 1.2, ambient: 0.15, particleSpeed: 1.2 },
  process:  { rotSpeed: 0.6, lineOpacity: 0.8, ambient: 0.08, particleSpeed: 0.7 },
  engage:   { rotSpeed: 0.4, lineOpacity: 0.6, ambient: 0.05, particleSpeed: 0.5 },
}

function getSectionFromProgress(p: number): SectionId {
  if (p < 0.2) return 'hero'
  if (p < 0.5) return 'services'
  if (p < 0.8) return 'process'
  return 'engage'
}

// ── PraetorianCore ────────────────────────────────────────────────────────────

function PraetorianCore({ rotSpeedRef }: { rotSpeedRef: MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const s = rotSpeedRef.current
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.002 * s
      meshRef.current.rotation.y += 0.004 * s
      meshRef.current.scale.setScalar(0.96 + Math.sin(t * 0.7) * 0.04)
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.001 * s
    }
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.91, 1]} />
        <meshStandardMaterial
          color="#C8861E"
          emissive="#C8861E"
          emissiveIntensity={0.3}
          wireframe
        />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.29, 0.008, 8, 64]} />
        <meshBasicMaterial color="#C8861E" transparent opacity={0.4} />
      </mesh>
    </group>
  )
}

// ── OrbitalRing ───────────────────────────────────────────────────────────────

function OrbitalRing({ r, phase }: { r: number; phase: number }) {
  return (
    <mesh rotation={[Math.PI / 2 + Math.sin(phase) * 0.15, 0, 0]}>
      <torusGeometry args={[r, 0.004, 6, 128]} />
      <meshBasicMaterial color="#1E2024" transparent opacity={0.25} />
    </mesh>
  )
}

// ── OrbitalNode ───────────────────────────────────────────────────────────────

function OrbitalNode({
  arm,
  scrollVel,
  hoveredId,
  setHoveredId,
  lineOpacityRef,
}: {
  arm:            ArmDef
  scrollVel:      MutableRefObject<number>
  hoveredId:      string | null
  setHoveredId:   (id: string | null) => void
  lineOpacityRef: MutableRefObject<number>
}) {
  const meshRef       = useRef<THREE.Mesh>(null)
  const scaleTarget   = useRef(1.0)
  const emiTarget     = useRef(arm.bright ? 0.15 : 0.05)
  const isHov         = hoveredId === arm.id
  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    return g
  }, [])

  const lineMat = useMemo(() => new THREE.LineBasicMaterial({
    color: '#C8861E', transparent: true, opacity: 0.2,
  }), [])

  const lineObj = useMemo(() => new THREE.Line(lineGeo, lineMat), [lineGeo, lineMat])

  useEffect(() => {
    scaleTarget.current = isHov ? 1.5 : 1.0
    emiTarget.current   = isHov ? 0.6 : (arm.bright ? 0.15 : 0.05)
  }, [isHov, arm.bright])

  useFrame(({ clock }) => {
    const t         = clock.getElapsedTime()
    const vel       = reducedMotion.current ? 0 : Math.abs(scrollVel.current)
    const speedMult = 1 + vel * 15
    const x = Math.cos(t * arm.spd * speedMult + arm.phase) * arm.r
    const z = Math.sin(t * arm.spd * speedMult + arm.phase) * arm.r
    const y = Math.sin(t * arm.spd * 0.4 + arm.phase) * 0.5

    if (meshRef.current) {
      meshRef.current.position.set(x, y, z)
      const cs = meshRef.current.scale.x
      meshRef.current.scale.setScalar(cs + (scaleTarget.current - cs) * 0.12)
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity += (emiTarget.current - mat.emissiveIntensity) * 0.1
    }

    // Update connection line — no allocation
    const arr = lineGeo.attributes.position.array as Float32Array
    arr[3] = x; arr[4] = y; arr[5] = z
    lineGeo.attributes.position.needsUpdate = true
    const baseOpacity = 0.15 + Math.sin(t * 1.5 + arm.phase) * 0.08 + Math.min(vel * 0.2, 0.15)
    lineMat.opacity = baseOpacity * lineOpacityRef.current
  })

  return (
    <>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHoveredId(arm.id)
          if (typeof document !== 'undefined') document.body.style.cursor = 'crosshair'
        }}
        onPointerOut={() => {
          setHoveredId(null)
          if (typeof document !== 'undefined') document.body.style.cursor = 'default'
        }}
      >
        <icosahedronGeometry args={[arm.size, 0]} />
        <meshStandardMaterial
          color={arm.bright ? '#C8861E' : '#2A2520'}
          emissive={arm.bright ? '#C8861E' : '#1A1512'}
          emissiveIntensity={arm.bright ? 0.15 : 0.05}
        />
        {isHov && (
          <Html
            position={[0, arm.size + 0.3, 0]}
            center
            style={{ pointerEvents: 'none' }}
          >
            <div style={{ textAlign: 'center', userSelect: 'none' }}>
              <div style={{
                fontFamily:    '"DM Mono", monospace',
                fontSize:      '10px',
                color:         '#C8861E',
                letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
                whiteSpace:    'nowrap',
              }}>
                {arm.label}
              </div>
              <div style={{
                fontFamily:    '"DM Mono", monospace',
                fontSize:      '8px',
                color:         '#3A3A38',
                letterSpacing: '0.1em',
                whiteSpace:    'nowrap',
                marginTop:     '2px',
              }}>
                {arm.sub}
              </div>
            </div>
          </Html>
        )}
      </mesh>
      <primitive object={lineObj} />
    </>
  )
}

// ── ParticleField — cursor deflection + spring-back ───────────────────────────

function ParticleField({
  scrollVel,
  mouse,
  baseSpeedRef,
}: {
  scrollVel:    MutableRefObject<number>
  mouse:        MutableRefObject<{ x: number; y: number }>
  baseSpeedRef: MutableRefObject<number>
}) {
  const pointsRef = useRef<THREE.Points>(null)

  // Pre-allocated — zero GC per frame
  const raycaster  = useMemo(() => new THREE.Raycaster(), [])
  const plane      = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
  const mouseWorld = useMemo(() => new THREE.Vector3(), [])

  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  const [geo, mat, origPos] = useMemo(() => {
    const g    = new THREE.BufferGeometry()
    const pos  = new Float32Array(400 * 3)
    const orig = new Float32Array(400 * 3)
    for (let i = 0; i < 400; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = 23.24 * Math.cbrt(Math.random())
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)
      pos[i * 3]     = x; pos[i * 3 + 1]     = y; pos[i * 3 + 2]     = z
      orig[i * 3]    = x; orig[i * 3 + 1]    = y; orig[i * 3 + 2]    = z
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const m = new THREE.PointsMaterial({ size: 0.018, color: '#1E2024', sizeAttenuation: true })
    return [g, m, orig] as const
  }, [])

  useFrame(({ camera }) => {
    if (!pointsRef.current) return
    const vel = Math.abs(scrollVel.current)
    pointsRef.current.rotation.y += (0.0003 + vel * 0.01) * baseSpeedRef.current

    if (!reducedMotion.current) {
      // Project mouse NDC to world space at z=0 plane
      raycaster.setFromCamera(mouse.current as THREE.Vector2Like, camera)
      const hit = raycaster.ray.intersectPlane(plane, mouseWorld)

      if (hit) {
        // Transform mouse world pos into points local space (inverse Y rotation)
        const ry  = pointsRef.current.rotation.y
        const cos = Math.cos(-ry)
        const sin = Math.sin(-ry)
        const lmx = mouseWorld.x * cos - mouseWorld.z * sin
        const lmy = mouseWorld.y
        const lmz = mouseWorld.x * sin + mouseWorld.z * cos

        const arr    = geo.attributes.position.array as Float32Array
        const RADIUS = 1.8
        const FORCE  = 0.04
        const SPRING = 0.03

        for (let i = 0; i < 400; i++) {
          const ix = i * 3
          const dx = arr[ix]     - lmx
          const dy = arr[ix + 1] - lmy
          const dz = arr[ix + 2] - lmz
          const distSq = dx * dx + dy * dy + dz * dz

          if (distSq < RADIUS * RADIUS && distSq > 0.000001) {
            const dist = Math.sqrt(distSq)
            const push = (RADIUS - dist) / RADIUS * FORCE / dist
            arr[ix]     += dx * push
            arr[ix + 1] += dy * push
            arr[ix + 2] += dz * push
          }

          // Spring back toward original position
          arr[ix]     += (origPos[ix]     - arr[ix])     * SPRING
          arr[ix + 1] += (origPos[ix + 1] - arr[ix + 1]) * SPRING
          arr[ix + 2] += (origPos[ix + 2] - arr[ix + 2]) * SPRING
        }
        geo.attributes.position.needsUpdate = true
      }
    }
  })

  return <points ref={pointsRef} geometry={geo} material={mat} />
}

// ── StudioScene ───────────────────────────────────────────────────────────────

export default function StudioScene() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const ambientRef     = useRef<THREE.AmbientLight>(null)
  const mouse          = useRef({ x: 0, y: 0 })
  const scrollVel      = useRef(0)
  const scrollProgress = useRef(0)
  const lastScroll     = useRef(0)
  const tiltZ          = useRef(0)

  // Camera journey targets (lerped each frame)
  const cameraTargetZ = useRef(9)
  const scrollCamY    = useRef(0)
  const fovTarget     = useRef(55)

  // Scene state refs (lerped each frame)
  const coreRotSpeedRef  = useRef(1.0)
  const lineOpacityRef   = useRef(1.0)
  const ambientTargetRef = useRef(0.1)
  const particleSpeedRef = useRef(1.0)

  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth  - 0.5) * 2
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    const onScroll = () => {
      const cur        = window.scrollY
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      scrollVel.current      = (cur - lastScroll.current) * 0.002
      lastScroll.current     = cur
      scrollProgress.current = scrollable > 0 ? cur / scrollable : 0
    }
    window.addEventListener('mousemove', onMouse,  { passive: true })
    window.addEventListener('scroll',   onScroll,  { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('scroll',   onScroll)
    }
  }, [])

  useFrame(({ camera }) => {
    if (!reducedMotion.current) {
      // ── L2: Scroll-driven camera journey ──
      const wp = lerpWaypoints(scrollProgress.current)
      cameraTargetZ.current = wp.z
      scrollCamY.current    = wp.y
      fovTarget.current     = wp.fov

      camera.position.x += (mouse.current.x * 1.2 - camera.position.x) * 0.025
      camera.position.y += (scrollCamY.current + mouse.current.y * 0.6 - camera.position.y) * 0.025
      camera.position.z += (cameraTargetZ.current - camera.position.z) * 0.025

      const perspCam = camera as THREE.PerspectiveCamera
      perspCam.fov += (fovTarget.current - perspCam.fov) * 0.025
      perspCam.updateProjectionMatrix()

      // ── L3: Section state lerp ──
      const section = getSectionFromProgress(scrollProgress.current)
      const target  = SECTION_STATES[section]
      const lr      = 0.02

      coreRotSpeedRef.current  += (target.rotSpeed    - coreRotSpeedRef.current)  * lr
      lineOpacityRef.current   += (target.lineOpacity - lineOpacityRef.current)   * lr
      particleSpeedRef.current += (target.particleSpeed - particleSpeedRef.current) * lr

      ambientTargetRef.current += (target.ambient - ambientTargetRef.current) * lr
      if (ambientRef.current) ambientRef.current.intensity = ambientTargetRef.current
    } else {
      // Reduced motion: mouse parallax only, no camera journey
      camera.position.x += (mouse.current.x * 1.2 - camera.position.x) * 0.025
      camera.position.y += (mouse.current.y * 0.6  - camera.position.y) * 0.025
    }

    camera.lookAt(0, 0, 0)

    // Velocity z-tilt — stacked after lookAt
    tiltZ.current += (scrollVel.current * 0.02 - tiltZ.current) * 0.05
    camera.rotation.z += tiltZ.current
    scrollVel.current *= 0.92
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.1} />
      <pointLight position={[0, 0, 0]}    color="#C8861E" intensity={3}   distance={13.28} />
      <pointLight position={[8, 6, 4]}    color="#E8E0D0" intensity={0.4} />
      <pointLight position={[-6, -4, -8]} color="#C8861E" intensity={0.2} />

      <PraetorianCore rotSpeedRef={coreRotSpeedRef} />

      {ARMS.map((arm) => (
        <OrbitalRing key={`ring-${arm.id}`} r={arm.r} phase={arm.phase} />
      ))}

      {ARMS.map((arm) => (
        <OrbitalNode
          key={arm.id}
          arm={arm}
          scrollVel={scrollVel}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          lineOpacityRef={lineOpacityRef}
        />
      ))}

      <ParticleField
        scrollVel={scrollVel}
        mouse={mouse}
        baseSpeedRef={particleSpeedRef}
      />
    </>
  )
}
