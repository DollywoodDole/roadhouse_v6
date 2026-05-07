import Image from 'next/image'
import { ExternalLink } from 'lucide-react'

const BRANCHES = [
  {
    num: '01',
    name: 'Motors',
    subdomain: 'motors.roadhouse.capital',
    href: 'https://motors.roadhouse.capital',
    description: 'Pre-owned vehicles sourced across Saskatchewan. Curated inventory, no pressure, no games.',
    status: 'live' as const,
    stat: '~131 vehicles in stock',
  },
  {
    num: '02',
    name: 'Flowers',
    subdomain: 'flowers.roadhouse.capital',
    href: null,
    description: 'Premium floral arrangements for events, venues, and personal orders. High-standard sourcing, delivered.',
    status: 'soon' as const,
    stat: null,
  },
  {
    num: '03',
    name: 'Watches',
    subdomain: 'watches.roadhouse.capital',
    href: null,
    description: 'Curated timepieces — pre-owned and new. Every piece vetted before it moves.',
    status: 'soon' as const,
    stat: null,
  },
]

export default function Branches() {
  return (
    <section id="branches" className="px-8 lg:px-16 py-20">
      {/* Header */}
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">
          Praetorian Holdings Corp. — Commercial Lines
        </div>
        <h2
          className="text-5xl lg:text-7xl font-light italic"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          The <span className="text-gold">Branches</span>
        </h2>
        <p className="text-rh-muted text-sm mt-3 max-w-xl tracking-wide">
          Each branch operates under its own subdomain. Same standard. Different markets.
        </p>
        <div className="gold-line mt-4 max-w-xs" />
      </div>

      {/* Standard branch cards */}
      <div className="space-y-4 mb-4">
        {BRANCHES.map((branch) => (
          <div
            key={branch.num}
            className="relative bg-rh-card border border-rh-border rounded-lg overflow-hidden card-ambient"
          >
            {/* Ghost number */}
            <span
              className="absolute top-0 left-4 text-[7rem] lg:text-[8rem] font-light leading-none select-none pointer-events-none"
              style={{ fontFamily: 'var(--font-cormorant)', color: 'rgba(255,255,255,0.03)' }}
              aria-hidden
            >
              {branch.num}
            </span>

            <div className="relative flex flex-col md:flex-row md:items-center gap-6 p-6 md:p-8">
              {/* Identity */}
              <div className="flex-shrink-0 md:w-72">
                <div className="flex items-center gap-2.5 mb-1">
                  <Image
                    src="/rh-logo.png"
                    alt=""
                    width={20}
                    height={20}
                    className="opacity-50"
                    aria-hidden
                  />
                  <span
                    className="text-[11px] tracking-[0.3em] uppercase text-rh-muted"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                  >
                    RoadHouse
                  </span>
                </div>
                <div
                  className="text-4xl lg:text-5xl font-light italic text-rh-text"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  {branch.name}
                </div>
                <div
                  className="text-[10px] text-rh-faint tracking-wider mt-1.5"
                  style={{ fontFamily: 'var(--font-dm-mono)' }}
                >
                  {branch.subdomain}
                </div>
              </div>

              {/* Vertical rule */}
              <div className="hidden md:block w-px self-stretch bg-rh-border flex-shrink-0" />

              {/* Description */}
              <div className="flex-1">
                <p className="text-[13px] text-rh-muted leading-relaxed tracking-wide">
                  {branch.description}
                </p>
                {branch.stat && (
                  <div className="mt-2 text-[10px] tracking-widest uppercase text-gold/50">
                    {branch.stat}
                  </div>
                )}
              </div>

              {/* Status + CTA */}
              <div className="flex flex-row md:flex-col items-center md:items-end gap-3 flex-shrink-0">
                {branch.status === 'live' ? (
                  <>
                    <span className="px-2 py-0.5 text-[9px] tracking-widest uppercase border rounded text-green-400 border-green-400/30 bg-green-400/5">
                      ● Live
                    </span>
                    <a
                      href={branch.href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 text-[10px] tracking-widest uppercase border border-gold/30 text-gold hover:bg-gold/10 rounded transition-colors"
                    >
                      Visit <ExternalLink size={10} />
                    </a>
                  </>
                ) : (
                  <span className="px-2 py-0.5 text-[9px] tracking-widest uppercase border rounded text-rh-faint border-rh-border">
                    ◇ Coming Soon
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coconut Cowboy — featured branch card */}
      <div className="relative bg-rh-card border border-rh-border rounded-lg overflow-hidden card-ambient">
        {/* Ghost number */}
        <span
          className="absolute top-0 left-4 text-[7rem] lg:text-[8rem] font-light leading-none select-none pointer-events-none"
          style={{ fontFamily: 'var(--font-cormorant)', color: 'rgba(255,255,255,0.03)' }}
          aria-hidden
        >
          04
        </span>

        <div className="relative flex flex-col lg:flex-row gap-0">
          {/* Left: identity + description + CTA */}
          <div className="flex flex-col justify-between gap-6 p-6 md:p-8 lg:w-80 xl:w-96 flex-shrink-0">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <Image
                  src="/rh-logo.png"
                  alt=""
                  width={20}
                  height={20}
                  className="opacity-50"
                  aria-hidden
                />
                <span
                  className="text-[11px] tracking-[0.3em] uppercase text-rh-muted"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  Praetorian Holdings
                </span>
              </div>
              <div
                className="text-4xl lg:text-5xl font-light italic text-rh-text leading-tight"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Coconut<br />Cowboy
              </div>
              <div
                className="text-[10px] text-rh-faint tracking-wider mt-1.5"
                style={{ fontFamily: 'var(--font-dm-mono)' }}
              >
                coconutcowboy.ca
              </div>

              <div className="gold-line mt-4 max-w-[80px]" />

              <p className="text-[13px] text-rh-muted leading-relaxed tracking-wide mt-4">
                Born in Alberta and Milwaukee — 22% ABV coconut vodka. Smooth enough for a cocktail,
                bold enough to stand alone.
              </p>
              <div className="mt-2 text-[10px] tracking-widest uppercase text-gold/50">
                22% ABV · Alberta & Milwaukee
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="px-2 py-0.5 text-[9px] tracking-widest uppercase border rounded text-green-400 border-green-400/30 bg-green-400/5 self-start">
                ● Live
              </span>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://coconutcowboy.ca"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 text-[10px] tracking-widest uppercase border border-gold/30 text-gold hover:bg-gold/10 rounded transition-colors"
                >
                  Visit <ExternalLink size={10} />
                </a>
                <a
                  href="#coconut"
                  className="flex items-center gap-1.5 px-4 py-2 text-[10px] tracking-widest uppercase border border-rh-border text-rh-muted hover:border-gold/30 hover:text-gold rounded transition-colors"
                >
                  Recipes ↓
                </a>
              </div>
            </div>
          </div>

          {/* Right: live site embed */}
          <div className="flex-1 border-t lg:border-t-0 lg:border-l border-rh-border min-h-[320px] lg:min-h-0 overflow-hidden">
            {/* Browser chrome bar */}
            <div className="flex items-center gap-2.5 px-3 py-2 bg-rh-elevated border-b border-rh-border">
              <div className="flex gap-1.5 flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-rh-faint/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-rh-faint/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-rh-faint/40" />
              </div>
              <div
                className="flex-1 bg-rh-card rounded px-2.5 py-1 text-[10px] text-rh-faint truncate"
                style={{ fontFamily: 'var(--font-dm-mono)' }}
              >
                coconutcowboy.ca
              </div>
              <a
                href="https://coconutcowboy.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-rh-faint hover:text-gold transition-colors"
                aria-label="Open in new tab"
              >
                <ExternalLink size={11} />
              </a>
            </div>

            {/* Site preview */}
            <a
              href="https://coconutcowboy.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="relative block overflow-hidden"
              style={{ height: '380px' }}
              aria-label="Visit Coconut Cowboy"
            >
              <Image
                src="/coconutcowboywebpic.png"
                alt="Coconut Cowboy website"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
