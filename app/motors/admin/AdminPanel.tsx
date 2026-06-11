'use client'

import { useState } from 'react'
import type { MotorsLead } from '@/types/inventory'

const STATUS_STYLE: Record<MotorsLead['status'], string> = {
  new:       'bg-amber-500/20  text-amber-400  border-amber-500/30',
  contacted: 'bg-blue-500/20   text-blue-400   border-blue-500/30',
  approved:  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  closed:    'bg-white/10      text-white/40   border-white/10',
  dead:      'bg-red-500/20    text-red-400    border-red-500/30',
}

const SOURCE_BADGE: Record<MotorsLead['source'], { label: string; style: string }> = {
  'credit-form':  { label: 'Credit',   style: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  'vehicle-form': { label: 'Inquiry',  style: 'bg-blue-500/20   text-blue-400   border-blue-500/30'   },
  'trade-in':     { label: 'Trade-In', style: 'bg-amber-500/20  text-amber-400  border-amber-500/30'  },
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-white/70 text-sm">{value}</p>
    </div>
  )
}

function StatusSelect({ lead }: { lead: MotorsLead }) {
  const [status, setStatus] = useState<MotorsLead['status']>(lead.status)
  const [saving, setSaving] = useState(false)

  async function update(next: MotorsLead['status']) {
    setSaving(true)
    try {
      await fetch(`/api/motors/leads/${lead.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: next }),
      })
      setStatus(next)
    } catch (err) {
      console.error('Status update failed', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLE[status]}`}>
        {status}
      </span>
      <select
        disabled={saving}
        value={status}
        onChange={e => update(e.target.value as MotorsLead['status'])}
        className="bg-[#1a1a1a] border border-white/10 text-white/60 text-xs rounded px-2 py-1 focus:outline-none focus:border-white/25 cursor-pointer disabled:opacity-40"
      >
        <option value="new">new</option>
        <option value="contacted">contacted</option>
        <option value="approved">approved</option>
        <option value="closed">closed</option>
        <option value="dead">dead</option>
      </select>
    </div>
  )
}

export default function AdminPanel({ leads }: { leads: MotorsLead[] }) {
  if (!leads.length) {
    return (
      <div className="text-center py-20 text-white/30 text-sm">No leads yet.</div>
    )
  }

  return (
    <div className="divide-y divide-white/[0.05]">
      {leads.map(lead => {
        const src = SOURCE_BADGE[lead.source] ?? SOURCE_BADGE['vehicle-form']
        return (
          <div key={lead.id} className="p-5 hover:bg-white/[0.015] transition-colors">

            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-white font-semibold">{lead.name}</span>
              <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${src.style}`}>
                {src.label}
              </span>
              {lead.deliveryStatus === 'failed' && (
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-red-500/20 text-red-400 border-red-500/30">
                  Email Failed
                </span>
              )}
              <span className="text-white/25 text-xs ml-auto tabular-nums">{relativeTime(lead.submittedAt)}</span>
              <StatusSelect lead={lead} />
            </div>

            {/* Contact */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 mb-3">
              <a href={`tel:${lead.phone}`} className="text-white/70 hover:text-white text-sm transition-colors">
                {lead.phone}
              </a>
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="text-white/60 hover:text-white text-sm transition-colors">
                  {lead.email}
                </a>
              )}
            </div>

            {/* Source-specific payload */}
            {lead.source === 'trade-in' && lead.tradeIn ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/[0.025] border border-white/[0.06] rounded-lg p-3">
                <Detail label="Year"      value={lead.tradeIn.year} />
                <Detail label="Make"      value={lead.tradeIn.make} />
                <Detail label="Model"     value={lead.tradeIn.model} />
                {lead.tradeIn.trim && <Detail label="Trim" value={lead.tradeIn.trim} />}
                <Detail label="Mileage"   value={`${lead.tradeIn.mileage} km`} />
                <Detail label="Condition" value={lead.tradeIn.condition} />
                <Detail label="Ownership" value={lead.tradeIn.ownership} />
                <Detail label="Category"  value={lead.tradeIn.category} />
                {lead.tradeIn.postalCode && <Detail label="Postal"     value={lead.tradeIn.postalCode} />}
                {lead.tradeIn.upgrade    && <Detail label="Upgrade to" value={lead.tradeIn.upgrade} />}
              </div>
            ) : (
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {(lead.vehicleInterest || lead.vin) && (
                  <div>
                    {lead.vehicleInterest && (
                      <p className="text-white/65 text-sm">{lead.vehicleInterest}</p>
                    )}
                    {lead.vin && (
                      <p className="text-white/30 text-xs font-mono mt-0.5">{lead.vin}</p>
                    )}
                  </div>
                )}
                {lead.creditRange      && <Detail label="Credit"     value={lead.creditRange} />}
                {lead.monthlyIncome    && <Detail label="Income/mo"  value={lead.monthlyIncome} />}
                {lead.employmentStatus && <Detail label="Employment" value={lead.employmentStatus} />}
              </div>
            )}

            {lead.message && (
              <p className="text-white/35 text-sm mt-2 italic">&ldquo;{lead.message}&rdquo;</p>
            )}

          </div>
        )
      })}
    </div>
  )
}
