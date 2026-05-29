import StudioNav        from '@/components/studio/StudioNav'
import StudioHero       from '@/components/studio/StudioHero'
import StudioProcess    from '@/components/studio/StudioProcess'
import StudioIndustries from '@/components/studio/StudioIndustries'
import StudioTicker     from '@/components/studio/StudioTicker'
import StudioEngage     from '@/components/studio/StudioEngage'

export default function StudioPage() {
  return (
    <main data-section="studio">
      <StudioNav />
      <StudioHero />
      {/* Post-hero content scrolls over the sticky WebGL canvas */}
      <div style={{ position: 'relative', zIndex: 1, background: '#07080A' }}>
        <StudioProcess />
        <StudioIndustries />
        <StudioTicker />
        <StudioEngage />
      </div>
    </main>
  )
}
