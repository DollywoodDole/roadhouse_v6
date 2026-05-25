export default function InventoryLoading() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero skeleton */}
      <div className="w-full animate-pulse rounded-xl bg-[#1A1A1A]" style={{ aspectRatio: '1534/1025', minHeight: 220 }} />

      <div className="flex flex-col md:flex-row gap-8 mt-8">
        {/* Sidebar skeleton */}
        <aside className="hidden md:block w-72 shrink-0">
          <div className="bg-[#111111] rounded-xl p-5 space-y-4 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-white/5" />
            ))}
          </div>
        </aside>

        {/* Card grid skeleton */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-[#111111] border border-white/10 rounded-xl overflow-hidden">
              <div className="aspect-[16/10] bg-white/5" />
              <div className="p-4 space-y-3">
                <div className="h-3 w-1/3 rounded bg-white/5" />
                <div className="h-5 w-3/4 rounded bg-white/5" />
                <div className="h-3 w-1/2 rounded bg-white/5" />
                <div className="h-px bg-white/5" />
                <div className="flex items-center justify-between">
                  <div className="h-7 w-24 rounded bg-white/5" />
                  <div className="h-9 w-28 rounded-lg bg-white/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
