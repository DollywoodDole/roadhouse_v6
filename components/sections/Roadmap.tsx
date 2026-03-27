'use client'

const PHASES = [
  {
    num: '01',
    name: 'Foundation',
    period: 'Q2 2026 — Apr / May / Jun',
    status: 'active',
    capital: '$0 – $50k',
    items: [
      'Incorporate Praetorian Holdings Corp. (Saskatchewan)',
      'Trademark Lux mascot + RoadHouse brand (CIPO)',
      'Open corporate bank accounts (BDC / RBC Business)',
      'Engage SR&ED consultant',
      'Launch X, TikTok, and Kick channels',
      'Publish community dashboard v1',
      'First sponsorship outreach',
      'Form four guilds — deploy $ROAD on testnet',
      'Launch Squads treasury wallet (Solana)',
      'Onboard first 10 creators',
      'File IRAP pre-screening',
    ],
  },
  {
    num: '02',
    name: 'Growth',
    period: 'Q3 – Q4 2026',
    status: 'next',
    capital: '$50k – $300k',
    items: [
      'Audience target: 20k across all platforms',
      'First sponsorship deal closed',
      'SaskInnovates application submitted',
      'Mitacs MOU — University of Saskatchewan',
      '$ROAD mainnet deployment',
      'First DAO governance vote executed',
      'Hire first creators via Studios',
      'CMF Experimental application (Q4)',
    ],
  },
  {
    num: '03',
    name: 'Compound & Studio',
    period: 'Year 2 — 2027',
    status: 'planned',
    capital: '$300k – $2M',
    items: [
      'Compound land identified and optioned',
      'RoadHouse Studios — 3+ contracted creators',
      'CMF Experimental application submitted',
      'Venture Guild first investment ($25k CAD)',
      'Community dashboard v2 (on-chain analytics)',
      'DAO treasury target: $55k CAD',
      'Team grows to 4 FTE-equivalent',
      'EDC registration (export revenue >$20k)',
    ],
  },
]

const REVENUE_TABLE = [
  { stream: 'Streaming Ad Revenue', y1: '$12k', y3: '$80k' },
  { stream: 'Subscriptions / Memberships', y1: '$20k', y3: '$150k' },
  { stream: 'Sponsorships', y1: '$18k', y3: '$200k' },
  { stream: 'Merchandise', y1: '$8k', y3: '$60k' },
  { stream: 'Digital Products', y1: '$6k', y3: '$50k' },
  { stream: 'IP Licensing', y1: '$5k', y3: '$40k' },
  { stream: 'Events', y1: '$0', y3: '$80k' },
  { stream: 'DAO Investments', y1: '$0', y3: '$120k' },
  { stream: 'Grants (non-dilutive)', y1: '$80k', y3: '$120k' },
  { stream: 'Total', y1: '$149k', y3: '$900k', bold: true },
]

const statusStyle: Record<string, string> = {
  active: 'text-green-400 border-green-400/30 bg-green-400/5',
  next: 'text-gold border-gold/30 bg-gold/5',
  planned: 'text-rh-muted border-rh-border',
}
const statusLabel: Record<string, string> = {
  active: '● Active',
  next: '→ Next',
  planned: '◇ Planned',
}

export default function Roadmap() {
  return (
    <section id="roadmap" className="px-8 lg:px-16 py-20">
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Praetorian Holdings — Q2 2026 through Year 2</div>
        <h2 className="text-5xl lg:text-7xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Implementation <span className="text-gold">Roadmap</span>
        </h2>
        <p className="text-rh-muted text-sm mt-3 max-w-xl tracking-wide">
          Three phases. Legal first, then community, then physical infrastructure. Year 3 is the inflection point.
        </p>
        <div className="gold-line mt-4 max-w-xs" />
      </div>

      {/* Phases */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {PHASES.map(phase => (
          <div
            key={phase.num}
            className={`bg-rh-card border rounded-lg p-6 card-glow ${
              phase.status === 'active' ? 'border-green-400/20' : 'border-rh-border'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="text-4xl font-light text-rh-faint"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                {phase.num}
              </div>
              <span className={`px-2 py-0.5 text-[9px] tracking-widest uppercase border rounded ${statusStyle[phase.status]}`}>
                {statusLabel[phase.status]}
              </span>
            </div>
            <h3
              className="text-xl font-light italic text-rh-text mb-1"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              {phase.name}
            </h3>
            <div className="text-[10px] text-rh-faint mb-2">{phase.period}</div>
            <div className="text-[10px] tracking-wider text-gold-dark mb-4">Capital: {phase.capital}</div>
            <ul className="space-y-1.5">
              {phase.items.map(item => (
                <li key={item} className="flex items-start gap-2 text-[11px] text-rh-muted">
                  <span className="text-gold/30 mt-0.5">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Revenue table */}
      <div className="mb-8">
        <h3
          className="text-2xl font-light italic text-rh-text mb-5"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Revenue <span className="text-gold">Architecture</span>
        </h3>
        <div className="bg-rh-card border border-rh-border rounded-lg overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-rh-border">
                <th className="text-left px-5 py-3 text-[9px] tracking-[0.3em] uppercase text-rh-faint font-normal">Stream</th>
                <th className="text-right px-5 py-3 text-[9px] tracking-[0.3em] uppercase text-rh-faint font-normal">Year 1</th>
                <th className="text-right px-5 py-3 text-[9px] tracking-[0.3em] uppercase text-rh-faint font-normal">Year 3</th>
              </tr>
            </thead>
            <tbody>
              {REVENUE_TABLE.map(row => (
                <tr
                  key={row.stream}
                  className={`border-b border-rh-border/50 ${row.bold ? 'bg-gold/5' : 'hover:bg-rh-elevated/50'} transition-colors`}
                >
                  <td className={`px-5 py-2.5 ${row.bold ? 'text-rh-text font-medium' : 'text-rh-muted'}`}>{row.stream}</td>
                  <td className={`px-5 py-2.5 text-right ${row.bold ? 'text-gold font-medium' : 'text-rh-muted'}`}>{row.y1}</td>
                  <td className={`px-5 py-2.5 text-right ${row.bold ? 'text-gold font-medium' : 'text-rh-muted'}`}>{row.y3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] text-rh-faint tracking-wider">All figures CAD · Sourced from Praetorian Holdings investor memorandum</p>
      </div>

      {/* Tax efficiency note */}
      <div className="p-5 bg-rh-card border border-rh-border rounded-lg">
        <div className="text-[10px] tracking-[0.3em] uppercase text-gold mb-2">Saskatchewan Tax Efficiency</div>
        <p className="text-[11px] text-rh-muted leading-relaxed">
          10.5% combined federal/provincial on first $500k active business income ·
          9% federal + 1.5% provincial (CCPC small-business deduction) ·
          Rate increases to ~27% above $500k threshold ·
          Year 1 effective tax rate: $3k on $30k profit.
        </p>
      </div>
    </section>
  )
}
