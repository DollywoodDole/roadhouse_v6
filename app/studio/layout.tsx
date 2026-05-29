import type { Metadata } from 'next'
import { Bebas_Neue, DM_Mono, Barlow } from 'next/font/google'
import GSAPProvider from '@/components/studio/GSAPProvider'

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const dmMono = DM_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono-studio',
  display: 'swap',
})

const barlow = Barlow({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://studio.roadhouse.capital'),
  title: 'RoadHouse Studio',
  description: 'Operators build different.',
  alternates: {
    canonical: 'https://studio.roadhouse.capital',
  },
  openGraph: {
    title: 'RoadHouse Studio',
    description: 'Operators build different.',
    url: 'https://studio.roadhouse.capital',
    siteName: 'RoadHouse Studio',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RoadHouse Studio',
    description: 'Operators build different.',
  },
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${bebas.variable} ${dmMono.variable} ${barlow.variable} min-h-screen`}
      style={{ background: '#07080A', color: '#E8E0D0' }}
    >
      <GSAPProvider />
      {children}
    </div>
  )
}
