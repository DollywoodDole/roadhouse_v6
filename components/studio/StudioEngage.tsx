export default function StudioEngage() {
  return (
    <section id="contact" style={{ borderTop: '1px solid #141618', padding: '96px 0' }}>
      <div style={{
        maxWidth:       '1400px',
        margin:         '0 auto',
        padding:        '0 1.5rem',
        display:        'flex',
        alignItems:     'flex-start',
        justifyContent: 'space-between',
        gap:            '48px',
        flexWrap:       'wrap' as const,
      }}>

        {/* Left: headline + proof points */}
        <div>
          <div style={{
            fontFamily:    'var(--font-bebas)',
            fontSize:      'clamp(52px, 8vw, 100px)',
            lineHeight:    0.95,
            letterSpacing: '0.01em',
            color:         '#E8E0D0',
          }}>
            <div>WORK /</div>
            <div><span style={{ color: '#C8861E' }}>WITH</span> /</div>
            <div>US.</div>
          </div>
          <p style={{
            fontFamily:    'var(--font-dm-mono-studio)',
            fontSize:      '11px',
            color:         '#3A3530',
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            marginTop:     '20px',
            marginBottom:  '0',
          }}>
            Fixed scope · Full ownership · RoadHouse-built
          </p>

          {/* Proof points */}
          <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {[
              'No retainer required.',
              'No lock-in.',
              'No surprises.',
            ].map((line) => (
              <div key={line} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width:      '4px',
                  height:     '4px',
                  background: '#C8861E',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontFamily:    'var(--font-dm-mono-studio)',
                  fontSize:      '11px',
                  color:         '#4A4540',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                }}>
                  {line}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: contact + CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '24px', paddingTop: '8px' }}>
          <div>
            <p style={{
              fontFamily:    'var(--font-dm-mono-studio)',
              fontSize:      '11px',
              color:         '#3A3530',
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              margin:        '0 0 8px',
            }}>Contact</p>
            <a
              href="mailto:roadhousesyndicate@gmail.com"
              style={{
                fontFamily:     'var(--font-barlow)',
                fontSize:       '18px',
                color:          '#E8E0D0',
                textDecoration: 'none',
                fontWeight:     400,
                display:        'block',
                marginBottom:   '4px',
              }}
            >
              roadhousesyndicate@gmail.com
            </a>
            <a
              href="https://roadhouse.capital"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily:     'var(--font-dm-mono-studio)',
                fontSize:       '11px',
                color:          '#4A4540',
                textDecoration: 'none',
                letterSpacing:  '0.1em',
                textTransform:  'uppercase' as const,
              }}
            >
              roadhouse.capital
            </a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px', alignItems: 'flex-start' }}>
            <a
              href="mailto:roadhousesyndicate@gmail.com"
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
              Start a Conversation ↗
            </a>

            <a
              href="#work"
              style={{
                fontFamily:     'var(--font-dm-mono-studio)',
                fontSize:       '11px',
                color:          '#5A5550',
                letterSpacing:  '0.12em',
                textTransform:  'uppercase' as const,
                padding:        '14px 28px',
                textDecoration: 'none',
                border:         '1px solid #1E1C18',
                display:        'inline-block',
              }}
            >
              View Case Study →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
