'use client'

import { siteConfig } from '@/lib/site-config'

import { useState, useEffect } from 'react'
import { X, Menu, ExternalLink } from 'lucide-react'
import WalletStatus from '@/components/wallet/WalletStatus'

const NAV_ITEMS = [
  { href: '#home',         icon: '⌂',  label: 'Home' },
  { href: '#stream',       icon: '▶',  label: 'Live Stream' },
  { href: '#feed',         icon: '◈',  label: 'Community Feed' },
  { href: '#merch',        icon: '🛒', label: 'Merch Store' },
  { href: '#membership',   icon: '★',  label: 'Membership' },
  { href: '#events',       icon: '◆',  label: 'Events' },
  { href: '#sponsorships', icon: '⬡',  label: 'Sponsorships' },
  { href: '#guilds',       icon: '◇',  label: 'Guild Architecture' },
  { href: '#token',        icon: '$',  label: '$ROAD Token' },
  { href: '#mint',         icon: '⬡',  label: 'Founding Mint' },
  { href: '#roadmap',      icon: '→',  label: 'Roadmap' },
  { href: '#coconut',      icon: '🥥', label: 'Coconut Cowboy' },
  { href: '#opportunities',icon: '✦',  label: 'Opportunities' },
  { href: '#contact',      icon: '✉',  label: 'Contact' },
]

const SOCIAL_LINKS = [
  { href: 'https://x.com/dollywooddole',               icon: '𝕏',  label: '@dollywooddole' },
  { href: 'https://kick.com/dollywooddole',             icon: '⬡',  label: 'Kick Stream' },
  { href: 'https://www.tiktok.com/@roadhousesyndicate', icon: '♪',  label: '@roadhousesyndicate' },
  { href: 'https://www.tiktok.com/@dollywooddole',      icon: '♪',  label: '@dollywooddole' },
  { href: 'https://discord.gg/wwhhKcnQJ3',             icon: '💬', label: 'Discord' },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('home')

  useEffect(() => {
    const handleScroll = () => {
      const sections = NAV_ITEMS.map(i => i.href.replace('#', ''))
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
    const id = href.replace('#', '')
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-lg bg-rh-card border border-rh-border text-gold hover:border-gold transition-colors"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 nav-overlay lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-rh-surface border-r border-rh-border
          transition-transform duration-300 ease-in-out
          w-[280px]
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ fontFamily: 'var(--font-dm-mono)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-rh-border">
          <div>
            <div
              className="text-xl font-light tracking-[0.3em] uppercase text-gold-light"
              style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
            >
              RoadHouse
            </div>
            <div className="text-[10px] tracking-[0.25em] text-rh-muted uppercase mt-0.5">
              roadhouse.capital
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-rh-muted hover:text-gold transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Live badge */}
        <div className="px-6 py-3 border-b border-rh-border">
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
                      text-[12px] tracking-wider transition-all duration-200
                      ${isActive
                        ? 'bg-gold/10 text-gold border border-gold/20'
                        : 'text-rh-muted hover:text-rh-text hover:bg-rh-card border border-transparent'
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
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12px] tracking-wider text-rh-muted hover:text-gold transition-colors"
                >
                  <span className="w-4 text-center text-sm opacity-70">{link.icon}</span>
                  <span>{link.label}</span>
                  <ExternalLink size={10} className="ml-auto opacity-40" />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Wallet — $ROAD balance + tier progress */}
        <WalletStatus />

        {/* Footer */}
        <div className="px-6 py-4 border-t border-rh-border">
          <div className="text-[10px] text-rh-faint tracking-wider">
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
