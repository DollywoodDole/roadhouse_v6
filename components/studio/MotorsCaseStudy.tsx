type ActiveView = 'client' | 'house'

const STATS = [
  // TODO: replace with await getInventoryCount('obrians') from lib/motors-kv.ts
  // Blocked on multi-dealer-wip merge to main
  { value: '112', label: 'Live vehicles' },
  { value: 'ADF/XML', label: 'Dealership software export' },
  { value: 'Multi', label: 'Multi-dealer architecture' },
  { value: 'JSON-LD', label: 'Full schema stack' },
]

// Simplified inventory card skeleton for the browser frame mockup
function InventoryCardSkeleton({ amber }: { amber?: boolean }) {
  return (
    <div style={{
      background: '#0F1012',
      border:     '1px solid #141618',
      padding:    '8px',
      display:    'flex',
      flexDirection: 'column' as const,
      gap:        '4px',
    }}>
      <div style={{ height: '28px', background: '#141618' }} />
      <div style={{ height: '5px', background: '#1A1C1F', width: '70%' }} />
      <div style={{ height: '5px', background: '#1A1C1F', width: '50%' }} />
      <div style={{
        marginTop: '4px',
        height:    '5px',
        background: amber ? '#C8861E' : '#1A1C1F',
        width:     '40%',
        opacity:   0.7,
      }} />
    </div>
  )
}

export default function MotorsCaseStudy({ activeView }: { activeView: ActiveView }) {
  if (activeView !== 'client') return null

  return (
    <div style={{
      border:    '1px solid #1A1C1F',
      margin:          '0 0 80px',
      background:      '#0C0D0F',
    }}>

      {/* Header */}
      <div style={{
        padding:        '28px 32px 24px',
        borderBottom:   '1px solid #1A1C1F',
        display:        'flex',
        alignItems:     'flex-start',
        justifyContent: 'space-between',
        flexWrap:       'wrap' as const,
        gap:            '16px',
      }}>
        <div>
          <p style={{
            fontFamily:    'var(--font-dm-mono-studio)',
            fontSize:      '10px',
            color:         '#878070',
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            margin:        '0 0 8px',
          }}>
            Dealer Platform · O&apos;Brian&apos;s Auto · Saskatchewan
          </p>
          <h3 style={{
            fontFamily:    'var(--font-bebas)',
            fontSize:      '32px',
            color:         '#E8E0D0',
            letterSpacing: '0.03em',
            margin:        '0 0 6px',
            lineHeight:    1,
          }}>
            RoadHouse Motors
          </h3>
          <a
            href="https://motors.roadhouse.capital"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily:    'var(--font-dm-mono-studio)',
              fontSize:      '10px',
              color:         '#C8861E',
              letterSpacing: '0.1em',
              textDecoration: 'none',
              textTransform: 'uppercase' as const,
            }}
          >
            motors.roadhouse.capital
          </a>
        </div>

        {/* Live badge */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '6px',
          background: '#0F1A0F',
          border:     '1px solid #1A3020',
          padding:    '6px 12px',
          alignSelf:  'flex-start',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4CAF50' }} />
          <span style={{
            fontFamily:    'var(--font-dm-mono-studio)',
            fontSize:      '10px',
            color:         '#4CAF50',
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
          }}>Live</span>
        </div>
      </div>

      {/* Browser frame mockup */}
      <div style={{ padding: '24px 32px 0' }}>
        <div style={{
          border:       '1px solid #1A1C1F',
          background:   '#090A0C',
          overflow:     'hidden',
        }}>
          {/* Chrome bar */}
          <div style={{
            height:       '30px',
            background:   '#111316',
            borderBottom: '1px solid #1A1C1F',
            display:      'flex',
            alignItems:   'center',
            padding:      '0 12px',
            gap:          '6px',
          }}>
            {(['#FF5F57', '#FEBC2E', '#28C840'] as const).map((color) => (
              <div key={color} style={{
                width: '8px', height: '8px',
                borderRadius: '50%',
                background: color,
                opacity: 0.6,
              }} />
            ))}
            {/* URL bar */}
            <div style={{
              flex:         1,
              height:       '16px',
              background:   '#0C0D10',
              margin:       '0 12px',
              display:      'flex',
              alignItems:   'center',
              padding:      '0 8px',
            }}>
              <span style={{
                fontFamily:    'var(--font-dm-mono-studio)',
                fontSize:      '9px',
                color:         '#2A2520',
                letterSpacing: '0.08em',
              }}>
                motors.roadhouse.capital/inventory
              </span>
            </div>
          </div>

          {/* Inventory grid preview */}
          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <InventoryCardSkeleton amber />
            <InventoryCardSkeleton />
            <InventoryCardSkeleton amber />
            <InventoryCardSkeleton />
            <InventoryCardSkeleton amber />
            <InventoryCardSkeleton />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <style>{`
        .motors-cs-stats { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid #1A1C1F; }
        @media (max-width: 640px) {
          .motors-cs-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .motors-cs-stats > div:nth-child(2) { border-right: none !important; }
        }
      `}</style>
      <div className="motors-cs-stats" style={{ marginTop: '24px' }}>
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              padding:     '20px 24px',
              borderRight: i < 3 ? '1px solid #1A1C1F' : 'none',
            }}
          >
            <div style={{
              fontFamily:    'var(--font-bebas)',
              fontSize:      '28px',
              color:         '#C8861E',
              letterSpacing: '0.03em',
              lineHeight:    1,
              marginBottom:  '4px',
            }}>
              {stat.value}
            </div>
            <div style={{
              fontFamily:    'var(--font-dm-mono-studio)',
              fontSize:      '10px',
              color:         '#878070',
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Description */}
      <div style={{ padding: '24px 32px' }}>
        <p style={{
          fontFamily: 'var(--font-barlow)',
          fontSize:   '14px',
          color:      '#878070',
          lineHeight: 1.75,
          margin:     0,
          fontWeight: 300,
          maxWidth:   '680px',
        }}>
          Full-stack dealer platform built on Next.js — live inventory sync from dealer CMS,
          structured ADF/XML exports for DMS integration, automated daily sync via Vercel cron,
          lead pipeline with KV storage, and a complete JSON-LD schema stack for organic search.
          Subdomain-isolated, proxy-routed, no manual updates required.
        </p>
      </div>
    </div>
  )
}
