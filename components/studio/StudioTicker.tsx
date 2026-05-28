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
      borderTop: '1px solid #141618',
      borderBottom: '1px solid #141618',
      background: '#07080A',
      overflow: 'hidden',
      padding: '14px 0',
      margin: '80px 0 0',
    }}>
      <style>{`
        @keyframes studio-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingLeft: '24px', marginBottom: '2px' }}>
        <span style={{
          fontFamily: 'var(--font-dm-mono-studio)',
          fontSize: '10px',
          color: '#C8861E',
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          flexShrink: 0,
        }}>In production →</span>
      </div>

      <div style={{ overflow: 'hidden' }}>
        <div
          style={{
            display: 'inline-flex',
            whiteSpace: 'nowrap' as const,
            animation: 'studio-ticker 22s linear infinite',
          }}
        >
          {/* Doubled for seamless loop */}
          {[TICKER_TEXT, TICKER_TEXT].map((text, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--font-dm-mono-studio)',
                fontSize: '11px',
                color: '#2A2520',
                letterSpacing: '0.18em',
                textTransform: 'uppercase' as const,
                paddingRight: '0',
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
