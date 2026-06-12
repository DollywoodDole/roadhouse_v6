'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { fbq } from '@/lib/motors/pixel'

const provinces = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
  'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon',
]

const inputClass =
  'w-full bg-white border border-gray-200 text-gray-900 text-base rounded-lg ' +
  'px-4 py-3 focus:outline-none focus:border-gray-400 ' +
  'transition-colors placeholder:text-gray-400'

const selectClass =
  'w-full bg-white border border-gray-200 text-gray-800 text-base rounded-lg ' +
  'px-4 py-3 focus:outline-none focus:border-gray-400 ' +
  'transition-colors appearance-none cursor-pointer'

const labelClass = 'block text-gray-500 text-sm font-medium uppercase tracking-wider mb-1.5'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 pb-3 mb-5">
      <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-widest">{children}</h2>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  )
}

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}

// ── Credit Rebuild section ─────────────────────────────────────────────────────

const ACCORDION_ITEMS = [
  {
    title: 'Credit Score',
    body:  'Your score matters, but it\'s not the only factor. Income, down payment, and vehicle LTV often carry more weight with sub-prime lenders.',
  },
  {
    title: 'Down Payment',
    body:  'A larger down payment lowers the lender\'s risk and can unlock better rates. Most sub-prime approvals require 10–20% down. We\'ll work with what you have.',
  },
  {
    title: 'Income & Employment',
    body:  'Lenders want to see stable income — typically $2,000+/month take-home. Self-employed, hourly, and seasonal income all qualify with the right documentation.',
  },
  {
    title: 'Debt-to-Income Ratio',
    body:  'Your existing monthly obligations (rent, loans, etc.) vs. your income. Lower is better. We\'ll help you understand where you stand before you apply.',
  },
]

function CreditRebuildSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <div className="bg-[#0A0A0A] text-white">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">

        {/* Heading */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-4">RoadHouse Credit Rebuild</h2>
          <p className="text-white/60 text-base leading-relaxed max-w-2xl">
            We work with lenders across all credit profiles — prime, near-prime, sub-prime, and credit rebuilders.
            If you&apos;ve been turned away before or are working on rebuilding your credit, you&apos;re in the right place.
          </p>
        </div>

        {/* Three cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: 'All Credit Profiles Welcome',
              body:  'We have lender relationships across every credit tier. Your score is a starting point, not a verdict.',
            },
            {
              title: 'Transparent Rate Ranges',
              body:  'Most approvals fall between 4.99%–19.99% depending on your profile, down payment, and vehicle. We\'ll tell you your rate before you sign anything.',
            },
            {
              title: 'The 12-Month Path',
              body:  'Make your payments on time for 12 months and we\'ll connect you with a refinance check-in. Building credit is a process — we\'re here for the whole ride.',
            },
          ].map(card => (
            <div
              key={card.title}
              className="border border-white/10 rounded-xl p-5 space-y-3 hover:border-white/20 transition-colors"
              style={{ borderTopColor: 'rgba(201,146,42,0.4)' }}
            >
              <div className="flex items-start gap-2">
                <span className="text-[#C9922A] mt-0.5 shrink-0">✓</span>
                <h3 className="text-white font-semibold text-base leading-snug">{card.title}</h3>
              </div>
              <p className="text-white/55 text-sm leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>

        {/* Accordion */}
        <div className="space-y-2">
          <h3 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">What Lenders Look At</h3>
          {ACCORDION_ITEMS.map((item, i) => (
            <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
              >
                <span className="text-white font-medium text-sm">{item.title}</span>
                <svg
                  className={`w-4 h-4 text-white/40 shrink-0 transition-transform ${openIdx === i ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIdx === i && (
                <div className="px-5 pb-5 text-white/55 text-sm leading-relaxed border-t border-white/[0.05]">
                  <p className="pt-4">{item.body}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Co-signer callout */}
        <div className="border border-white/10 rounded-xl p-6 bg-white/[0.02] space-y-2">
          <h3 className="text-white font-semibold text-base">Have a Co-Signer?</h3>
          <p className="text-white/55 text-sm leading-relaxed">
            A co-signer with stronger credit can significantly improve your approval odds and rate.
            They share responsibility for the loan but don&apos;t need to be on the vehicle registration.
            Questions about co-signers? Include it in your message below.
          </p>
        </div>

      </div>
    </div>
  )
}

// ── Main form component ────────────────────────────────────────────────────────

export default function CreditForm() {
  const searchParams = useSearchParams()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', dob: '', maritalStatus: '',
    sin: '',
    street: '', city: '', province: 'Saskatchewan', postalCode: '', timeAtAddress: '',
    employmentStatus: '', employer: '', position: '', annualIncome: '', timeAtJob: '',
    downPayment: '', monthlyPayment: '', bankruptcy: '', repossession: '', creditRating: '', coSigner: '',
    vehicleInterest: '', vin: '', tradeIn: '', notes: '',
    consent: false,
  })
  const [status,   setStatus]   = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Vehicle context — ?v={label}&?vin={vin} (new format) or ?vehicle={label} (legacy)
  const [vehicleContext, setVehicleContext] = useState<{ label: string; vin: string } | null>(null)

  useEffect(() => {
    const v       = searchParams.get('v') ?? searchParams.get('vehicle') ?? ''
    const vinParam = searchParams.get('vin') ?? ''
    if (v || vinParam) {
      setVehicleContext({ label: v, vin: vinParam })
      setForm((f) => ({ ...f, vehicleInterest: v || vinParam, vin: vinParam }))
    }
    fbq('track', 'InitiateCheckout', {
      content_category: 'credit-application',
      ...(v ? { content_name: v } : {}),
      ...(vinParam ? { content_ids: [vinParam] } : {}),
    })
  }, [searchParams])

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.consent) { setErrorMsg('Please accept the consent statement to continue.'); return }
    setStatus('submitting')
    setErrorMsg('')
    try {
      const res = await fetch('/api/motors/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          vin: form.vin || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Submission failed')
      }
      setStatus('success')
      fbq('track', 'Lead', {
        content_category: 'credit-application',
        ...(form.vehicleInterest ? { content_name: form.vehicleInterest } : {}),
        ...(form.vin ? { content_ids: [form.vin] } : {}),
      })
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div>
      <CreditRebuildSection />

      <div className="min-h-screen bg-white">
        <div className="max-w-[780px] mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {status === 'success' ? (
            <div className="py-16 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-2">
                <svg className="w-7 h-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-light text-gray-900">
                Thanks {form.firstName} — we&apos;ll be in touch within 1 business day.
              </h2>
              <p className="text-gray-500 text-base">Check your email. In the meantime, feel free to browse our inventory.</p>
              <Link
                href="/motors/inventory"
                className="inline-block mt-4 bg-gray-900 text-white text-sm font-semibold tracking-wider uppercase px-8 py-3 rounded hover:bg-gray-700 transition-colors"
              >
                Browse Inventory
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <Link
                  href="/motors/inventory"
                  className="text-gray-400 hover:text-gray-600 text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 mb-6"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Inventory
                </Link>
                <h1 className="text-4xl font-light text-gray-900 tracking-tight">Pre-Qualification Form</h1>
                <p className="mt-2 text-gray-500 text-base leading-relaxed max-w-lg">
                  Complete the form below and we&apos;ll get back to you within one business day.
                  All information is kept confidential.
                </p>

                {vehicleContext && (vehicleContext.label || vehicleContext.vin) && (
                  <div className="mt-4 flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0M13 17H9m0 0l-1-4m1 4H5m4 0l-1-4m0 0H5m4 0h4M5 13l1-5h12l1 5" />
                    </svg>
                    <div>
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-0.5">Applying for</p>
                      {vehicleContext.label && (
                        <p className="text-gray-900 text-sm font-medium">{vehicleContext.label}</p>
                      )}
                      {vehicleContext.vin && (
                        <p className="text-gray-400 text-xs font-mono mt-0.5">VIN: {vehicleContext.vin}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">

                <section>
                  <SectionHeading>Personal Information</SectionHeading>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="First Name">
                      <input required type="text" value={form.firstName} onChange={set('firstName')} placeholder="First name" className={inputClass} />
                    </Field>
                    <Field label="Last Name">
                      <input required type="text" value={form.lastName} onChange={set('lastName')} placeholder="Last name" className={inputClass} />
                    </Field>
                    <Field label="Email">
                      <input required type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={inputClass} />
                    </Field>
                    <Field label="Phone">
                      <input required type="tel" value={form.phone} onChange={set('phone')} placeholder="(306) 000-0000" className={inputClass} />
                    </Field>
                    <Field label="Date of Birth">
                      <input required type="date" value={form.dob} onChange={set('dob')} className={inputClass} />
                    </Field>
                    <Field label="Marital Status">
                      <SelectWrapper>
                        <select value={form.maritalStatus} onChange={set('maritalStatus')} className={selectClass}>
                          <option value="">Select…</option>
                          <option>Single</option>
                          <option>Married</option>
                          <option>Common-Law</option>
                          <option>Divorced</option>
                          <option>Widowed</option>
                        </select>
                      </SelectWrapper>
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Social Insurance Number (optional)">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={form.sin}
                          onChange={set('sin')}
                          placeholder="XXX-XXX-XXX"
                          maxLength={11}
                          className={inputClass}
                        />
                        <p className="mt-1.5 text-gray-400 text-xs leading-relaxed">
                          Required by lenders to pull a credit bureau report. You can provide this later if preferred.
                          Your SIN is encrypted and never shared without your knowledge.
                        </p>
                      </Field>
                    </div>
                  </div>
                </section>

                <section>
                  <SectionHeading>Current Address</SectionHeading>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Street Address">
                      <input required type="text" value={form.street} onChange={set('street')} placeholder="123 Main St" className={inputClass} />
                    </Field>
                    <Field label="City">
                      <input required type="text" value={form.city} onChange={set('city')} placeholder="Saskatoon" className={inputClass} />
                    </Field>
                    <Field label="Province">
                      <SelectWrapper>
                        <select required value={form.province} onChange={set('province')} className={selectClass}>
                          {provinces.map((p) => (
                            <option key={p}>{p}</option>
                          ))}
                        </select>
                      </SelectWrapper>
                    </Field>
                    <Field label="Postal Code">
                      <input required type="text" value={form.postalCode} onChange={set('postalCode')} placeholder="S7K 0A1" className={inputClass} />
                    </Field>
                    <Field label="Time at Address">
                      <SelectWrapper>
                        <select value={form.timeAtAddress} onChange={set('timeAtAddress')} className={selectClass}>
                          <option value="">Select…</option>
                          <option>Less than 1 year</option>
                          <option>1–2 years</option>
                          <option>2–5 years</option>
                          <option>5+ years</option>
                        </select>
                      </SelectWrapper>
                    </Field>
                  </div>
                </section>

                <section>
                  <SectionHeading>Employment</SectionHeading>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Employment Status">
                      <SelectWrapper>
                        <select required value={form.employmentStatus} onChange={set('employmentStatus')} className={selectClass}>
                          <option value="">Select…</option>
                          <option>Employed Full-Time</option>
                          <option>Employed Part-Time</option>
                          <option>Self-Employed</option>
                          <option>Retired</option>
                          <option>Student</option>
                          <option>Other</option>
                        </select>
                      </SelectWrapper>
                    </Field>
                    <Field label="Employer Name">
                      <input type="text" value={form.employer} onChange={set('employer')} placeholder="Company name" className={inputClass} />
                    </Field>
                    <Field label="Position / Title">
                      <input type="text" value={form.position} onChange={set('position')} placeholder="Your role" className={inputClass} />
                    </Field>
                    <Field label="Annual Income (CAD)">
                      <input required type="number" min="0" value={form.annualIncome} onChange={set('annualIncome')} placeholder="0" className={inputClass} />
                    </Field>
                    <Field label="Time at Current Job">
                      <SelectWrapper>
                        <select value={form.timeAtJob} onChange={set('timeAtJob')} className={selectClass}>
                          <option value="">Select…</option>
                          <option>Less than 1 year</option>
                          <option>1–2 years</option>
                          <option>2–5 years</option>
                          <option>5+ years</option>
                        </select>
                      </SelectWrapper>
                    </Field>
                  </div>
                </section>

                <section>
                  <SectionHeading>Financial</SectionHeading>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Estimated Down Payment (CAD)">
                      <input type="number" min="0" value={form.downPayment} onChange={set('downPayment')} placeholder="0" className={inputClass} />
                    </Field>
                    <Field label="Monthly Rent / Mortgage (CAD)">
                      <input type="number" min="0" value={form.monthlyPayment} onChange={set('monthlyPayment')} placeholder="0" className={inputClass} />
                    </Field>
                    <Field label="Previous Bankruptcy?">
                      <SelectWrapper>
                        <select value={form.bankruptcy} onChange={set('bankruptcy')} className={selectClass}>
                          <option value="">Select…</option>
                          <option value="no">No</option>
                          <option value="yes">Yes, discharged</option>
                          <option value="current">Currently in bankruptcy</option>
                        </select>
                      </SelectWrapper>
                    </Field>
                    <Field label="Vehicle Previously Repossessed?">
                      <SelectWrapper>
                        <select value={form.repossession} onChange={set('repossession')} className={selectClass}>
                          <option value="">Select…</option>
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </SelectWrapper>
                    </Field>
                    <Field label="How would you rate your credit?">
                      <SelectWrapper>
                        <select value={form.creditRating} onChange={set('creditRating')} className={selectClass}>
                          <option value="">Select…</option>
                          <option value="excellent">Excellent (750+)</option>
                          <option value="good">Good (700–749)</option>
                          <option value="fair">Fair (650–699)</option>
                          <option value="poor">Poor (below 650)</option>
                          <option value="unsure">Not sure</option>
                        </select>
                      </SelectWrapper>
                    </Field>
                    <Field label="Co-signer?">
                      <SelectWrapper>
                        <select value={form.coSigner} onChange={set('coSigner')} className={selectClass}>
                          <option value="">Select…</option>
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                          <option value="maybe">Possibly</option>
                        </select>
                      </SelectWrapper>
                    </Field>
                  </div>
                </section>

                <section>
                  <SectionHeading>Vehicle Interest</SectionHeading>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="What are you looking for?">
                      <input type="text" value={form.vehicleInterest} onChange={set('vehicleInterest')} placeholder="e.g. 2020 Ford F-150, SUV under $40k" className={inputClass} />
                    </Field>
                    <Field label="Trade-in vehicle?">
                      <SelectWrapper>
                        <select value={form.tradeIn} onChange={set('tradeIn')} className={selectClass}>
                          <option value="">Select…</option>
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </SelectWrapper>
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Additional Notes">
                        <textarea
                          value={form.notes}
                          onChange={set('notes')}
                          rows={3}
                          placeholder="Anything else we should know…"
                          className={`${inputClass} resize-none`}
                        />
                      </Field>
                    </div>
                  </div>
                </section>

                <section>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="mt-0.5 relative shrink-0">
                      <input
                        type="checkbox"
                        checked={form.consent}
                        onChange={set('consent')}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border transition-colors ${form.consent ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300 group-hover:border-gray-400'}`}>
                        {form.consent && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-500 text-sm leading-relaxed">
                      I authorize RoadHouse Motors (Praetorian Holdings Corp., DL331386) to collect, use, and share the
                      information on this form for the purpose of evaluating my financing pre-qualification. I understand this
                      does not guarantee financing approval.
                    </span>
                  </label>
                </section>

                {errorMsg && (
                  <p className="text-red-500 text-sm">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full sm:w-auto bg-gray-900 text-white text-base font-semibold tracking-wider uppercase px-10 py-4 rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'submitting' ? 'Submitting…' : 'Submit Pre-Qualification'}
                </button>

              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
