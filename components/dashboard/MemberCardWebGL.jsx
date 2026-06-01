'use client'

/**
 * MemberCardWebGL.jsx
 * RoadHouse Capital — Obsidian Compound member hero card
 *
 * Replaces / wraps the existing MemberProfileCard in RoadHouse.jsx.
 * Adds a Three.js canvas directly behind the card content with:
 *   - Holographic foil shimmer plane (iridescent shader, mouse-reactive)
 *   - Floating tier-glyph geometry (icosahedron for Founder/Praetor, etc.)
 *   - Scanline + grain overlay via CSS (no extra canvas)
 *   - Subtle card tilt parallax on hover
 *
 * Usage in RoadHouse.jsx (MY ROADHOUSE tab):
 *   import MemberCardWebGL from '@/components/dashboard/MemberCardWebGL'
 *
 *   <MemberCardWebGL
 *     alias={profile.alias}
 *     tier={memberTier}           // 'founding' | 'regular' | 'ranch-hand' | 'partner' | 'steward' | 'praetor'
 *     roadBalance={roadBalance}   // number
 *     avatarUrl={profile.avatarUrl}
 *     joinDate={profile.joinDate}
 *   />
 *
 * Deps: npm install three
 *
 * Brand tokens: see CLAUDE.md dashboard design system
 *   panel #111110 · border #1e1e1c · accent #e8c84a · accent2 #ff5c35 · accent3 #4af0c8
 *   fonts: Space Mono · Bebas Neue · Syne
 */

import { useEffect, useRef, useState, useCallback } from 'react'

// ─── tier config ─────────────────────────────────────────────────────────────

const TIER_META = {
  guest:      { label: 'Guest',      color: '#5a5550', glyph: 'tetra',   accentHex: 0x5a5550 },
  regular:    { label: 'Regular',    color: '#ede8dc', glyph: 'octa',    accentHex: 0xede8dc },
  'ranch-hand': { label: 'Ranch Hand', color: '#e8c84a', glyph: 'icosa',  accentHex: 0xe8c84a },
  partner:    { label: 'Partner',    color: '#ff5c35', glyph: 'icosa',   accentHex: 0xff5c35 },
  founding:   { label: 'Founding',   color: '#e8c84a', glyph: 'icosa',   accentHex: 0xe8c84a },
  steward:    { label: 'Steward',    color: '#4af0c8', glyph: 'dodeca',  accentHex: 0x4af0c8 },
  praetor:    { label: 'Praetor',    color: '#e8c84a', glyph: 'icosa',   accentHex: 0xe8c84a },
}

function getTierMeta(tier) {
  return TIER_META[tier] ?? TIER_META['regular']
}

// ─── format helpers ───────────────────────────────────────────────────────────

