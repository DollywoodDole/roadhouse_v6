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
  { id: 'capital', label: 'CAPITAL', sub: 'roadhouse.capital',        r: 3.6, spd: 0.0018, phase: 0,    size: 0.26, bright: true  },
  { id: 'motors',  label: 'MOTORS',  sub: 'motors.roadhouse.capital', r: 2.5, spd: 0.004,  phase: 2.09, size: 0.18, bright: true  },
  { id: 'studio',  label: 'STUDIO',  sub: 'studio.roadhouse.capital', r: 1.8, spd: 0.007,  phase: 4.19, size: 0.20, bright: true  },
  { id: 'faber',   label: 'FABER',   sub: 'faber.roadhouse.capital',  r: 4.8, spd: 0.0012, phase: 1.05, size: 0.13, bright: false },
]

// ── PraetorianCore ────────────────────────────────────────────────────────────

function PraetorianCore() {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.002
      meshRef.current.rotation.y += 0.004
      meshRef.current.scale.setScalar(0.96 + Math.sin(t * 0.7) * 0.04)
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.001
    }
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial
          color="#C8861E"
          emissive="#C8861E"
          emissiveIntensity={0.3}
          wireframe
        />
      </mesh>
      {/* Outer glow ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.78, 0.008, 8, 64]} />
        <meshBasicMaterial color="#C8861E" transparent opacity={0.4} />
      </mesh>
    </group>
  )
}

// ── OrbitalRing — subtle path indicator ───────────────────────────────────────

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
}: {
  arm:          ArmDef
  scrollVel:    MutableRefObject<number>
  hoveredId:    string | null
  setHoveredId: (id: string | null) => void
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

    // Update connection line end vertex — no allocation
    const arr = lineGeo.attributes.position.array as Float32Array
    arr[3] = x; arr[4] = y; arr[5] = z
    lineGeo.attributes.position.needsUpdate = true
    lineMat.opacity = 0.15 + Math.sin(t * 1.5 + arm.phase) * 0.08
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

// ── ParticleField ─────────────────────────────────────────────────────────────

function ParticleField({ scrollVel }: { scrollVel: MutableRefObject<number> }) {
  const pointsRef = useRef<THREE.Points>(null)

  const [geo, mat] = useMemo(() => {
    const g   = new THREE.BufferGeometry()
    const pos = new Float32Array(400 * 3)
    for (let i = 0; i < 400; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = 14 * Math.cbrt(Math.random())
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const m = new THREE.PointsMaterial({ size: 0.018, color: '#1E2024', sizeAttenuation: true })
    return [g, m] as const
  }, [])

  useFrame(() => {
    if (!pointsRef.current) return
    const vel = Math.abs(scrollVel.current)
    pointsRef.current.rotation.y += 0.0003 + vel * 0.01
  })

  return <points ref={pointsRef} geometry={geo} material={mat} />
}

// ── StudioScene ───────────────────────────────────────────────────────────────

export default function StudioScene() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const mouse      = useRef({ x: 0, y: 0 })
  const scrollVel  = useRef(0)
  const lastScroll = useRef(0)

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth  - 0.5) * 2
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    const onScroll = () => {
      const cur = window.scrollY
      scrollVel.current  = (cur - lastScroll.current) * 0.002
      lastScroll.current = cur
    }
    window.addEventListener('mousemove', onMouse,  { passive: true })
    window.addEventListener('scroll',   onScroll,  { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('scroll',   onScroll)
    }
  }, [])

  useFrame(({ camera }) => {
    camera.position.x += (mouse.current.x * 1.2 - camera.position.x) * 0.025
    camera.position.y += (mouse.current.y * 0.6 - camera.position.y) * 0.025
    camera.lookAt(0, 0, 0)
    scrollVel.current *= 0.92
  })

  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0, 0]}   color="#C8861E" intensity={3} distance={8} />
      <pointLight position={[8, 6, 4]}   color="#E8E0D0" intensity={0.4} />
      <pointLight position={[-6, -4, -8]} color="#C8861E" intensity={0.2} />

      <PraetorianCore />

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
        />
      ))}

      <ParticleField scrollVel={scrollVel} />
    </>
  )
}
