import type { Metadata } from 'next'
import { Bebas_Neue, DM_Mono, Barlow } from 'next/font/google'
import GSAPProvider    from '@/components/studio/GSAPProvider'
import LenisProvider   from '@/components/studio/LenisProvider'
import StudioCursor    from '@/components/studio/StudioCursor'
import StudioGrain     from '@/components/studio/StudioGrain'

const bebas = Bebas_Neue({
  weight:   '400',
  subsets:  ['latin'],
  variable: '--font-bebas',
  display:  'swap',
})

const dmMono = DM_Mono({
  weight:   ['300', '400', '500'],
  subsets:  ['latin'],
  variable: '--font-dm-mono-studio',
  display:  'swap',
})

const barlow = Barlow({
  weight:   ['300', '400', '500', '600'],
  subsets:  ['latin'],
  variable: '--font-barlow',
  display:  'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://studio.roadhouse.capital'),
  title:        'RoadHouse Studio — Operators Build Different.',
  description:  'RoadHouse Studio builds platforms, identities, and owned IP for operators. Fixed scope. Full ownership. 7–21 days.',
  alternates: {
    canonical: 'https://studio.roadhouse.capital',
  },
  openGraph: {
    title:       'RoadHouse Studio — Operators Build Different.',
    description: 'Fixed scope. Full ownership. 7–21 days. No surprises.',
    url:         'https://studio.roadhouse.capital',
    siteName:    'RoadHouse Studio',
    type:        'website',
    images: [
      {
        url:    '/studio/og.jpg',
        width:  1200,
        height: 630,
        alt:    'RoadHouse Studio — Operators Build Different.',
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'RoadHouse Studio — Operators Build Different.',
    description: 'Fixed scope. Full ownership. 7–21 days. No surprises.',
    images:      ['/studio/og.jpg'],
  },
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${bebas.variable} ${dmMono.variable} ${barlow.variable} min-h-screen`}
      style={{ background: '#07080A', color: '#E8E0D0' }}
    >
      <GSAPProvider />
      <LenisProvider />
      <StudioCursor />
      <StudioGrain />
      {children}
    </div>
  )
}
