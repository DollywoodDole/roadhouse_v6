'use client'

import { useEffect, useRef, useState } from 'react'

const NAV_LINKS = [
  { label: 'Work',    href: '#work' },
  { label: 'House',   href: '#house' },
  { label: 'Contact', href: '#contact' },
]

const BASE_SHADOW  = '0 0 6px rgba(200,134,30,0.6), 0 0 12px rgba(200,134,30,0.3), 0 0 24px rgba(200,134,30,0.15), inset 0 0 6px rgba(200,134,30,0.1)'
const HOVER_SHADOW = '0 0 10px rgba(200,134,30,0.9), 0 0 20px rgba(200,134,30,0.5), 0 0 40px rgba(200,134,30,0.25), inset 0 0 10px rgba(200,134,30,0.15)'

export default function StudioNav() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const rsMarkRef   = useRef<HTMLDivElement>(null)
  const isHoveredRef = useRef(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Prevent body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  // Active nav state via IntersectionObserver — no React state, DOM only
  useEffect(() => {
    const setActive = (id: string) => {
      document.querySelectorAll('.studio-nav-link').forEach((el) => {
        const isActive = (el as HTMLAnchorElement).getAttribute('href') === `#${id}`
        ;(el as HTMLElement).style.color = isActive ? '#C8861E' : '#878070'
      })
    }
    const sections = ['work', 'house', 'contact']
    const observers: IntersectionObserver[] = []
    sections.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id) },
        { rootMargin: '-10% 0px -75% 0px' }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  // Velocity-reactive glow on RS mark — reads --scroll-velocity from Lenis
  useEffect(() => {
    let rafId: number
    const loop = () => {
      if (rsMarkRef.current) {
        if (isHoveredRef.current) {
          rsMarkRef.current.style.boxShadow = HOVER_SHADOW
        } else {
          const vel = parseFloat(
            getComputedStyle(document.documentElement)
              .getPropertyValue('--scroll-velocity') || '0'
          )
          const i = Math.min(Math.abs(vel) * 0.3, 1.0)
          rsMarkRef.current.style.boxShadow = [
            `0 0 ${(6 + i * 8).toFixed(1)}px rgba(200,134,30,${(0.6 + i * 0.3).toFixed(2)})`,
            `0 0 ${(12 + i * 16).toFixed(1)}px rgba(200,134,30,${(0.3 + i * 0.2).toFixed(2)})`,
            `0 0 ${(24 + i * 20).toFixed(1)}px rgba(200,134,30,0.15)`,
            'inset 0 0 6px rgba(200,134,30,0.1)',
          ].join(', ')
        }
      }
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      {/* Skip to content — keyboard users */}
      <a
        href="#work"
        style={{
          position:       'absolute',
          top:            '-100%',
          left:           0,
          padding:        '8px 16px',
          background:     '#C8861E',
          color:          '#07080A',
          fontFamily:     'var(--font-dm-mono-studio)',
          fontSize:       '11px',
          letterSpacing:  '0.1em',
          textTransform:  'uppercase' as const,
          textDecoration: 'none',
          zIndex:         200,
          fontWeight:     500,
        }}
        onFocus={(e) => { e.currentTarget.style.top = '0' }}
        onBlur={(e)  => { e.currentTarget.style.top = '-100%' }}
      >
        Skip to content
      </a>

      <header
        data-studio-nav
        style={{
          background:           scrolled ? 'rgba(7,8,10,0.92)' : 'transparent',
          backdropFilter:       scrolled ? 'blur(14px)'         : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(14px)'         : 'none',
          borderBottom:         scrolled
            ? '1px solid rgba(200,134,30,0.15)'
            : '1px solid transparent',
          boxShadow: scrolled
            ? '0 1px 0 0 rgba(200,134,30,0.08), 0 4px 12px rgba(7,8,10,0.8)'
            : 'none',
          position:   'sticky',
          top:        0,
          zIndex:     100,
          transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        <div style={{
          maxWidth:       '1400px',
          margin:         '0 auto',
          padding:        '0 1.5rem',
          height:         '64px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
        }}>

          {/* Mark + logo + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

            {/* A: RS box mark — amber neon bloom, velocity-reactive */}
            <div
              ref={rsMarkRef}
              style={{
                width:           28,
                height:          28,
                border:          '1.5px solid #C8861E',
                borderRadius:    3,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                flexShrink:      0,
                boxShadow:       BASE_SHADOW,
                transition:      'box-shadow 0.3s ease',
                cursor:          'default',
              }}
              onMouseEnter={() => { isHoveredRef.current = true }}
              onMouseLeave={() => { isHoveredRef.current = false }}
            >
              <span style={{
                fontFamily:    'var(--font-bebas)',
                fontSize:      13,
                color:         '#C8861E',
                letterSpacing: '.04em',
                lineHeight:    1,
                userSelect:    'none',
                textShadow:    '0 0 8px rgba(200,134,30,0.9)',
              }}>RS</span>
            </div>

            {/* Logo — amber-filtered */}
            <img
              src="/studio/rh-logo.png"
              alt="RoadHouse"
              style={{
                height:     20,
                width:      'auto',
                opacity:    0.6,
                filter:     'brightness(0) invert(1) sepia(1) saturate(2) hue-rotate(10deg)',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6' }}
            />

            {/* B: Wordmark — ROADHOUSE muted, STUDIO glowing */}
            <div style={{
              fontFamily:    'var(--font-bebas)',
              fontSize:      15,
              letterSpacing: '.14em',
              lineHeight:    1,
            }}>
              <span style={{ color: '#5A5450' }}>ROADHOUSE </span>
              <span style={{
                color:      '#C8861E',
                textShadow: '0 0 8px rgba(200,134,30,0.9), 0 0 16px rgba(200,134,30,0.5), 0 0 32px rgba(200,134,30,0.25)',
              }}>STUDIO</span>
            </div>
          </div>

          {/* Desktop nav + CTA */}
          <style>{`
            .studio-nav-links { display: flex; align-items: center; gap: 4px; }
            .studio-nav-link  { display: inline-block; }
            .studio-nav-link:hover { color: #E8E0D0 !important; }
            .studio-nav-enter:hover { opacity: 0.82; }
            .studio-hamburger { display: none; }
            @media (max-width: 640px) {
              .studio-nav-link  { display: none !important; }
              .studio-hamburger { display: flex !important; }
              .studio-nav-enter { display: none !important; }
            }
          `}</style>
          <nav className="studio-nav-links" aria-label="Studio navigation">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="studio-nav-link"
                style={{
                  fontFamily:     'var(--font-dm-mono-studio)',
                  fontSize:       '11px',
                  color:          '#878070',
                  letterSpacing:  '0.1em',
                  textTransform:  'uppercase' as const,
                  padding:        '11px 14px',
                  textDecoration: 'none',
                  transition:     'color 0.15s ease',
                }}
              >
                {label}
              </a>
            ))}
            <a
              href="mailto:roadhousesyndicate@gmail.com"
              className="studio-nav-enter"
              role="button"
              style={{
                fontFamily:     'var(--font-dm-mono-studio)',
                fontSize:       '11px',
                background:     '#C8861E',
                color:          '#07080A',
                letterSpacing:  '0.1em',
                textTransform:  'uppercase' as const,
                padding:        '9px 18px',
                textDecoration: 'none',
                fontWeight:     500,
                marginLeft:     '8px',
                display:        'inline-block',
              }}
            >
              Enter ↗
            </a>

            {/* Hamburger — mobile only */}
            <button
              className="studio-hamburger"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              style={{
                background:    'none',
                border:        'none',
                cursor:        'pointer',
                padding:       '8px',
                flexDirection: 'column' as const,
                gap:           '5px',
                marginLeft:    '8px',
              }}
            >
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  display:    'block',
                  width:      '22px',
                  height:     '1.5px',
                  background: '#C8861E',
                }} />
              ))}
            </button>
          </nav>
        </div>
      </header>

      {/* ── Mobile fullscreen overlay ── */}
      {menuOpen && (
        <div
          style={{
            position:      'fixed',
            inset:         0,
            background:    '#07080A',
            zIndex:        200,
            display:       'flex',
            flexDirection: 'column' as const,
            padding:       '0 1.5rem',
          }}
        >
          {/* Top bar */}
          <div style={{
            height:         '64px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            borderBottom:   '1px solid #141618',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width:          28,
                height:         28,
                border:         '1.5px solid #C8861E',
                borderRadius:   3,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                boxShadow:      BASE_SHADOW,
              }}>
                <span style={{
                  fontFamily: 'var(--font-bebas)',
                  fontSize:   13,
                  color:      '#C8861E',
                  textShadow: '0 0 8px rgba(200,134,30,0.9)',
                }}>RS</span>
              </div>
            </div>
            <button
              onClick={closeMenu}
              aria-label="Close navigation menu"
              style={{
                background:    'none',
                border:        '1px solid #1E1C18',
                color:         '#878070',
                cursor:        'pointer',
                padding:       '6px 14px',
                fontFamily:    'var(--font-dm-mono-studio)',
                fontSize:      '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
              }}
            >
              Close ×
            </button>
          </div>

          {/* Nav links — large Bebas */}
          <nav style={{
            flex:           1,
            display:        'flex',
            flexDirection:  'column' as const,
            justifyContent: 'center',
            gap:            '8px',
          }}>
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={closeMenu}
                style={{
                  fontFamily:     'var(--font-bebas)',
                  fontSize:       'clamp(52px, 15vw, 80px)',
                  color:          '#878070',
                  letterSpacing:  '0.02em',
                  textDecoration: 'none',
                  lineHeight:     1,
                  transition:     'color 0.15s ease',
                  display:        'block',
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#E8E0D0' }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#878070' }}
              >
                {label.toUpperCase()}
              </a>
            ))}
          </nav>

          {/* Bottom CTA */}
          <div style={{ padding: '32px 0', borderTop: '1px solid #141618' }}>
            <a
              href="mailto:roadhousesyndicate@gmail.com"
              onClick={closeMenu}
              style={{
                fontFamily:     'var(--font-dm-mono-studio)',
                fontSize:       '11px',
                background:     '#C8861E',
                color:          '#07080A',
                letterSpacing:  '0.12em',
                textTransform:  'uppercase' as const,
                padding:        '14px 28px',
                textDecoration: 'none',
                fontWeight:     500,
                display:        'inline-block',
              }}
            >
              Enter ↗
            </a>
          </div>
        </div>
      )}
    </>
  )
}
