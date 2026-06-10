import type { Metadata } from 'next'
import './globals.css'
import { SolanaWalletProvider } from '@/components/wallet/WalletProvider'

export const metadata: Metadata = {
  metadataBase: new URL('https://roadhouse.capital'),
  title: 'RoadHouse — Where Standards Matter',
  description: 'A creator-owned ecosystem at the intersection of streaming, community, and culture. Saskatchewan, Canada. Praetorian Holdings Corp.',
  keywords: ['RoadHouse', 'Kick streaming', 'Coconut Cowboy', 'community', 'DAO', 'Saskatchewan'],
  authors: [{ name: 'Dalton Ellscheid', url: 'https://x.com/dollywooddole' }],
  openGraph: {
    title: 'RoadHouse — Where Standards Matter',
    description: 'A creator-owned ecosystem converting streaming attention into community capital. Discretion. High Standards. One Smooth Ride.',
    url: 'https://roadhouse.capital',
    siteName: 'RoadHouse',
    type: 'website',
    images: [
      {
        url: '/rh-hero.jpg',
        width: 1080,
        height: 1080,
        alt: 'RoadHouse',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@dollywooddole',
    creator: '@dollywooddole',
    title: 'RoadHouse — Where Standards Matter',
    description: 'A creator-owned ecosystem. Discretion. High Standards. One Smooth Ride.',
    images: ['/rh-hero.jpg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Roboto:wght@300;400;500;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
      </head>
      <body className="grain">
        <SolanaWalletProvider>
          {children}
        </SolanaWalletProvider>
      </body>
    </html>
  )
}
