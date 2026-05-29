'use client'

import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

// ── Types ─────────────────────────────────────────────────────────────────────

interface NodeDef {
  id:    string
  label: string
  orbit: number
  speed: number
  phase: number
  size:  number
  color: string
}

// ── Data ──────────────────────────────────────────────────────────────────────

const NODE_DEFS: NodeDef[] = [
  { id: 'motors',  label: 'MOTORS',  orbit: 2.8, speed: 0.004,  phase: 0,   size: 0.18, color: '#C8861E' },
  { id: 'studio',  label: 'STUDIO',  orbit: 2.0, speed: 0.007,  phase: 2.1, size: 0.22, color: '#E8E0D0' },
  { id: 'capital', label: 'CAPITAL', orbit: 3.8, speed: 0.002,  phase: 1.0, size: 0.28, color: '#C8861E' },
  { id: 'faber',   label: 'FABER',   orbit: 4.8, speed: 0.0015, phase: 4.2, size: 0.14, color: '#3A3A38' },
]

// ── PraetorianCore — central amber icosahedron ─────────────────────────────

function PraetorianCore() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x += 0.003
    meshRef.current.rotation.y += 0.005
    const pulse = Math.sin(clock.getElapsedTime() * 0.8) * 0.05 + 1.0
    meshRef.current.scale.setScalar(0.95 + (pulse - 0.95))
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.6, 1]} />
      <meshBasicMaterial color="#C8861E" wireframe transparent opacity={0.7} />
    </mesh>
  )
}

// ── OrbitalNode — one sphere + connection line + hover label ───────────────

function OrbitalNode({ def }: { def: NodeDef }) {
  const meshRef     = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const scaleTarget = useRef(1.0)

  const lineGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    return geo
  }, [])

  const lineMat = useMemo(() => new THREE.LineBasicMaterial({
    color:       '#C8861E',
    transparent: true,
    opacity:     0.4,
  }), [])

  const lineObj = useMemo(() => new THREE.Line(lineGeo, lineMat), [lineGeo, lineMat])

  useEffect(() => {
    scaleTarget.current = hovered ? 1.4 : 1.0
  }, [hovered])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const x = Math.cos(t * def.speed + def.phase) * def.orbit
    const z = Math.sin(t * def.speed + def.phase) * def.orbit
    const y = Math.sin(t * def.speed * 0.3 + def.phase) * 0.4

    if (meshRef.current) {
      meshRef.current.position.set(x, y, z)
      const current = meshRef.current.scale.x
      const next    = current + (scaleTarget.current - current) * 0.1
      meshRef.current.scale.setScalar(next)
    }

    // Update line end vertex in-place — no allocation
    const arr = lineGeo.attributes.position.array as Float32Array
    arr[3] = x
    arr[4] = y
    arr[5] = z
    lineGeo.attributes.position.needsUpdate = true

    // Pulse line opacity
    lineMat.opacity = Math.sin(t * 1.2 + def.phase) * 0.3 + 0.4
  })

  return (
    <>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[def.size, 16, 12]} />
        <meshStandardMaterial
          color={def.color}
          roughness={0.4}
          metalness={0.2}
        />
        {hovered && (
          <Html
            position={[0, def.size + 0.22, 0]}
            center
            style={{ pointerEvents: 'none' }}
          >
            <span style={{
              display:       'block',
              fontFamily:    '"DM Mono", monospace',
              fontSize:      '9px',
              color:         '#C8861E',
              letterSpacing: '0.18em',
              textTransform: 'uppercase' as const,
              whiteSpace:    'nowrap',
              userSelect:    'none',
            }}>
              {def.label}
            </span>
          </Html>
        )}
      </mesh>
      <primitive object={lineObj} />
    </>
  )
}

// ── ParticleField — 300 random points slowly rotating ─────────────────────

function ParticleField() {
  const meshRef = useRef<THREE.Points>(null)

  const geo = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const count    = 300
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const r     = 12 * Math.cbrt(Math.random())
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [])

  const mat = useMemo(
    () => new THREE.PointsMaterial({ size: 0.015, color: '#3A3A38', sizeAttenuation: true }),
    []
  )

  useFrame(() => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += 0.0005
    meshRef.current.rotation.x += 0.0002
  })

  return <points ref={meshRef} geometry={geo} material={mat} />
}

// ── StudioScene — main scene: camera parallax + scene graph ───────────────

export default function StudioScene() {
  const mouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', handler, { passive: true })
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  useFrame(({ camera }) => {
    camera.position.x += (mouse.current.x * 0.8 - camera.position.x) * 0.02
    camera.position.y += (mouse.current.y * 0.4 - camera.position.y) * 0.02
  })

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]} color="#C8861E" intensity={2} />
      <pointLight position={[10, 5, 10]} color="#ffffff" intensity={0.3} />

      <PraetorianCore />

      {NODE_DEFS.map((def) => (
        <OrbitalNode key={def.id} def={def} />
      ))}

      <ParticleField />
    </>
  )
}
