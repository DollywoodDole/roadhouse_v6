'use client'

import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { label: 'Work',    href: '#work' },
  { label: 'House',   href: '#house' },
  { label: 'Contact', href: '#contact' },
]

export default function StudioNav() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)

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

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      {/* Skip to content — keyboard users */}
      <a
        href="#work"
        style={{
          position:      'absolute',
          top:           '-100%',
          left:          0,
          padding:       '8px 16px',
          background:    '#C8861E',
          color:         '#07080A',
          fontFamily:    'var(--font-dm-mono-studio)',
          fontSize:      '11px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          textDecoration: 'none',
          zIndex:        200,
          fontWeight:    500,
        }}
        onFocus={(e) => { e.currentTarget.style.top = '0' }}
        onBlur={(e)  => { e.currentTarget.style.top = '-100%' }}
      >
        Skip to content
      </a>

      <header
        data-studio-nav
        style={{
          background:           scrolled ? 'rgba(7,8,10,0.92)' : '#07080A',
          backdropFilter:       scrolled ? 'blur(14px)'         : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(14px)'         : 'none',
          borderBottom:         '1px solid #141618',
          position:             'sticky',
          top:                  0,
          zIndex:               100,
          transition:           'background 0.3s ease',
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

          {/* Mark + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width:          '32px',
              height:         '32px',
              background:     '#C8861E',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              flexShrink:     0,
            }}>
              <span style={{
                fontFamily:    'var(--font-bebas)',
                fontSize:      '15px',
                color:         '#07080A',
                letterSpacing: '0.05em',
                lineHeight:    1,
                userSelect:    'none',
              }}>RS</span>
            </div>
            <span style={{
              fontFamily:    'var(--font-dm-mono-studio)',
              fontSize:      '11px',
              color:         '#878070',
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
            }}>
              studio.roadhouse.capital
            </span>
          </div>

          {/* Desktop nav + CTA */}
          <style>{`
            .studio-nav-links { display: flex; align-items: center; gap: 4px; }
            .studio-nav-link  { display: inline-block; }
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
                background:  'none',
                border:      'none',
                cursor:      'pointer',
                padding:     '8px',
                display:     'flex',
                flexDirection: 'column' as const,
                gap:         '5px',
                marginLeft:  '8px',
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
            position:   'fixed',
            inset:      0,
            background: '#07080A',
            zIndex:     200,
            display:    'flex',
            flexDirection: 'column' as const,
            padding:    '0 1.5rem',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px', height: '32px',
                background: '#C8861E',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '15px', color: '#07080A' }}>RS</span>
              </div>
            </div>
            <button
              onClick={closeMenu}
              aria-label="Close navigation menu"
              style={{
                background:  'none',
                border:      '1px solid #1E1C18',
                color:       '#878070',
                cursor:      'pointer',
                padding:     '6px 14px',
                fontFamily:  'var(--font-dm-mono-studio)',
                fontSize:    '10px',
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
