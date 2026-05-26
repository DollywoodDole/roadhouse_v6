'use client'

import { ExternalLink } from 'lucide-react'

const KICK_CLIPS = [
  { id: 'clip_01KKDHTH3RXQBGX32BF91WQGF8', title: 'Community Moment', duration: 'Clip' },
]

const TIKTOK_CATEGORIES = [
  { icon: '🎬', label: 'Brand Stories', url: 'https://www.tiktok.com/@roadhousesyndicate' },
  { icon: '🥥', label: 'Coconut Cowboy', url: 'https://www.tiktok.com/@roadhousesyndicate' },
  { icon: '⚡', label: 'Stream Clips', url: 'https://www.tiktok.com/@roadhousesyndicate' },
  { icon: '🔬', label: 'Tech/Physics', url: 'https://www.tiktok.com/@dollywooddole' },
]

export default function CommunityFeed() {
  return (
    <section id="feed" className="px-8 lg:px-16 py-20">
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">X · TikTok · Kick — All Platforms</div>
        <h2 className="text-5xl lg:text-7xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Community <span className="text-gold">Feed</span>
        </h2>
        <div className="gold-line mt-4 max-w-xs" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* X / Twitter embed */}
        <div className="lg:col-span-1">
          <div className="bg-rh-card border border-rh-border rounded-lg overflow-hidden card-glow">
            <div className="flex items-center justify-between px-4 py-3 border-b border-rh-border">
              <div className="flex items-center gap-2">
                <span className="text-base">𝕏</span>
                <span className="text-[11px] tracking-widest uppercase text-rh-muted">X / Twitter</span>
              </div>
              <a
                href="https://x.com/dollywooddole"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-rh-muted hover:text-gold transition-colors flex items-center gap-1"
              >
                @dollywooddole <ExternalLink size={9} />
              </a>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <p className="text-[12px] text-rh-muted leading-relaxed">
                Tech, synthesis, physics, AI, and community building — posted when there&apos;s something worth saying.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Tech', 'Synthesis', 'AI', 'Physics', 'Community'].map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-[10px] tracking-widest uppercase border border-rh-border text-rh-muted rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <a
                href="https://x.com/dollywooddole"
                target="_blank"
                rel="noopener noreferrer"
                className="stripe-btn block text-center text-rh-black text-[11px] tracking-widest uppercase py-2.5 rounded font-medium"
              >
                Follow @dollywooddole ↗
              </a>
            </div>
          </div>
        </div>

        {/* TikTok */}
        <div>
          <div className="bg-rh-card border border-rh-border rounded-lg overflow-hidden card-glow h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-rh-border">
              <div className="flex items-center gap-2">
                <span className="text-base" style={{ color: '#FE2C55' }}>♪</span>
                <span className="text-[11px] tracking-widest uppercase text-rh-muted">TikTok</span>
              </div>
            </div>
            <div className="p-5 flex flex-col gap-4 flex-1">
              {/* @roadhousesyndicate */}
              <div className="p-4 rounded border border-rh-border">
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: '#FE2C55' }} className="text-sm">♪</span>
                  <div>
                    <div className="text-[12px] font-medium text-rh-text">RoadHouse Syndicate</div>
                    <div className="text-[10px] text-rh-faint">@roadhousesyndicate</div>
                  </div>
                </div>
                <p className="text-[11px] text-rh-muted leading-relaxed mb-3">
                  Brand stories, Coconut Cowboy moments, community highlights, and viral challenges.
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {TIKTOK_CATEGORIES.slice(0, 3).map(cat => (
                    <a
                      key={cat.label}
                      href={cat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-[9px] tracking-wider border border-rh-border text-rh-muted hover:border-gold/30 hover:text-gold rounded transition-colors"
                    >
                      {cat.icon} {cat.label}
                    </a>
                  ))}
                </div>
                <a
                  href="https://www.tiktok.com/@roadhousesyndicate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] tracking-widest uppercase flex items-center gap-1"
                  style={{ color: '#FE2C55' }}
                >
                  Follow @roadhousesyndicate <ExternalLink size={9} />
                </a>
              </div>

              {/* @dollywooddole */}
              <div className="p-4 rounded border border-rh-border">
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: '#FE2C55' }} className="text-sm">♪</span>
                  <div>
                    <div className="text-[12px] font-medium text-rh-text">DollywoodDole</div>
                    <div className="text-[10px] text-rh-faint">@dollywooddole</div>
                  </div>
                </div>
                <p className="text-[11px] text-rh-muted leading-relaxed mb-3">
                  Personal channel: tech, physics, synthesis, and authentic founder content.
                </p>
                <a
                  href="https://www.tiktok.com/@dollywooddole"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] tracking-widest uppercase flex items-center gap-1"
                  style={{ color: '#FE2C55' }}
                >
                  Follow @dollywooddole <ExternalLink size={9} />
                </a>
              </div>

              <div className="mt-auto p-3 rounded border border-[#FE2C55]/20 text-center">
                <p className="text-[10px] text-rh-muted mb-2">Brand partnerships via TikTok Creator Marketplace</p>
                <a
                  href="https://www.tiktok.com/business/en-US/creator-marketplace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] tracking-widest uppercase flex items-center justify-center gap-1"
                  style={{ color: '#FE2C55' }}
                >
                  Open Creator Marketplace <ExternalLink size={9} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Kick Clips */}
        <div>
          <div className="bg-rh-card border border-rh-border rounded-lg overflow-hidden card-glow h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-rh-border">
              <div className="flex items-center gap-2">
                <span className="text-base" style={{ color: '#53FC18' }}>⬡</span>
                <span className="text-[11px] tracking-widest uppercase text-rh-muted">Kick Clips</span>
              </div>
              <a
                href="https://kick.com/dollywooddole"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-rh-muted hover:text-gold transition-colors flex items-center gap-1"
              >
                View All <ExternalLink size={9} />
              </a>
            </div>
            <div className="p-5 flex flex-col gap-4 flex-1">
              <p className="text-[11px] text-rh-muted leading-relaxed">
                Highlights from long-form streams. Sessions run 8–12 hours — the best moments clipped and distributed.
              </p>

              {/* Clip embed */}
              <div className="kick-container rounded overflow-hidden border border-rh-border bg-rh-black">
                <iframe
                  src="https://kick.com/dollywooddole/clips/clip_01KKDHTH3RXQBGX32BF91WQGF8?autoplay=false"
                  title="Latest Kick Clip"
                  allowFullScreen
                  allow="fullscreen"
                />
              </div>

              <div className="space-y-2">
                {KICK_CLIPS.map(clip => (
                  <a
                    key={clip.id}
                    href={`https://kick.com/dollywooddole/clips/${clip.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded border border-rh-border hover:border-gold/30 transition-colors group"
                  >
                    <span className="text-gold/60 group-hover:text-gold transition-colors">▶</span>
                    <div className="flex-1 text-[11px] text-rh-muted truncate">{clip.id.substring(0, 28)}…</div>
                    <span className="text-[9px] text-rh-faint">{clip.duration}</span>
                  </a>
                ))}
              </div>

              <div className="mt-auto">
                <a
                  href="https://kick.com/dollywooddole"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center py-2.5 text-[10px] tracking-widest uppercase border rounded transition-colors"
                  style={{ borderColor: 'rgba(83,252,24,0.3)', color: '#53FC18' }}
                >
                  Open Kick Channel ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}
