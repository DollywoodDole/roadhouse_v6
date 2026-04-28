import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  metadataBase: new URL('https://motors.roadhouse.capital'),
  title: 'RoadHouse Motors',
  description: "RoadHouse Motors. Browse our certified pre-owned and new vehicle inventory. Saskatchewan delivery available.",
  openGraph: {
    title: 'RoadHouse Motors',
    description: 'Browse our certified pre-owned and new vehicle inventory. Saskatchewan delivery available.',
    url: 'https://motors.roadhouse.capital',
    siteName: 'RoadHouse Motors',
    type: 'website',
    images: [
      {
        url: 'https://motors.roadhouse.capital/motors/rh-motors-header.jpg',
        width: 2560,
        height: 1440,
        alt: 'RoadHouse Motors',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RoadHouse Motors',
    description: 'Browse our certified pre-owned and new vehicle inventory.',
    images: ['https://motors.roadhouse.capital/motors/rh-motors-header.jpg'],
  },
}

export default function MotorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-roboto flex flex-col">

      {/* Sticky top nav */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 backdrop-blur border-b border-white/[0.08]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-6">
          <Link href="/motors/inventory" className="shrink-0 hover:opacity-90 transition-opacity">
            <Image
              src="/motors/rh-logo.png"
              alt="RoadHouse Motors"
              width={144}
              height={50}
              className="object-contain"
              priority
              unoptimized
            />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/motors/inventory"
              className="text-white text-base font-medium tracking-wide uppercase px-4 py-2.5 rounded hover:bg-white/5 transition-colors"
            >
              Inventory
            </Link>
            <Link
              href="/motors/credit"
              className="text-white text-base font-medium tracking-wide uppercase px-4 py-2.5 rounded hover:bg-white/5 transition-colors"
            >
              Apply for Credit
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="tel:+13063818222"
              className="hidden sm:flex items-center gap-2 text-white/75 hover:text-white text-base transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              (306) 381-8222
            </a>
            <Link
              href="/motors/credit"
              className="bg-white text-black text-sm font-semibold tracking-wider uppercase px-5 py-3 rounded hover:bg-white/90 transition-colors whitespace-nowrap"
            >
              Get Pre-Approved
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-white/[0.08] py-12 mt-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Image
            src="/motors/rh-logo.png"
            alt="RoadHouse Motors"
            width={88}
            height={31}
            className="object-contain opacity-20"
            unoptimized
          />
          <p className="text-white/45 text-sm text-center sm:text-right">
            &copy; {new Date().getFullYear()} RoadHouse Motors &nbsp;&middot;&nbsp; Dealer Licence DL331386 &nbsp;&middot;&nbsp; Saskatchewan, Canada
          </p>
        </div>
      </footer>

    </div>
  )
}
