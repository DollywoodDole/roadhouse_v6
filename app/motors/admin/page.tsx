import { cookies } from 'next/headers'
import { Redis } from '@upstash/redis'
import type { MotorsLead } from '@/types/inventory'
import AdminPanel from './AdminPanel'

function getRedis(): Redis {
  const url   = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN not set')
  return new Redis({ url, token })
}

async function fetchLeads(): Promise<MotorsLead[]> {
  const redis = getRedis()
  const ids   = (await redis.smembers('motors:leads:index')) as string[]
  if (!ids.length) return []

  const raw = await redis.mget<(string | null)[]>(...ids.map(id => `motors:leads:${id}`))

  return raw
    .map(r => {
      if (!r) return null
      try { return typeof r === 'string' ? JSON.parse(r) as MotorsLead : r as MotorsLead } catch { return null }
    })
    .filter((l): l is MotorsLead => l !== null)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

function LockedPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-white/20 text-xs uppercase tracking-widest mb-2">RoadHouse Motors</p>
          <h1 className="text-white text-xl font-semibold">Admin Access</h1>
          <p className="text-white/40 text-sm mt-1">Enter your admin token to continue.</p>
        </div>
        <form
          method="POST"
          action="/api/motors/admin/auth"
          className="space-y-3"
        >
          <input
            name="token"
            type="password"
            placeholder="Admin token"
            className="w-full bg-[#111111] border border-white/10 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-white/30 placeholder:text-white/25"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-white text-black font-semibold text-sm py-3 rounded-lg hover:bg-white/90 transition-colors"
          >
            Access Admin
          </button>
        </form>
      </div>
    </div>
  )
}

export default async function AdminPage() {
  const cookieStore = await cookies()
  const token  = cookieStore.get('motors-admin')?.value?.trim()
  const secret = process.env.ADMIN_SECRET?.trim()

  if (!token || !secret || token !== secret) {
    return <LockedPage />
  }

  const leads = await fetchLeads()

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-white text-xl font-semibold">Leads</h1>
            <p className="text-white/35 text-sm mt-0.5">{leads.length} total</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full">
              {leads.filter(l => l.status === 'new').length} new
            </span>
            {leads.filter(l => l.deliveryStatus === 'failed').length > 0 && (
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full">
                {leads.filter(l => l.deliveryStatus === 'failed').length} email failed
              </span>
            )}
            <a
              href="/motors/inventory"
              className="text-white/40 hover:text-white text-sm transition-colors"
            >
              ← Inventory
            </a>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden">
          <AdminPanel leads={leads} />
        </div>
      </div>
    </div>
  )
}
