import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import type { Vehicle } from '@/types/inventory'

interface Branch {
  num: string
  name: string
  domain: string
  href: string | null
  description: string
  status: 'live' | 'soon'
  stat: string | null
  entity: string
  preview?: string
  heroImage?: boolean // product photo — no browser chrome
}

const BRANCHES: Branch[] = [
  {
    num: '01',
    name: 'Motors',
    domain: 'motors.roadhouse.capital',
    href: 'https://motors.roadhouse.capital',
    description: 'Pre-owned vehicles sourced across Saskatchewan. Curated inventory, no pressure, no games.',
    status: 'live',
    stat: '~131 vehicles in stock',
    entity: 'RoadHouse',
    preview: '/motors/rh_motors_lambo.png',
    heroImage: true,
  },
  {
    num: '02',
    name: 'Flowers',
    domain: 'theoflowers.ca',
    href: 'https://theoflowers.ca',
    description: 'Premium floral arrangements for events, venues, and personal orders. High-standard sourcing, delivered.',
    status: 'live',
    stat: null,
    entity: 'RoadHouse',
    preview: '/roadhouseflowerspic.png',
  },
  {
    num: '03',
    name: 'Watches',
    domain: 'watches.roadhouse.capital',
    href: null,
    description: 'Curated timepieces — pre-owned and new. Every piece vetted before it moves.',
    status: 'soon',
    stat: null,
    entity: 'RoadHouse',
  },
  {
    num: '04',
    name: 'Coconut Cowboy',
    domain: 'coconutcowboy.ca',
    href: 'https://coconutcowboy.ca',
    description: 'Born in Alberta and Milwaukee — 22% ABV coconut vodka. Smooth enough for a cocktail, bold enough to stand alone.',
    status: 'live',
    stat: '22% ABV · Alberta & Milwaukee',
    entity: 'Praetorian Holdings',
    preview: '/coconutcowboywebpic.png',
  },
]

function GhostNum({ num }: { num: string }) {
  return (
    <span
      className="absolute top-0 left-4 text-[7rem] lg:text-[8rem] font-light leading-none select-none pointer-events-none"
      style={{ fontFamily: 'var(--font-cormorant)', color: 'rgba(255,255,255,0.03)' }}
      aria-hidden
    >
      {num}
    </span>
  )
}

function StandardCard({ branch }: { branch: Branch }) {
  return (
    <div className="relative bg-rh-card border border-rh-border rounded-lg overflow-hidden card-ambient">
      <GhostNum num={branch.num} />
      <div className="relative flex flex-col md:flex-row md:items-center gap-6 p-6 md:p-8">
        <div className="flex-shrink-0 md:w-72">
          <div className="flex items-center gap-2.5 mb-1">
            <Image src="/rh-logo.png" alt="" width={20} height={20} className="opacity-50" aria-hidden />
            <span
              className="text-[11px] tracking-[0.3em] uppercase text-rh-muted"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              {branch.entity}
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
            {branch.domain}
          </div>
        </div>

        <div className="hidden md:block w-px self-stretch bg-rh-border flex-shrink-0" />

        <div className="flex-1">
          <p className="text-[13px] text-rh-muted leading-relaxed tracking-wide">{branch.description}</p>
          {branch.stat && (
            <div className="mt-2 text-[10px] tracking-widest uppercase text-gold/50">{branch.stat}</div>
          )}
        </div>

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
  )
}

