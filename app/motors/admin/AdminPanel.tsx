'use client'

import { useState } from 'react'
import type { MotorsLead } from '@/types/inventory'

const STATUS_STYLE: Record<MotorsLead['status'], string> = {
  new:       'bg-amber-500/20  text-amber-400  border border-amber-500/30',
  contacted: 'bg-blue-500/20   text-blue-400   border border-blue-500/30',
  approved:  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  closed:    'bg-white/10      text-white/40   border border-white/10',
  dead:      'bg-red-500/20    text-red-400    border border-red-500/30',
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function StatusSelect({ lead, token }: { lead: MotorsLead; token: string }) {
  const [status, setStatus]   = useState<MotorsLead['status']>(lead.status)
  const [saving, setSaving]   = useState(false)

  async function update(next: MotorsLead['status']) {
    setSaving(true)
    try {
      await fetch(`/api/motors/leads/${lead.id}`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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
      <span className={`text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
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

export default function AdminPanel({ leads, token }: { leads: MotorsLead[]; token: string }) {
  if (!leads.length) {
    return (
      <div className="text-center py-20 text-white/30 text-sm">No leads yet.</div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            {['Name', 'Phone', 'Email', 'Vehicle Interest', 'Credit', 'Income/mo', 'Employment', 'Submitted', 'Status'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-white/40 text-xs font-semibold tracking-wider uppercase whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map(lead => (
            <tr key={lead.id} className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{lead.name}</td>
              <td className="px-4 py-3 text-white/70 whitespace-nowrap">
                <a href={`tel:${lead.phone}`} className="hover:text-white transition-colors">{lead.phone}</a>
              </td>
              <td className="px-4 py-3 text-white/70 whitespace-nowrap">
                <a href={`mailto:${lead.email}`} className="hover:text-white transition-colors">{lead.email}</a>
              </td>
              <td className="px-4 py-3 text-white/60 max-w-[200px] truncate">{lead.vehicleInterest || '—'}</td>
              <td className="px-4 py-3 text-white/60 whitespace-nowrap">{lead.creditRange || '—'}</td>
              <td className="px-4 py-3 text-white/60 whitespace-nowrap tabular-nums">{lead.monthlyIncome || '—'}</td>
              <td className="px-4 py-3 text-white/60 whitespace-nowrap">{lead.employmentStatus}</td>
              <td className="px-4 py-3 text-white/40 whitespace-nowrap tabular-nums text-xs">{relativeTime(lead.submittedAt)}</td>
              <td className="px-4 py-3">
                <StatusSelect lead={lead} token={token} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
