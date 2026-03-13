'use client'

const GUILDS = [
  {
    icon: '📡',
    name: 'Media Guild',
    tag: 'Content Creation',
    kpi: 'Monthly Reach',
    status: 'Recruiting',
    statusColor: 'text-green-400 border-green-400/30',
    desc: 'The front-facing engine of the RoadHouse. Responsible for all streaming, short-form video, VOD clipping, social distribution, and international translation of content.',
    items: [
      'Live streaming on Kick — long-form, unfiltered',
      'Short-form content on TikTok (@roadhousesyndicate)',
      'VOD clipping and highlight distribution',
      'Multilingual content translation',
      'Social media management across platforms',
    ],
  },
  {
    icon: '⚙️',
    name: 'Builder Guild',
    tag: 'Technology & Dashboards',
    kpi: 'Uptime & DAU',
    status: 'Forming',
    statusColor: 'text-gold border-gold/30',
    desc: 'The technical backbone. Builders develop and maintain the community platform, tokenomics tooling, streaming analytics, and on-chain infrastructure.',
    items: [
      'Community dashboard development',
      '$ROAD token smart contract deployment',
      'AI-assisted content moderation systems',
      'Streaming analytics platform',
      'On-chain analytics (Year 2)',
    ],
  },
  {
    icon: '🏕️',
    name: 'Frontier Guild',
    tag: 'Events & Compound',
    kpi: 'Event Revenue',
    status: 'Planning',
    statusColor: 'text-rh-muted border-rh-border',
    desc: 'Anchored in Saskatchewan\'s physical landscape. Manages real-world infrastructure — compound operations, event production, merchandise logistics, and physical community space.',
    items: [
      'Saskatchewan compound site acquisition (Year 2)',
      'Physical events and festival appearances',
      'Merchandise production and fulfillment',
      'Community compound infrastructure',
      'In-person member meetups',
    ],
  },
  {
    icon: '📈',
    name: 'Venture Guild',
    tag: 'Treasury & Investments',
    kpi: 'Portfolio IRR',
    status: 'Seeding',
    statusColor: 'text-rh-muted border-rh-border',
    desc: 'The capital arm. Deploys DAO treasury via governance-approved proposals, sources deals, performs due diligence, and manages the portfolio.',
    items: [
      'Treasury deployment via DAO governance votes',
      'Deal sourcing and due diligence',
      'Portfolio company management',
      'Grant co-application coordination',
      'Investor relations and LP reporting',
    ],
  },
]

export default function Guilds() {
  return (
    <section id="guilds" className="px-8 lg:px-16 py-20 border-t border-rh-border">
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">DAO Architecture — Governance via Snapshot & Aragon</div>
        <h2 className="text-4xl lg:text-5xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Four Guilds. <span className="text-gold">One Ecosystem.</span>
        </h2>
        <p className="text-rh-muted text-sm mt-3 max-w-2xl tracking-wide">
          The RoadHouse operates through four specialized guilds — each with its own domain, KPI, and governance mandate.
          All proposals: Idea Phase (7d) → Temperature Check → Formal Vote (5d, ≥10% quorum) → On-chain execution.
        </p>
        <div className="gold-line mt-4 max-w-xs" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {GUILDS.map(guild => (
          <div key={guild.name} className="bg-rh-card border border-rh-border rounded-lg p-6 card-glow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{guild.icon}</span>
                <div>
                  <h3
                    className="text-xl font-light italic text-rh-text"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    {guild.name}
                  </h3>
                  <div className="text-[10px] tracking-wider text-rh-faint">{guild.tag}</div>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-[9px] tracking-widest uppercase border rounded ${guild.statusColor}`}>
                {guild.status}
              </span>
            </div>

            <p className="text-[11px] text-rh-muted leading-relaxed mb-4">{guild.desc}</p>

            <div className="text-[10px] tracking-widest uppercase text-gold-dark mb-3">
              KPI: {guild.kpi}
            </div>

            <ul className="space-y-1.5">
              {guild.items.map(item => (
                <li key={item} className="text-[11px] text-rh-muted flex items-start gap-2">
                  <span className="text-gold/40 mt-0.5">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Governance info */}
      <div className="p-5 bg-rh-card border border-rh-border rounded-lg flex flex-col md:flex-row items-start gap-6">
        <div className="flex-1">
          <h4 className="text-lg font-light italic text-rh-text mb-2" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Governance Architecture
          </h4>
          <p className="text-[11px] text-rh-muted leading-relaxed">
            Gnosis Safe 3-of-5 multisig treasury. Snapshot + Aragon for on-chain voting.
            Any Regular+ member can submit a proposal. Voting windows: 5 days.
            Quorum: ≥10% of circulating $ROAD.
          </p>
        </div>
        <div className="text-center">
          <div
            className="text-3xl font-light text-gold mb-1"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            3-of-5
          </div>
          <div className="text-[10px] tracking-widest uppercase text-rh-faint">Gnosis Safe Signers</div>
        </div>
        <a
          href="#contact"
          onClick={e => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) }}
          className="px-5 py-2.5 stripe-btn text-rh-black text-[10px] tracking-widest uppercase font-medium rounded whitespace-nowrap self-start md:self-center"
        >
          Join a Guild →
        </a>
      </div>
    </section>
  )
}
