import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "O'Brian's Automotive Group",
  description: "Saskatchewan's Trusted Auto Group. Browse our certified pre-owned and new vehicle inventory.",
}

export default function MotorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      <header className="border-b border-white/10 bg-[#0D0D0D] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex flex-col justify-center">
            <span className="text-white font-semibold text-base sm:text-lg leading-tight tracking-tight">
              O&apos;Brian&apos;s Automotive Group
            </span>
            <span className="text-white/30 text-[10px] tracking-widest uppercase leading-tight">
              Powered by RoadHouse
            </span>
          </div>

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
          <p className="text-white/30 text-xs">
            &copy; {new Date().getFullYear()} O&apos;Brian&apos;s Automotive Group. All rights reserved.
          </p>
          <p className="text-white/20 text-xs">
            Powered by RoadHouse
          </p>
        </div>
      </footer>
    </div>
  )
}
