'use client'

import { useState } from 'react'
import { MAKES, CATEGORIES, CONDITIONS, OWNERSHIP_OPTIONS } from '@/lib/motors/trade-in-options'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPhone(val: string): string {
  const d = val.replace(/\D/g, '').slice(0, 10)
  if (d.length < 4) return d
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

// ── Shared style tokens ───────────────────────────────────────────────────────

const inputBase = 'w-full bg-white/5 border text-white placeholder:text-white/30 text-sm rounded-lg px-4 py-3 focus:outline-none transition-colors'
const iNormal   = `${inputBase} border-white/10 focus:border-white/30`
const iErr      = `${inputBase} border-red-500/50 focus:border-red-400/70`

const selectBase = 'w-full bg-[#111111] border text-white text-sm rounded-lg px-4 py-3 pr-10 focus:outline-none transition-colors appearance-none'
const sNormal    = `${selectBase} border-white/10 focus:border-white/30`
const sErr       = `${selectBase} border-red-500/50 focus:border-red-400/70`

const labelCls = 'block text-white/50 text-xs font-semibold tracking-wider uppercase mb-1.5'
const errCls   = 'text-red-400 text-xs mt-1'

const FORM_ID = 'trade-in-form'
const REQUIRED_FIELDS = ['category', 'year', 'make', 'model', 'mileage', 'condition', 'ownership', 'name', 'phone'] as const

// ── Sub-components ────────────────────────────────────────────────────────────

function ChevronDown() {
  return (
    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}

function FieldErr({ msg }: { msg: string | null }) {
  if (!msg) return null
  return <p className={errCls}>{msg}</p>
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-white/30 text-xs font-semibold tracking-widest uppercase pb-1 border-b border-white/[0.06]">
      {children}
    </h2>
  )
}

function Req() {
  return <span className="text-amber-500 ml-0.5">*</span>
}

function Opt() {
  return <span className="text-white/25 font-normal normal-case tracking-normal ml-1">(optional)</span>
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TradeInForm() {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear + 2 - 1990 }, (_, i) => currentYear + 1 - i)

  // Field state
  const [category,  setCategory]  = useState('')
  const [year,      setYear]      = useState('')
  const [make,      setMake]      = useState('')
  const [model,     setModel]     = useState('')
  const [trim,      setTrim]      = useState('')
  const [mileage,   setMileage]   = useState('')
  const [condition, setCondition] = useState('')
  const [postal,    setPostal]    = useState('')
  const [notes,     setNotes]     = useState('')
  const [upgrade,   setUpgrade]   = useState('')
  const [ownership, setOwnership] = useState('')
  const [name,      setName]      = useState('')
  const [phone,     setPhone]     = useState('')
  const [email,     setEmail]     = useState('')

  // UX state
  const [touched,  setTouched]  = useState<Partial<Record<string, boolean>>>({})
  const [status,   setStatus]   = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function touch(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  function getErr(field: string): string | null {
    if (!touched[field]) return null
    switch (field) {
      case 'category':  return !category   ? 'Please select a vehicle type' : null
      case 'year':      return !year       ? 'Please select a year'         : null
      case 'make':      return !make       ? 'Please select a make'         : null
      case 'model':     return !model.trim()? 'Please enter the model'      : null
      case 'mileage':   return mileage === ''? 'Please enter mileage'       : null
      case 'condition': return !condition  ? 'Please select a condition'    : null
      case 'ownership': return !ownership  ? 'Please select an option'      : null
      case 'name':      return !name.trim()? 'Name is required'             : null
      case 'phone': {
        if (!phone.trim()) return 'Phone is required'
        if (phone.replace(/\D/g, '').length < 10) return 'Enter a valid 10-digit number'
        return null
      }
      default: return null
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Mark all required fields as touched so errors appear
    setTouched(Object.fromEntries(REQUIRED_FIELDS.map(f => [f, true])))

    // Validate directly (state hasn't re-rendered yet after setTouched)
    const phoneDigits = phone.replace(/\D/g, '')
    if (
      !category || !year || !make || !model.trim() ||
      mileage === '' || !condition || !ownership ||
      !name.trim() || !phone.trim() || phoneDigits.length < 10
    ) return

    setStatus('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/motors/trade-in', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category, year, make,
          model:      model.trim(),
          trim:       trim.trim() || undefined,
          mileage,
          condition,
          postalCode: postal.trim() || undefined,
          notes:      notes.trim() || undefined,
          upgrade:    upgrade.trim() || undefined,
          ownership,
          name:       name.trim(),
          phone,
          email:      email.trim() || undefined,
        }),
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
    } catch {
      setStatus('error')
      setErrorMsg('Connection error. Please call us at (306) 381-8222.')
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (status === 'success') {
    const summaryRows: [string, string][] = [
      ['Vehicle',    `${year} ${make} ${model}${trim ? ` ${trim}` : ''}`],
      ['Category',   category],
      ['Mileage',    `${Number(mileage).toLocaleString('en-CA')} km`],
      ['Condition',  condition.charAt(0).toUpperCase() + condition.slice(1)],
      ['Ownership',  ownership],
      ...(postal  ? [['Postal code', postal]]  as [string, string][] : []),
      ...(upgrade ? [['Upgrade to',  upgrade]] as [string, string][] : []),
    ]
    return (
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-7 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-base">Thanks {name} — we'll be in touch.</p>
            <p className="text-white/50 text-sm mt-0.5">We'll text {phone} within 24 hours with your appraisal.</p>
          </div>
        </div>
        <div className="border-t border-white/[0.06] pt-5 space-y-2.5">
          <p className="text-white/30 text-xs font-semibold tracking-wider uppercase mb-3">What you submitted</p>
          {summaryRows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 text-sm">
              <span className="text-white/40 shrink-0">{label}</span>
              <span className="text-white/70 text-right">{value}</span>
            </div>
          ))}
          {notes && (
            <div className="text-sm pt-1">
              <span className="text-white/40 block mb-1">Notes</span>
              <span className="text-white/60 text-xs leading-relaxed">{notes}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const isSubmitting = status === 'submitting'

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <>
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-8 pb-24 md:pb-0">

        {/* ── Section 1: Vehicle Details ────────────────────────────────── */}
        <div className="space-y-5">
          <SectionHead>Vehicle Details</SectionHead>

          {/* Category */}
          <div>
            <label className={labelCls}>Vehicle Type<Req /></label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { setCategory(cat); touch('category') }}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                    category === cat
                      ? 'bg-amber-500 border-amber-500 text-black font-semibold'
                      : 'bg-white/5 border-white/10 text-white/65 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <FieldErr msg={getErr('category')} />
          </div>

          {/* Year + Make */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Year<Req /></label>
              <div className="relative">
                <select
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  onBlur={() => touch('year')}
                  className={getErr('year') ? sErr : sNormal}
                >
                  <option value="">Select year</option>
                  {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                </select>
                <ChevronDown />
              </div>
              <FieldErr msg={getErr('year')} />
            </div>
            <div>
              <label className={labelCls}>Make<Req /></label>
              <div className="relative">
                <select
                  value={make}
                  onChange={e => setMake(e.target.value)}
                  onBlur={() => touch('make')}
                  className={getErr('make') ? sErr : sNormal}
                >
                  <option value="">Select make</option>
                  {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown />
              </div>
              <FieldErr msg={getErr('make')} />
            </div>
          </div>

          {/* Model + Trim */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Model<Req /></label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                onBlur={() => touch('model')}
                placeholder="F-150, Corolla…"
                maxLength={80}
                className={getErr('model') ? iErr : iNormal}
              />
              <FieldErr msg={getErr('model')} />
            </div>
            <div>
              <label className={labelCls}>Trim<Opt /></label>
              <input
                type="text"
                value={trim}
                onChange={e => setTrim(e.target.value)}
                placeholder="XLT, LT, SE…"
                maxLength={60}
                className={iNormal}
              />
            </div>
          </div>

          {/* Mileage */}
          <div>
            <label className={labelCls}>Mileage<Req /></label>
            <div className="relative max-w-[240px]">
              <input
                type="number"
                value={mileage}
                onChange={e => setMileage(e.target.value)}
                onBlur={() => touch('mileage')}
                placeholder="85000"
                min={0}
                max={9999999}
                className={`${getErr('mileage') ? iErr : iNormal} pr-12`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none select-none">
                km
              </span>
            </div>
            <FieldErr msg={getErr('mileage')} />
          </div>

          {/* Condition radio cards */}
          <div>
            <label className={labelCls}>Condition<Req /></label>
            <div className="grid grid-cols-2 gap-3">
              {CONDITIONS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => { setCondition(c.value); touch('condition') }}
                  className={`text-left p-4 rounded-xl border transition-colors ${
                    condition === c.value
                      ? 'border-amber-500/50 bg-amber-500/[0.07]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full border-2 shrink-0 transition-colors ${
                      condition === c.value ? 'border-amber-400 bg-amber-400' : 'border-white/25'
                    }`} />
                    <span className={`text-sm font-semibold transition-colors ${
                      condition === c.value ? 'text-amber-400' : 'text-white/80'
                    }`}>
                      {c.label}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs leading-snug pl-5">{c.descriptor}</p>
                </button>
              ))}
            </div>
            <FieldErr msg={getErr('condition')} />
          </div>
        </div>

        {/* ── Section 2: Context ────────────────────────────────────────── */}
        <div className="space-y-5 border-t border-white/[0.06] pt-6">
          <SectionHead>A Bit More Context</SectionHead>

          {/* Postal code */}
          <div>
            <label className={labelCls}>Postal Code<Opt /></label>
            <input
              type="text"
              value={postal}
              onChange={e => setPostal(e.target.value)}
              placeholder="S7K 2A4"
              maxLength={7}
              className={`${iNormal} max-w-[180px]`}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Anything We Should Know?<Opt /></label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Accident history, mechanical issues, modifications, recent work…"
              maxLength={1000}
              rows={3}
              className={`${iNormal} resize-none`}
            />
          </div>

          {/* Upgrade interest */}
          <div>
            <label className={labelCls}>Looking to Upgrade to Anything Specific?<Opt /></label>
            <input
              type="text"
              value={upgrade}
              onChange={e => setUpgrade(e.target.value)}
              placeholder="F-150, SUV under $35k, etc."
              maxLength={150}
              className={iNormal}
            />
          </div>

          {/* Ownership status */}
          <div>
            <label className={labelCls}>Ownership Status<Req /></label>
            <div className="grid grid-cols-2 gap-2">
              {OWNERSHIP_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setOwnership(opt); touch('ownership') }}
                  className={`text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                    ownership === opt
                      ? 'border-amber-500/50 bg-amber-500/[0.07] text-amber-300'
                      : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white/80'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <FieldErr msg={getErr('ownership')} />
          </div>
        </div>

        {/* ── Section 3: Contact ────────────────────────────────────────── */}
        <div className="space-y-4 border-t border-white/[0.06] pt-6">
          <SectionHead>Your Contact Info</SectionHead>

          {/* Name */}
          <div>
            <label className={labelCls}>Name<Req /></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => touch('name')}
              placeholder="Your name"
              maxLength={100}
              className={getErr('name') ? iErr : iNormal}
            />
            <FieldErr msg={getErr('name')} />
          </div>

          {/* Phone */}
          <div>
            <label className={labelCls}>Phone<Req /></label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              onBlur={() => touch('phone')}
              placeholder="(306) 555-1234"
              className={getErr('phone') ? iErr : iNormal}
            />
            <FieldErr msg={getErr('phone')} />
          </div>

          {/* Email */}
          <div>
            <label className={labelCls}>Email<Opt /></label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={200}
              className={iNormal}
            />
          </div>
        </div>

        {/* Error message */}
        {status === 'error' && (
          <p className="text-red-400 text-sm">{errorMsg}</p>
        )}

        {/* Desktop submit */}
        <div className="hidden md:block pt-2 space-y-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-black font-bold text-base py-3.5 rounded-xl transition-colors"
          >
            {isSubmitting ? 'Submitting…' : 'Get My Appraisal'}
          </button>
          <p className="text-white/25 text-xs text-center">
            We respond within 24 hours. No obligation. Your information stays with us.
          </p>
        </div>
      </form>

      {/* Mobile sticky submit — mirrors StickyCallBar pattern */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0A0A0A]/95 backdrop-blur border-t border-white/[0.08] px-4 py-3 space-y-1.5">
          <button
            type="submit"
            form={FORM_ID}
            disabled={isSubmitting}
            className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-black font-bold text-base py-3.5 rounded-xl transition-colors"
          >
            {isSubmitting ? 'Submitting…' : 'Get My Appraisal'}
          </button>
          <p className="text-white/25 text-xs text-center">
            No obligation. Response within 24 hours.
          </p>
        </div>
    </>
  )
}