function fmtRoad(n) {
  if (!n && n !== 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k'
  return n.toLocaleString()
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short' })
}

// ─── WebGL canvas hook ────────────────────────────────────────────────────────

function useCardGL(canvasRef, tier, mouse) {
  useEffect(() => {
    if (typeof window === 'undefined' || !canvasRef.current) return
    const canvas = canvasRef.current
    const meta   = getTierMeta(tier)
    let animId

    import('three').then((THREE) => {
      const W = canvas.clientWidth  || 360
      const H = canvas.clientHeight || 180

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(W, H, false)
      renderer.setClearColor(0x000000, 0)

      const scene  = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 100)
      camera.position.z = 10

      // ── holographic foil plane ───────────────────────────────────────────────
      const foilGeo = new THREE.PlaneGeometry(W, H)
      const foilMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime:   { value: 0 },
          uMouse:  { value: new THREE.Vector2(0.5, 0.5) },
          uAccent: { value: new THREE.Color(meta.accentHex) },
        },
        vertexShader: /* glsl */`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */`
          uniform float    uTime;
          uniform vec2     uMouse;
          uniform vec3     uAccent;
          varying vec2     vUv;

          // HSL to RGB
          vec3 hsl2rgb(float h, float s, float l) {
            vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
            return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
          }

          void main() {
            vec2 uv = vUv;

            // angled shimmer bands driven by mouse
            float angle  = 0.4 + uMouse.x * 0.5;
            float bands  = uv.x * cos(angle) + uv.y * sin(angle);
            float hue    = mod(bands * 3.0 + uTime * 0.15 + uMouse.y * 0.8, 1.0);
            vec3  foil   = hsl2rgb(hue, 0.65, 0.55);

            // blend foil with accent tint
            vec3  col    = mix(foil, uAccent, 0.35);

            // vignette
            float dist   = distance(uv, vec2(0.5));
            float vig    = 1.0 - smoothstep(0.3, 0.85, dist);

            // edge glow along top
            float topGlow = smoothstep(0.92, 1.0, uv.y) * 0.6;

            float alpha  = vig * 0.08 + topGlow * 0.12;

            gl_FragColor = vec4(col, alpha);
          }
        `,
        transparent: true,
        depthWrite:  false,
        blending:    THREE.AdditiveBlending,
      })
      const foil = new THREE.Mesh(foilGeo, foilMat)
      scene.add(foil)

      // ── tier glyph (floating polyhedron) ─────────────────────────────────────
      let glyphGeo
      switch (meta.glyph) {
        case 'tetra':  glyphGeo = new THREE.TetrahedronGeometry(18);   break
        case 'octa':   glyphGeo = new THREE.OctahedronGeometry(18);    break
        case 'dodeca': glyphGeo = new THREE.DodecahedronGeometry(18);  break
        case 'icosa':
        default:       glyphGeo = new THREE.IcosahedronGeometry(18);   break
      }

      const glyphMat = new THREE.MeshBasicMaterial({
        color:       meta.accentHex,
        wireframe:   true,
        transparent: true,
        opacity:     0.14,
      })
      const glyph = new THREE.Mesh(glyphGeo, glyphMat)
      glyph.position.set(W * 0.35, -10, 0)
      scene.add(glyph)

      // ── corner accent lines ───────────────────────────────────────────────────
      const lineMat = new THREE.LineBasicMaterial({
        color:       meta.accentHex,
        transparent: true,
        opacity:     0.22,
      })

      const cornerSize = 28
      const pad = 16
      const corners = [
        // top-left
        [ [-W/2+pad, H/2-pad-cornerSize, 0], [-W/2+pad, H/2-pad, 0], [-W/2+pad+cornerSize, H/2-pad, 0] ],
        // top-right
        [ [W/2-pad-cornerSize, H/2-pad, 0], [W/2-pad, H/2-pad, 0], [W/2-pad, H/2-pad-cornerSize, 0] ],
        // bottom-left
        [ [-W/2+pad, -H/2+pad+cornerSize, 0], [-W/2+pad, -H/2+pad, 0], [-W/2+pad+cornerSize, -H/2+pad, 0] ],
        // bottom-right
        [ [W/2-pad-cornerSize, -H/2+pad, 0], [W/2-pad, -H/2+pad, 0], [W/2-pad, -H/2+pad+cornerSize, 0] ],
      ]
      for (const pts of corners) {
        const cGeo = new THREE.BufferGeometry().setFromPoints(
          pts.map(p => new THREE.Vector3(...p))
        )
        scene.add(new THREE.Line(cGeo, lineMat))
      }

      // ── scanline plane ────────────────────────────────────────────────────────
      const scanMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */`
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }
        `,
        fragmentShader: /* glsl */`
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            float lines  = step(0.5, fract(vUv.y * 120.0));
            float scroll = smoothstep(0.0, 0.12, abs(fract(vUv.y - uTime * 0.18) - 0.5) - 0.34);
            gl_FragColor = vec4(0.0, 0.0, 0.0, lines * 0.045 + scroll * 0.025);
          }
        `,
        transparent: true,
        depthWrite:  false,
      })
      const scan = new THREE.Mesh(new THREE.PlaneGeometry(W, H), scanMat)
      scan.position.z = 1
      scene.add(scan)

      // ── tick ─────────────────────────────────────────────────────────────────
      let t = 0
      const tick = () => {
        animId = requestAnimationFrame(tick)
        t += 0.008

        foilMat.uniforms.uTime.value  = t
        foilMat.uniforms.uMouse.value.set(mouse.current.x, mouse.current.y)
        scanMat.uniforms.uTime.value  = t

        glyph.rotation.x = t * 0.18
        glyph.rotation.y = t * 0.25
        glyph.position.x = W * 0.34 + Math.sin(t * 0.4) * 5
        glyph.position.y = -8 + Math.cos(t * 0.3) * 4

        renderer.render(scene, camera)
      }
      tick()

      // cleanup on unmount / tier change
      return () => {
        cancelAnimationFrame(animId)
        renderer.dispose()
        foilGeo.dispose(); foilMat.dispose()
        glyphGeo.dispose(); glyphMat.dispose()
        scanMat.dispose()
      }
    })
  }, [tier, canvasRef])  // re-run if tier changes (redraws with new accent)
}

// ─── component ───────────────────────────────────────────────────────────────

export default function MemberCardWebGL({
  alias       = 'Member',
  tier        = 'regular',
  roadBalance = 0,
  avatarUrl   = null,
  joinDate    = null,
}) {
  const canvasRef = useRef(null)
  const cardRef   = useRef(null)
  const mouse     = useRef({ x: 0.5, y: 0.5 })

  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })

  const meta = getTierMeta(tier)

  // mouse tracking for tilt + shader
  const onMouseMove = useCallback((e) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const nx = (e.clientX - rect.left) / rect.width
    const ny = (e.clientY - rect.top)  / rect.height
    mouse.current = { x: nx, y: ny }
    setTilt({
      rx: (ny - 0.5) * -10,
      ry: (nx - 0.5) *  12,
    })
  }, [])

  const onMouseLeave = useCallback(() => {
    mouse.current = { x: 0.5, y: 0.5 }
    setTilt({ rx: 0, ry: 0 })
  }, [])

  useCardGL(canvasRef, tier, mouse)

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        position:     'relative',
        width:        '100%',
        borderRadius: '10px',
        overflow:     'hidden',
        background:   '#111110',
        border:       `1px solid #1e1e1c`,
        transform:    `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition:   'transform 0.08s ease-out',
        willChange:   'transform',
        cursor:       'default',
        userSelect:   'none',
      }}
    >
      {/* WebGL canvas — fills the card bg */}
      <canvas
        ref={canvasRef}
        style={{
          position:      'absolute',
          inset:         0,
          width:         '100%',
          height:        '100%',
          pointerEvents: 'none',
          display:       'block',
        }}
        aria-hidden="true"
      />

      {/* grain overlay */}
      <div style={{
        position:      'absolute',
        inset:         0,
        pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
        backgroundSize: '160px',
        opacity: 0.6,
        zIndex: 1,
      }} />

      {/* card content */}
      <div style={{
        position: 'relative',
        zIndex:   2,
        padding:  '24px 28px 22px',
        display:  'flex',
        flexDirection: 'column',
        gap:      '14px',
      }}>

        {/* top row: avatar + identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* avatar */}
          <div style={{
            width:        52,
            height:       52,
            borderRadius: '50%',
            border:       `1.5px solid ${meta.color}44`,
            overflow:     'hidden',
            flexShrink:   0,
            background:   '#1a1712',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            fontFamily:   'Bebas Neue, sans-serif',
            fontSize:     22,
            color:        meta.color,
            letterSpacing: '0.04em',
          }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (alias?.[0] ?? '?').toUpperCase()
            }
          </div>

          {/* name + tier badge */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily:    'Bebas Neue, sans-serif',
              fontSize:      22,
              letterSpacing: '0.06em',
              color:         '#ede8dc',
              lineHeight:    1.1,
              whiteSpace:    'nowrap',
              overflow:      'hidden',
              textOverflow:  'ellipsis',
            }}>
              {alias}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              {/* tier pill */}
              <span style={{
                fontFamily:    'Space Mono, monospace',
                fontSize:      10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color:         meta.color,
                border:        `1px solid ${meta.color}55`,
                borderRadius:  3,
                padding:       '2px 7px',
                lineHeight:    1.6,
              }}>
                {meta.label}
              </span>
              {joinDate && (
                <span style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize:   10,
                  color:      '#5a5550',
                  letterSpacing: '0.06em',
                }}>
                  since {fmtDate(joinDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* divider */}
        <div style={{ height: '1px', background: '#1e1e1c' }} />

        {/* stats row */}
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { label: '$ROAD Balance', value: fmtRoad(roadBalance), accent: meta.color },
            { label: 'Network',       value: 'Solana',             accent: '#4af0c8' },
            { label: 'Status',        value: 'Active',             accent: '#4b7c50' },
          ].map((stat, i) => (
            <div key={i} style={{
              flex:        1,
              paddingLeft: i > 0 ? 16 : 0,
              borderLeft:  i > 0 ? '1px solid #1e1e1c' : 'none',
              marginLeft:  i > 0 ? 16 : 0,
            }}>
              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontSize:   10,
                color:      '#5a5550',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 3,
              }}>
                {stat.label}
              </div>
              <div style={{
                fontFamily: 'Space Mono, monospace',
                fontSize:   15,
                color:      stat.accent,
                fontWeight: 700,
                letterSpacing: '0.03em',
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* bottom accent line */}
        <div style={{
          height:     '2px',
          background: `linear-gradient(90deg, ${meta.color}88 0%, transparent 80%)`,
          borderRadius: 1,
          marginTop:  2,
        }} />

      </div>
    </div>
  )
}
