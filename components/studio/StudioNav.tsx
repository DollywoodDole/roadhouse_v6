export default function StudioNav() {
  return (
    <header style={{ background: '#07080A', borderBottom: '1px solid #141618', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 1.5rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>

        {/* Left: RS amber box mark + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: '#C8861E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '15px',
              color: '#07080A',
              letterSpacing: '0.05em',
              lineHeight: 1,
              userSelect: 'none',
            }}>RS</span>
          </div>
          <span style={{
            fontFamily: 'var(--font-dm-mono-studio)',
            fontSize: '11px',
            color: '#4A4540',
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
          }}>
            studio.roadhouse.capital
          </span>
        </div>

        {/* Right: nav links + CTA */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {['Work', 'House', 'Contact'].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              style={{
                fontFamily: 'var(--font-dm-mono-studio)',
                fontSize: '11px',
                color: '#5A5550',
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                padding: '8px 14px',
                textDecoration: 'none',
              }}
            >
              {label}
            </a>
          ))}
          <a
            href="#contact"
            style={{
              fontFamily: 'var(--font-dm-mono-studio)',
              fontSize: '11px',
              background: '#C8861E',
              color: '#07080A',
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              padding: '9px 18px',
              textDecoration: 'none',
              fontWeight: 500,
              marginLeft: '8px',
              display: 'inline-block',
            }}
          >
            Enter ↗
          </a>
        </nav>
      </div>
    </header>
  )
}
