const ITEMS = [
  'ROADHOUSE.CAPITAL',
  'MOTORS.ROADHOUSE.CAPITAL',
  'STUDIO.ROADHOUSE.CAPITAL',
  'FABER.ROADHOUSE.CAPITAL',
]

const TICKER_TEXT = ITEMS.map((item) => `${item} ◆ `).join('')

export default function StudioTicker() {
  return (
    <div style={{
      borderTop:    '1px solid #141618',
      borderBottom: '1px solid #141618',
      background:   '#07080A',
      overflow:     'hidden',
      margin:       '80px 0 0',
    }}>
      <style>{`
        @keyframes studio-ticker-fwd {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes studio-ticker-rev {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      {/* Row 1 — label + forward ticker */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        padding:    '14px 0',
        borderBottom: '1px solid #141618',
        overflow:   'hidden',
      }}>
        <span style={{
          fontFamily:    'var(--font-dm-mono-studio)',
          fontSize:      '10px',
          color:         '#C8861E',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          flexShrink:    0,
          padding:       '0 24px',
          borderRight:   '1px solid #141618',
          marginRight:   '24px',
          whiteSpace:    'nowrap' as const,
        }}>
          In production →
        </span>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div style={{
            display:    'inline-flex',
            whiteSpace: 'nowrap' as const,
            animation:  'studio-ticker-fwd 22s linear infinite',
          }}>
            {[TICKER_TEXT, TICKER_TEXT].map((text, i) => (
              <span
                key={i}
                style={{
                  fontFamily:    'var(--font-dm-mono-studio)',
                  fontSize:      '11px',
                  color:         '#3A3530',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase' as const,
                }}
              >
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 — reverse ticker */}
      <div style={{ overflow: 'hidden', padding: '10px 0' }}>
        <div style={{
          display:    'inline-flex',
          whiteSpace: 'nowrap' as const,
          animation:  'studio-ticker-rev 32s linear infinite',
        }}>
          {[TICKER_TEXT, TICKER_TEXT].map((text, i) => (
            <span
              key={i}
              style={{
                fontFamily:    'var(--font-dm-mono-studio)',
                fontSize:      '10px',
                color:         '#242220',
                letterSpacing: '0.22em',
                textTransform: 'uppercase' as const,
              }}
            >
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
