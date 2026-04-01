'use client'

import { siteConfig } from '@/lib/site-config'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { X, Menu, ExternalLink } from 'lucide-react'
import WalletStatus from '@/components/wallet/WalletStatus'
import NetworkIndicator from '@/components/wallet/NetworkIndicator'

const NAV_ITEMS = [
  { href: '#home',         icon: '⌂',  label: 'Home' },
  { href: '#stream',       icon: '▶',  label: 'Live Stream' },
  { href: '#feed',         icon: '◈',  label: 'Community Feed' },
  { href: '#merch',        icon: '🛒', label: 'Merch Store' },
  { href: '#membership',   icon: '★',  label: 'Membership' },
  { href: '#events',       icon: '◆',  label: 'Events' },
  { href: '#adventures',   icon: '◈',  label: 'Adventures' },
  { href: '/compound',     icon: '⬡',  label: 'The Compound' },
  { href: '#sponsorships', icon: '⬡',  label: 'Sponsorships' },
  { href: '#guilds',       icon: '◇',  label: 'Guild Architecture' },
  { href: '#token',        icon: '$',  label: '$ROAD Token' },
  { href: '#mint',         icon: '⬡',  label: 'Founding Mint' },
  { href: '#roadmap',      icon: '→',  label: 'Roadmap' },
  { href: '#contact',      icon: '✉',  label: 'Contact' },
  { href: '/partners',    icon: '★',  label: 'Partners' },
]

const SOCIAL_LINKS = [
  { href: 'https://x.com/dollywooddole',               icon: '𝕏',  label: '@dollywooddole' },
  { href: 'https://kick.com/dollywooddole',             icon: '⬡',  label: 'Kick Stream' },
  { href: 'https://www.tiktok.com/@roadhousesyndicate', icon: '♪',  label: '@roadhousesyndicate' },
  { href: 'https://www.tiktok.com/@dollywooddole',      icon: '♪',  label: '@dollywooddole' },
  { href: 'https://discord.gg/wwhhKcnQJ3',             icon: '💬', label: 'Discord' },
]

const SIDEBAR_HIDDEN_PATHS = ['/login', '/compound', '/portal', '/welcome']

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('home')

  if (SIDEBAR_HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null

  useEffect(() => {
    const handleScroll = () => {
      const sections = NAV_ITEMS
        .filter(i => i.href.startsWith('#'))
        .map(i => i.href.replace('#', ''))
      const current = sections.find(id => {
        const el = document.getElementById(id)
        if (!el) return false
        const rect = el.getBoundingClientRect()
        return rect.top <= 100 && rect.bottom >= 100
      })
      if (current) setActive(current)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (href: string) => {
    setOpen(false)
    if (href.startsWith('/')) {
      window.location.href = href
    } else {
      const id = href.replace('#', '')
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-rh-card border border-rh-border text-gold hover:border-gold transition-colors"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 nav-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col overflow-hidden
          transition-transform duration-300 ease-in-out
          w-[280px]
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          fontFamily: 'var(--font-dm-mono)',
          background: 'rgba(14, 12, 8, 0.50)',
          WebkitBackdropFilter: 'blur(48px) saturate(200%) brightness(108%)',
          backdropFilter: 'blur(48px) saturate(200%) brightness(108%)',
          boxShadow: 'none',
        }}
      >
        {/* Noise grain — frosted texture */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.68' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E")`,
            opacity: 0.045,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
          }}
        />
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gold/15">
          <div>
            <div
              className="text-xl font-light tracking-[0.3em] uppercase text-gold-light"
              style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
            >
              RoadHouse
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="text-[10px] tracking-[0.25em] text-rh-muted uppercase">
                roadhouse.capital
              </div>
              <NetworkIndicator />
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-rh-muted hover:text-gold transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Live badge */}
        <div className="px-6 py-3 border-b border-gold/15">
          <a
            href="https://kick.com/dollywooddole"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[11px] tracking-widest text-rh-muted hover:text-gold transition-colors"
          >
            <span className="live-dot" />
            <span className="uppercase">kick.com/dollywooddole</span>
            <ExternalLink size={10} className="opacity-50" />
          </a>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2">
            <span className="text-[9px] tracking-[0.3em] uppercase text-rh-faint font-medium">Navigate</span>
          </div>
          <ul className="space-y-0.5 px-3">
            {NAV_ITEMS.map(item => {
              const id = item.href.replace('#', '')
              const isActive = active === id
              return (
                <li key={item.href}>
                  <button
                    onClick={() => handleNavClick(item.href)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                      text-[12px] tracking-wider transition-colors duration-150
                      ${isActive
                        ? 'bg-white/5 text-gold border-l-2 border-gold'
                        : 'text-white/60 hover:text-white/90 hover:bg-white/5 border border-transparent'
                      }
                    `}
                  >
                    <span className="w-4 text-center text-sm opacity-70">{item.icon}</span>
                    <span className="uppercase">{item.label}</span>
                    {isActive && <span className="ml-auto w-1 h-1 rounded-full bg-gold" />}
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="px-4 mt-6 mb-2">
            <span className="text-[9px] tracking-[0.3em] uppercase text-rh-faint font-medium">External</span>
          </div>
          <ul className="space-y-0.5 px-3">
            {SOCIAL_LINKS.map(link => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12px] tracking-wider text-white/60 hover:text-gold transition-colors duration-150"
                >
                  <span className="w-4 text-center text-sm opacity-70">{link.icon}</span>
                  <span>{link.label}</span>
                  <ExternalLink size={10} className="ml-auto opacity-40" />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Member Dashboard link */}
        <div className="px-4 pb-3">
          <a
            href="/dashboard"
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-[12px] tracking-wider uppercase border border-gold/30 text-gold hover:bg-gold/10 transition-colors"
          >
            <span className="flex items-center gap-3">
              <span className="w-4 text-center opacity-70">◈</span>
              <span>Member Dashboard</span>
            </span>
            <span className="opacity-50 text-[10px]">→</span>
          </a>
        </div>

        {/* Wallet — $ROAD balance + tier progress */}
        <WalletStatus />

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gold/15">
          <div className="text-[10px] text-white/40 tracking-wider">
            <div>© 2026 Praetorian Holdings Corp.</div>
            <a href={`mailto:${siteConfig.contactEmail}`} className="hover:text-gold transition-colors">
              {siteConfig.contactEmail}
            </a>
          </div>
        </div>
      </aside>
    </>
  )
}
