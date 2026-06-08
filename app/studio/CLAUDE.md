# RoadHouse Studio — `app/studio/`

> Subdomain: `studio.roadhouse.capital` — creative + build arm.

## Design system — inline styles only, no Tailwind

```css
bg: #07080A   border: #141618 / #1A1C1F / #1E2024   amber: #C8861E
text-warm: #E8E0D0   text-muted: #878070 (code) / #5A5550 (spec)   text-dark: #2A2520
```

Fonts (CSS vars via next/font/google on wrapper div in `app/studio/layout.tsx`):
- `--font-bebas` → Bebas_Neue weight 400 — headlines
- `--font-dm-mono-studio` → DM_Mono weights 300/400/500 — labels, nav, meta
- `--font-barlow` → Barlow weights 300/400/500/600 — body copy

Rules: inline styles only; no Tailwind on studio components; amber `#C8861E` is the single accent.

## File structure

```
/app/studio/
  layout.tsx    ← nested layout; fonts via next/font/google; CSS vars --font-bebas · --font-dm-mono-studio · --font-barlow
                   mounts: GSAPProvider · LenisProvider · StudioCursor · StudioGrain
  page.tsx      ← mounts: StudioWebGLBackground (fixed bg) · StudioNav · StudioHero
                           StudioProcess · StudioIndustries · StudioTicker · StudioEngage
                           StudioProgressLine (fixed overlay) · StudioAudio (fixed overlay)

/components/studio/
  — Layout providers (mounted in layout.tsx) —
  GSAPProvider.tsx        ← registers GSAP + ScrollTrigger globally
  LenisProvider.tsx       ← smooth scroll; writes --scroll-velocity CSS var to <html>
  StudioCursor.tsx        ← custom cursor
  StudioGrain.tsx         ← fixed grain overlay

  — Page sections (mounted in page.tsx) —
  StudioWebGLBackground.tsx  ← fixed WebGL + gradient veil; never remounts
  StudioNav.tsx              ← sticky nav; links: Work · House · Contact; CTA "Enter ↗" → mailto:roadhousesyndicate@gmail.com; velocity-reactive RS mark glow
  StudioHero.tsx             ← sticky 100vh hero; activeView: 'client'|'house' toggle; renders StudioServices + MotorsCaseStudy below fold
  StudioProcess.tsx          ← 4-step process section (Discovery · Proposal · Build · Launch)
  StudioIndustries.tsx       ← industries grid (Automotive · Agriculture · Trades · Hospitality · Retail · Professional)
  StudioTicker.tsx           ← scrolling ticker
  StudioEngage.tsx           ← contact/CTA section; uses MagneticButton
  StudioProgressLine.tsx     ← fixed scroll progress indicator
  StudioAudio.tsx            ← ambient audio (fixed)

  — Sub-components —
  StudioServices.tsx         ← client: Build/Mark/Move · house: Signal/Produce/IP; rendered inside StudioHero
  MotorsCaseStudy.tsx        ← returns null when activeView !== 'client'; rendered inside StudioHero
                                TODO: replace hardcoded stats (112 vehicles) with getInventoryCount('obrians')
                                Blocked on multi-dealer-wip merge to main
  MagneticButton.tsx         ← magnetic hover button; used by StudioEngage

/lib/studio/
  index.ts        ← empty export (placeholder)
  animations.ts   ← GSAP helpers: heroEntrance() · scrambleText() · scrambleOnEnter()
                                   sectionEntrance() · processEntrance() · processLine()

/types/studio.ts  ← empty (placeholder)
```

## Assets

`/public/studio/` — `og.jpg` (OG image 1200×630) · `rh-logo.png` (nav logo, amber-filtered)

## Constraints

Inline styles only — no Tailwind. All studio routes FULLY_PUBLIC in proxy.ts. No membership branding, no $ROAD, no wallet UI.

## M3 TODO (studio)

- **#16 Studio live inventory** — merge `multi-dealer-wip` → wire `getInventoryCount('obrians')` into `MotorsCaseStudy.tsx` to replace hardcoded `'112'`
