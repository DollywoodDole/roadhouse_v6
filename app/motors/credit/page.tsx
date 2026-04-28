'use client'

import { useState } from 'react'
import Link from 'next/link'

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

export default function CreditPage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', dob: '', maritalStatus: '',
    street: '', city: '', province: 'Saskatchewan', postalCode: '', timeAtAddress: '',
    employmentStatus: '', employer: '', position: '', annualIncome: '', timeAtJob: '',
    downPayment: '', monthlyPayment: '', bankruptcy: '', repossession: '', creditRating: '', coSigner: '',
    vehicleInterest: '', tradeIn: '', notes: '',
    consent: false,
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const set = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.consent) { setErrorMsg('Please accept the consent statement to continue.'); return }
    setStatus('submitting')
    setErrorMsg('')
    try {
      const res = await fetch('/api/motors/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Submission failed')
      }
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 gap-5 text-center">
        <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-light text-gray-900">Application Received</h1>
        <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
          Thanks, {form.firstName}. We&apos;ll review your application and be in touch within one business day.
          A confirmation has been sent to {form.email}.
        </p>
        <Link
          href="/motors/inventory"
          className="mt-4 text-gray-400 hover:text-gray-600 text-sm transition-colors underline underline-offset-2"
        >
          Back to inventory
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[780px] mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Page header */}
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
          <h1 className="text-4xl font-light text-gray-900 tracking-tight">Credit Application</h1>
          <p className="mt-2 text-gray-500 text-base leading-relaxed max-w-lg">
            Complete the form below and we&apos;ll get back to you within one business day.
            All information is kept confidential.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">

          {/* Personal Information */}
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
            </div>
          </section>

          {/* Current Address */}
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

          {/* Employment */}
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

          {/* Financial */}
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

          {/* Vehicle Interest */}
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

          {/* Consent */}
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
                information on this form for the purpose of evaluating my credit application. I understand this
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
            {status === 'submitting' ? 'Submitting…' : 'Submit Application'}
          </button>

        </form>
      </div>
    </div>
  )
}