function FeaturedCard({ branch }: { branch: Branch }) {
  const isCoconut = branch.num === '04'

  return (
    <div className="relative bg-rh-card border border-rh-border rounded-lg overflow-hidden card-ambient">
      <GhostNum num={branch.num} />
      <div className="relative flex flex-col lg:flex-row gap-0">
        {/* Left: identity + description + CTA */}
        <div className="flex flex-col justify-between gap-6 p-6 md:p-8 lg:w-80 xl:w-96 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Image src="/rh-logo.png" alt="" width={20} height={20} className="opacity-50" aria-hidden />
              <span
                className="text-[11px] tracking-[0.3em] uppercase text-rh-muted"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                {branch.entity}
              </span>
            </div>
            <div
              className="text-4xl lg:text-5xl font-light italic text-rh-text leading-tight"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              {branch.name.split(' ').map((word, i, arr) => (
                <span key={i}>
                  {word}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </div>
            <div
              className="text-[10px] text-rh-faint tracking-wider mt-1.5"
              style={{ fontFamily: 'var(--font-dm-mono)' }}
            >
              {branch.domain}
            </div>
            <div className="gold-line mt-4 max-w-[80px]" />
            <p className="text-[13px] text-rh-muted leading-relaxed tracking-wide mt-4">{branch.description}</p>
            {branch.stat && (
              <div className="mt-2 text-[10px] tracking-widest uppercase text-gold/50">{branch.stat}</div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <span className="px-2 py-0.5 text-[9px] tracking-widest uppercase border rounded text-green-400 border-green-400/30 bg-green-400/5 self-start">
              ● Live
            </span>
            <div className="flex flex-wrap gap-2">
              <a
                href={branch.href!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 text-[10px] tracking-widest uppercase border border-gold/30 text-gold hover:bg-gold/10 rounded transition-colors"
              >
                Visit <ExternalLink size={10} />
              </a>
              {isCoconut && (
                <a
                  href="#coconut"
                  className="flex items-center gap-1.5 px-4 py-2 text-[10px] tracking-widest uppercase border border-rh-border text-rh-muted hover:border-gold/30 hover:text-gold rounded transition-colors"
                >
                  Recipes ↓
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right: image panel */}
        <div className="flex-1 border-t lg:border-t-0 lg:border-l border-rh-border min-h-[320px] lg:min-h-0 overflow-hidden">
          {!branch.heroImage && (
            /* Browser chrome — website previews only */
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
                {branch.domain}
              </div>
              <a
                href={branch.href!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-rh-faint hover:text-gold transition-colors"
                aria-label="Open in new tab"
              >
                <ExternalLink size={11} />
              </a>
            </div>
          )}

          <a
            href={branch.href!}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block overflow-hidden"
            style={{ height: branch.heroImage ? '420px' : '380px' }}
            aria-label={`Visit ${branch.name}`}
          >
            <Image
              src={branch.preview!}
              alt={branch.heroImage ? `${branch.name} — RoadHouse Motors` : `${branch.name} website`}
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              style={{
                objectPosition: isCoconut ? 'center 48%' : branch.heroImage ? 'center center' : 'center 20%',
              }}
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            {/* Subtle left-edge gradient to blend into the card */}
            {branch.heroImage && (
              <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-rh-card to-transparent pointer-events-none" />
            )}
          </a>
        </div>
      </div>
    </div>
  )
}

function VehicleShowcase({ vehicles }: { vehicles: Vehicle[] }) {
  if (!vehicles.length) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {vehicles.map((v) => (
        <a
          key={v.vin}
          href={`https://motors.roadhouse.capital/vehicle/${v.vin}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-rh-card border border-rh-border rounded-lg overflow-hidden hover:border-gold/40 transition-colors duration-300"
        >
          {/* Image */}
          <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
            {v.images[0] ? (
              <Image
                src={v.images[0]}
                alt={`${v.year} ${v.make} ${v.model}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-rh-elevated flex items-center justify-center">
                <Image src="/motors/rh-coming-soon.svg" alt="" width={60} height={60} className="opacity-20" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4">
            <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint mb-1.5">
              {v.exterior_color} · {v.mileage.toLocaleString('en-CA')} km
            </div>
            <div
              className="text-xl font-light italic text-rh-text leading-tight"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              {v.year} {v.make} {v.model}
            </div>
            {v.trim && (
              <div className="text-[10px] text-rh-muted mt-0.5">{v.trim}</div>
            )}
            <div
              className="text-lg font-light text-gold mt-2"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              ${v.price.toLocaleString('en-CA')} CAD
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}

interface BranchesProps {
  showcaseVehicles?: Vehicle[]
}

export default function Branches({ showcaseVehicles = [] }: BranchesProps) {
  return (
    <section id="branches" className="px-8 lg:px-16 py-20">
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
          Each branch operates under its own domain. Same standard. Different markets.
        </p>
        <div className="gold-line mt-4 max-w-xs" />
      </div>

      <div className="space-y-4">
        {BRANCHES.map((branch) => (
          <div key={branch.num} className="space-y-4">
            {branch.preview ? (
              <FeaturedCard branch={branch} />
            ) : (
              <StandardCard branch={branch} />
            )}
            {branch.num === '01' && showcaseVehicles.length > 0 && (
              <VehicleShowcase vehicles={showcaseVehicles} />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
