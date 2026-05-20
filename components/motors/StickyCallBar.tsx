'use client'

export default function StickyCallBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-2 flex items-center justify-between gap-4">
        <p className="text-white/60 text-sm hidden sm:block">Questions about this vehicle?</p>
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-white/30 text-xs">DL#331386</span>
          <a
            href="tel:+13063818222"
            className="inline-flex items-center gap-2 bg-white text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-white/90 transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            (306) 381-8222
          </a>
        </div>
      </div>
    </div>
  )
}
