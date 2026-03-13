'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

export default function KickStream() {
  const [showChat, setShowChat] = useState(false)

  return (
    <section id="stream" className="px-8 lg:px-16 py-20">
      {/* Section header */}
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.4em] uppercase text-gold mb-2">Kick.com — Long-form · Unfiltered · High-Standard</div>
        <h2 className="text-4xl lg:text-5xl font-light italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Live <span className="text-gold">Stream</span>
        </h2>
        <div className="gold-line mt-4 max-w-xs" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Stream embed — takes 2/3 */}
        <div className="xl:col-span-2">
          <div className="bg-rh-card border border-rh-border rounded-lg overflow-hidden card-glow">
            <div className="flex items-center justify-between px-4 py-3 border-b border-rh-border">
              <div className="flex items-center gap-3">
                <span className="live-dot" />
                <span className="text-[11px] tracking-widest uppercase text-gold">DollywoodDole</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowChat(c => !c)}
                  className="text-[10px] tracking-widest uppercase text-rh-muted hover:text-gold transition-colors"
                >
                  {showChat ? 'Hide Chat' : 'Show Chat'}
                </button>
                <a
                  href="https://kick.com/dollywooddole"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] tracking-widest uppercase text-rh-muted hover:text-gold transition-colors flex items-center gap-1"
                >
                  Open Kick <ExternalLink size={10} />
                </a>
              </div>
            </div>
            <div className="kick-container bg-rh-black">
              <iframe
                src="https://player.kick.com/dollywooddole"
                title="DollywoodDole Live on Kick"
                allowFullScreen
                allow="autoplay; fullscreen"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-6">
          {/* Chat */}
          {showChat && (
            <div className="bg-rh-card border border-rh-border rounded-lg overflow-hidden" style={{ height: '400px' }}>
              <div className="px-4 py-2 border-b border-rh-border">
                <span className="text-[10px] tracking-widest uppercase text-rh-muted">Live Chat</span>
              </div>
              <iframe
                src="https://kick.com/dollywooddole/chatroom"
                title="Kick Live Chat"
                className="w-full"
                style={{ height: 'calc(100% - 37px)', border: 'none' }}
              />
            </div>
          )}

          {/* Channel info */}
          <div className="bg-rh-card border border-rh-border rounded-lg p-6 card-glow">
            <div
              className="text-2xl font-light italic text-rh-text mb-1"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              DollywoodDole
            </div>
            <div className="text-[11px] tracking-wider text-rh-muted mb-4">
              Synthesizer · Physicist · CTO · Community Builder
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              {['Tech', 'Synthesis', 'Physics', 'AI', 'Community'].map(tag => (
                <span key={tag} className="px-2 py-0.5 text-[10px] tracking-widest uppercase border border-rh-border text-rh-muted rounded">
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-[12px] text-rh-muted leading-relaxed mb-5">
              Long-form streams covering synthesis, physics, AI, tech community building, and unfiltered conversation.
              Sessions regularly run 8–12 hours.
            </p>
            <a
              href="https://kick.com/dollywooddole"
              target="_blank"
              rel="noopener noreferrer"
              className="stripe-btn block text-center text-rh-black text-[11px] tracking-widest uppercase py-2.5 rounded font-medium"
            >
              Follow Channel ↗
            </a>
          </div>

          {/* VOD Highlights */}
          <div className="bg-rh-card border border-rh-border rounded-lg p-5 card-glow">
            <div className="text-[10px] tracking-[0.3em] uppercase text-rh-muted mb-4">VOD Highlights</div>
            <div className="space-y-3">
              {[
                { title: 'Community Q&A', tags: 'Tech · Hiring', dur: '~8h', clip: 'clip_01KKDHTH3RXQBGX32BF91WQGF8' },
                { title: 'AI & Physics Deep Dive', tags: 'Grok · First Principles', dur: '~10h', clip: null },
                { title: 'Synthesizer Workshop', tags: 'Live Sound Design', dur: '~12h', clip: null },
              ].map(vod => (
                <a
                  key={vod.title}
                  href={vod.clip ? `https://kick.com/dollywooddole/clips/${vod.clip}` : 'https://kick.com/dollywooddole'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded border border-rh-border hover:border-gold/30 hover:bg-rh-elevated transition-all group"
                >
                  <span className="text-gold/60 group-hover:text-gold transition-colors">▶</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-rh-text truncate">{vod.title}</div>
                    <div className="text-[10px] text-rh-faint">{vod.tags}</div>
                  </div>
                  <span className="text-[10px] text-rh-faint whitespace-nowrap">{vod.dur}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
