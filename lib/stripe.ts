import Stripe from 'stripe'
import { optionalEnv } from '@/lib/env'

// ── Lazy Stripe instance ──────────────────────────────────────────────────────
// Initialized on first use, not at module load time.
// This prevents build-time crashes when STRIPE_SECRET_KEY is not set.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  const key = optionalEnv('STRIPE_SECRET_KEY')
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Add it to .env.local or Vercel environment variables.'
    )
  }
  if (!_stripe) {
    _stripe = new Stripe(key, {
      apiVersion: '2023-10-16',
      typescript: true,
    })
  }
  return _stripe
}

// Convenience export — same usage as before but lazy
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop]
  },
})

// App URL — safe to read at build time (NEXT_PUBLIC_* is always available)
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://roadhouse.capital'