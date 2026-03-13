/**
 * RoadHouse Capital — Stripe Client
 * Server-side only. Never import this from client components.
 */

import Stripe from 'stripe'
import { requireEnv, requirePublicEnv } from '@/lib/env'

// Throws a clear error at module load time if the secret key is missing
export const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-04-10',
  typescript: true,
})

// Public app URL — required, no localhost fallback in production
export const APP_URL = requirePublicEnv('NEXT_PUBLIC_APP_URL')

// ── Price ID helpers ───────────────────────────────────────────────────────
// Returns null if the price ID is not configured — callers must handle null
// and disable checkout rather than sending a fake ID to Stripe.

export function getPriceId(envKey: string): string | null {
  const val = process.env[envKey]
  if (!val || val.trim() === '' || val.startsWith('price_REPLACE')) {
    return null
  }
  return val
}
