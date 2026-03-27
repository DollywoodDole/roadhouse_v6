/**
 * RETIRED — This route is superseded by /api/webhooks/stripe/route.ts
 * ──────────────────────────────────────────────────────────────────────
 * The canonical Stripe webhook handler is:
 *   app/api/webhooks/stripe/route.ts
 *
 * That handler adds:
 *   - KV-backed idempotency guard (SET NX EX 24h) with in-memory fallback
 *   - Structured JSON logging for all events
 *   - Full email suite (welcome, upgrade, offboarding, payment failed)
 *   - initRoadBalance() on checkout.session.completed for new members
 *   - Properly typed Stripe event objects (no `any` casts on event data)
 *
 * Stripe dashboard: set webhook endpoint to
 *   https://roadhouse.capital/api/webhooks/stripe
 *
 * This file returns 410 Gone so any misconfigured calls are surfaced
 * immediately in Stripe's webhook dashboard rather than silently failing.
 */

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error:    'This webhook endpoint has been retired.',
      canonical: 'https://roadhouse.capital/api/webhooks/stripe',
    },
    { status: 410 }
  )
}
