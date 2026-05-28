export default function StudioEngage() {
  return (
    <section id="contact" style={{ borderTop: '1px solid #141618', padding: '96px 0 96px' }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '48px',
        flexWrap: 'wrap' as const,
      }}>

        {/* Left: headline */}
        <div>
          <div style={{
            fontFamily: 'var(--font-bebas)',
            fontSize: 'clamp(52px, 8vw, 100px)',
            lineHeight: 0.95,
            letterSpacing: '0.01em',
            color: '#E8E0D0',
          }}>
            <div>WORK /</div>
            <div><span style={{ color: '#C8861E' }}>WITH</span> /</div>
            <div>US.</div>
          </div>
          <p style={{
            fontFamily: 'var(--font-dm-mono-studio)',
            fontSize: '11px',
            color: '#3A3530',
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            marginTop: '20px',
          }}>
            Fixed scope · Full ownership · RoadHouse-built
          </p>
        </div>

        {/* Right: contact info + CTA */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '24px', paddingTop: '8px' }}>
          <div>
            <p style={{
              fontFamily: 'var(--font-dm-mono-studio)',
              fontSize: '11px',
              color: '#3A3530',
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              margin: '0 0 8px',
            }}>Contact</p>
            <a
              href="mailto:hello@roadhouse.capital"
              style={{
                fontFamily: 'var(--font-barlow)',
                fontSize: '18px',
                color: '#E8E0D0',
                textDecoration: 'none',
                fontWeight: 400,
                display: 'block',
                marginBottom: '4px',
              }}
            >
              hello@roadhouse.capital
            </a>
            <a
              href="https://roadhouse.capital"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-dm-mono-studio)',
                fontSize: '11px',
                color: '#4A4540',
                textDecoration: 'none',
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
              }}
            >
              roadhouse.capital
            </a>
          </div>

          <a
            href="mailto:hello@roadhouse.capital"
            style={{
              fontFamily: 'var(--font-dm-mono-studio)',
              fontSize: '11px',
              background: '#C8861E',
              color: '#07080A',
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              padding: '14px 28px',
              textDecoration: 'none',
              fontWeight: 500,
              display: 'inline-block',
              alignSelf: 'flex-start',
            }}
          >
            Start a Conversation ↗
          </a>
        </div>
      </div>
    </section>
  )
}
