'use client'

import { useState } from 'react'
import { fbq } from '@/lib/motors/pixel'

interface VehicleLeadFormProps {
  vehicleInterest: string
  vin?: string
}

export default function VehicleLeadForm({ vehicleInterest, vin }: VehicleLeadFormProps) {
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [status, setStatus]   = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/motors/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, vehicleInterest, vin }),
      })

      if (res.status === 429) {
        setStatus('error')
        setErrorMsg('Already submitted. Please wait a moment and try again.')
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setStatus('error')
        setErrorMsg(data.error ?? 'Something went wrong. Please call us at (306) 381-8222.')
        return
      }

      setStatus('success')
      fbq('track', 'Lead', { content_name: vehicleInterest, content_category: 'vehicle-inquiry' })
    } catch {
      setStatus('error')
      setErrorMsg('Connection error. Please call us at (306) 381-8222.')
    }
  }

  if (status === 'success') {
    return (
      <p className="text-white/80 text-sm py-2">
        ✓ We&rsquo;ll be in touch shortly.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        required
        maxLength={100}
        className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-white/30 transition-colors"
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Your phone number"
        required
        maxLength={30}
        className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-white/30 transition-colors"
      />
      {errorMsg && (
        <p className="text-red-400 text-xs">{errorMsg}</p>
      )}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm py-3 rounded-lg transition-colors"
      >
        {status === 'submitting' ? 'Sending…' : 'Request Info'}
      </button>
      <p className="text-white/25 text-xs text-center">
        We&rsquo;ll reach out once. No repeated calls.
      </p>
    </form>
  )
}
