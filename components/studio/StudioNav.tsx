'use client'

import { useEffect, useState } from 'react'

export default function StudioNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      data-studio-nav
      style={{
        background:     scrolled ? 'rgba(7,8,10,0.88)' : '#07080A',
        backdropFilter: scrolled ? 'blur(14px)'         : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(14px)'  : 'none',
        borderBottom:   '1px solid #141618',
        position:       'sticky',
        top:            0,
        zIndex:         50,
        transition:     'background 0.3s ease',
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
            color:         '#4A4540',
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
          }}>
            studio.roadhouse.capital
          </span>
        </div>

        {/* Nav links + CTA */}
        <style>{`
          .studio-nav-links { display: flex; align-items: center; gap: 4px; }
          @media (max-width: 640px) { .studio-nav-links-text { display: none !important; } }
        `}</style>
        <nav className="studio-nav-links">
          {[
            { label: 'Work',    href: '#work' },
            { label: 'House',   href: '#house' },
            { label: 'Contact', href: '#contact' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="studio-nav-links-text"
              style={{
                fontFamily:     'var(--font-dm-mono-studio)',
                fontSize:       '11px',
                color:          '#5A5550',
                letterSpacing:  '0.1em',
                textTransform:  'uppercase' as const,
                padding:        '8px 14px',
                textDecoration: 'none',
              }}
            >
              {label}
            </a>
          ))}
          <a
            href="mailto:roadhousesyndicate@gmail.com"
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
        </nav>
      </div>
    </header>
  )
}
