import { siteConfig } from '@/lib/site-config'
import Sidebar from '@/components/Sidebar'
import Hero from '@/components/sections/Hero'
import KickStream from '@/components/sections/KickStream'
import CommunityFeed from '@/components/sections/CommunityFeed'
import Merch from '@/components/sections/Merch'
import Membership from '@/components/sections/Membership'
import Events from '@/components/sections/Events'
import Adventures from '@/components/sections/Adventures'
import Compound from '@/components/sections/Compound'
import Sponsorships from '@/components/sections/Sponsorships'
import Guilds from '@/components/sections/Guilds'
import Roadmap from '@/components/sections/Roadmap'
import CoconutCowboy from '@/components/sections/CoconutCowboy'
import OpportunitiesAndContact from '@/components/sections/OpportunitiesAndContact'
import RoadToken from '@/components/sections/RoadToken'
import FoundingMint from '@/components/sections/FoundingMint'
import SectionDivider from '@/components/ui/SectionDivider'

export default function Home() {
  return (
    <div className="flex min-h-screen bg-rh-black">
      <Sidebar />

      <main className="main-content flex-1 w-full">
        <Hero />
        <SectionDivider />
        <KickStream />
        <SectionDivider />
        <CommunityFeed />
        <SectionDivider />
        <Merch />
        <SectionDivider />
        <Membership />
        <SectionDivider />
        <Events />
        <SectionDivider />
        <Adventures />
        <SectionDivider />
        <Compound />
        <SectionDivider />
        <Sponsorships />
        <SectionDivider />
        <Guilds />
        <SectionDivider />
        <RoadToken />
        <SectionDivider />
        <FoundingMint />
        <SectionDivider />
        <Roadmap />
        <SectionDivider />
        <CoconutCowboy />
        <SectionDivider />
        <OpportunitiesAndContact />

        <SectionDivider />

        {/* Footer */}
        <footer className="px-8 lg:px-16 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <div
                className="text-2xl font-light italic text-gold-light mb-2"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                RoadHouse
              </div>
              <p className="text-[11px] text-rh-muted leading-relaxed">
                A creator-owned ecosystem at the intersection of streaming media, DAO governance, and physical infrastructure.
                IP owned by Praetorian Holdings Corp.
              </p>
            </div>

            <div>
              <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint mb-3">Platforms</div>
              <ul className="space-y-2">
                {[
                  { label: 'Kick Stream', href: 'https://kick.com/dollywooddole' },
                  { label: 'X / Twitter', href: 'https://x.com/dollywooddole' },
                  { label: 'TikTok (Brand)', href: 'https://www.tiktok.com/@roadhousesyndicate' },
                  { label: 'TikTok (Personal)', href: 'https://www.tiktok.com/@dollywooddole' },
                  { label: 'Discord', href: 'https://discord.gg/wwhhKcnQJ3' },
                ].map(l => (
                  <li key={l.label}>
                    <a href={l.href} target="_blank" rel="noopener noreferrer"
                      className="text-[11px] text-rh-muted hover:text-gold transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint mb-3">Community</div>
              <ul className="space-y-2">
                {[
                  { label: 'Merch Store', href: '#merch' },
                  { label: 'Membership', href: '#membership' },
                  { label: 'Events', href: '#events' },
                  { label: 'Guild Architecture', href: '#guilds' },
                  { label: '$ROAD Token', href: '#token' },
                  { label: 'The Compound', href: '/compound' },
                ].map(l => (
                  <li key={l.label}>
                    <a href={l.href} className="text-[11px] text-rh-muted hover:text-gold transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-[9px] tracking-[0.3em] uppercase text-rh-faint mb-3">Contact</div>
              <ul className="space-y-2">
                {[
                  { label: siteConfig.contactEmail, href: `mailto:${siteConfig.contactEmail}` },
                  { label: siteConfig.founderEmail, href: `mailto:${siteConfig.founderEmail}` },
                  { label: 'Coconut Cowboy', href: 'https://coconutcowboy.ca/' },
                  { label: 'Send a Message', href: '#contact' },
                ].map(l => (
                  <li key={l.label}>
                    <a href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined}
                      rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-[11px] text-rh-muted hover:text-gold transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="gold-line mb-6" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="text-[10px] text-rh-faint tracking-wider">
              © 2026 Praetorian Holdings Corp. · All intellectual property reserved · Saskatchewan, Canada
            </div>
            <div className="text-[10px] text-rh-faint tracking-wider italic">
              Discretion · High Standards · One Smooth Ride
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
