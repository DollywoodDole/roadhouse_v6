import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'RoadHouse Motors',
  description: "Saskatchewan's Trusted Auto Group. Browse our certified pre-owned and new vehicle inventory.",
}

export default function MotorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <header className="border-b border-white/10 bg-[#0D0D0D] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/motors/inventory" className="opacity-90 hover:opacity-100 transition-opacity">
            <Image
              src="/rh-logo.png"
              alt="RoadHouse Motors"
              width={120}
              height={42}
              className="object-contain"
              priority
              unoptimized
            />
          </Link>

          <div className="flex items-center gap-4">
            <a
              href="tel:+13065550100"
              className="hidden sm:block text-white/60 text-sm hover:text-white transition-colors"
            >
              (306) 555-0100
            </a>
            <Link
              href="/motors/inventory"
              className="bg-white text-black text-sm font-semibold px-4 py-2 rounded hover:bg-white/90 transition-colors whitespace-nowrap"
            >
              Get Pre-Approved
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Image
            src="/rh-logo.png"
            alt="RoadHouse Motors"
            width={80}
            height={28}
            className="object-contain opacity-20"
            unoptimized
          />
          <p className="text-white/20 text-xs">
            &copy; {new Date().getFullYear()} RoadHouse Motors. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
