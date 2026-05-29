type ActiveView = 'client' | 'house'

const STATS = [
  // TODO: replace with await getInventoryCount('obrians') from lib/motors-kv.ts
  // Blocked on multi-dealer-wip merge to main
  { value: '112', label: 'Live vehicles' },
  { value: 'ADF/XML', label: 'Tekion DMS format' },
  { value: 'Multi', label: 'Dealer-partitioned' },
  { value: 'JSON-LD', label: 'Full schema stack' },
]

export default function MotorsCaseStudy({ activeView }: { activeView: ActiveView }) {
  if (activeView !== 'client') return null

  return (
    <div style={{
      borderLeft: '3px solid #C8861E',
      border: '1px solid #1A1C1F',
      borderLeftWidth: '3px',
      borderLeftColor: '#C8861E',
      margin: '0 0 80px',
      background: '#0C0D0F',
    }}>

      {/* Header */}
      <div style={{
        padding: '28px 32px 24px',
        borderBottom: '1px solid #1A1C1F',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap' as const,
        gap: '16px',
      }}>
        <div>
          <p style={{
            fontFamily: 'var(--font-dm-mono-studio)',
            fontSize: '10px',
            color: '#4A4540',
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            margin: '0 0 8px',
          }}>
            Dealer Platform · Saskatchewan Automotive
          </p>
          <h3 style={{
            fontFamily: 'var(--font-bebas)',
            fontSize: '32px',
            color: '#E8E0D0',
            letterSpacing: '0.03em',
            margin: '0 0 6px',
            lineHeight: 1,
          }}>
            RoadHouse Motors
          </h3>
          <a
            href="https://motors.roadhouse.capital"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--font-dm-mono-studio)',
              fontSize: '10px',
              color: '#C8861E',
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
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#0F1A0F',
          border: '1px solid #1A3020',
          padding: '6px 12px',
          alignSelf: 'flex-start',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4CAF50' }} />
          <span style={{
            fontFamily: 'var(--font-dm-mono-studio)',
            fontSize: '10px',
            color: '#4CAF50',
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
          }}>Live</span>
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
      <div className="motors-cs-stats">
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              padding: '20px 24px',
              borderRight: i < 3 ? '1px solid #1A1C1F' : 'none',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-bebas)',
              fontSize: '28px',
              color: '#C8861E',
              letterSpacing: '0.03em',
              lineHeight: 1,
              marginBottom: '4px',
            }}>
              {stat.value}
            </div>
            <div style={{
              fontFamily: 'var(--font-dm-mono-studio)',
              fontSize: '10px',
              color: '#3A3530',
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
          fontSize: '14px',
          color: '#5A5550',
          lineHeight: 1.75,
          margin: 0,
          fontWeight: 300,
          maxWidth: '680px',
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
