import StudioNav             from '@/components/studio/StudioNav'
import StudioHero            from '@/components/studio/StudioHero'
import StudioProcess         from '@/components/studio/StudioProcess'
import StudioIndustries      from '@/components/studio/StudioIndustries'
import StudioTicker          from '@/components/studio/StudioTicker'
import StudioEngage          from '@/components/studio/StudioEngage'
import StudioWebGLBackground from '@/components/studio/StudioWebGLBackground'
import StudioProgressLine    from '@/components/studio/StudioProgressLine'
import StudioAudio           from '@/components/studio/StudioAudio'

export default function StudioPage() {
  return (
    <main data-section="studio">
      {/* ── Fixed WebGL + gradient veil — never remounts regardless of page state ── */}
      <StudioWebGLBackground />

      {/* ── All page content scrolls above the fixed background ── */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <StudioNav />
        <StudioHero />
        {/* Post-hero content scrolls over the fixed WebGL canvas */}
        <div style={{ position: 'relative', zIndex: 1, background: 'rgba(7,8,10,0.92)' }}>
          <StudioProcess />
          <StudioIndustries />
          <StudioTicker />
          <StudioEngage />
        </div>
      </div>

      {/* ── Fixed overlays — progress line + ambient audio ── */}
      <StudioProgressLine />
      <StudioAudio />
    </main>
  )
}
