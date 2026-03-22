/**
 * RoadHouse Capital — Stripe Products + Prices Setup
 * ─────────────────────────────────────────────────────
 * Creates all Stripe products and prices idempotently.
 * Uses metadata key `rh_env_var` on each Price to allow safe re-runs.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... npx ts-node --project tsconfig.scripts.json scripts/create-stripe-prices.ts
 *
 * If a Price with the matching `rh_env_var` metadata already exists it is
 * reused unchanged. To update a price, archive the old one in the Stripe
 * dashboard first — Stripe does not allow mutating a price amount.
 *
 * Output: one `ENV_VAR=price_xxx` line per product — paste into Vercel.
 */

import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error('ERROR: STRIPE_SECRET_KEY is not set.')
  process.exit(1)
}

const stripe = new Stripe(key, { apiVersion: '2024-04-10' })

// ── Product + Price definitions ────────────────────────────────────────────────

interface PriceDef {
  envVar:    string
  product:   string           // product name
  productKey: string          // stable lookup key (metadata)
  amount:    number           // in cents
  currency:  'cad'
  recurring?: { interval: 'month' }
  description?: string
}

const PRICES: PriceDef[] = [
  // ── Memberships ──────────────────────────────────────────────────────────
  {
    envVar:      'NEXT_PUBLIC_STRIPE_SUB_REGULAR',
    product:     'Regular Membership',
    productKey:  'membership_regular',
    amount:      1999,
    currency:    'cad',
    recurring:   { interval: 'month' },
    description: 'Community Discord access · 100 $ROAD/mo',
  },
  {
    envVar:      'NEXT_PUBLIC_STRIPE_SUB_RANCH',
    product:     'Ranch Hand Membership',
    productKey:  'membership_ranch',
    amount:      9999,
    currency:    'cad',
    recurring:   { interval: 'month' },
    description: 'Guild access + VOD · 500 $ROAD/mo',
  },
  {
    envVar:      'NEXT_PUBLIC_STRIPE_SUB_PARTNER',
    product:     'Partner Membership',
    productKey:  'membership_partner',
    amount:      19998,
    currency:    'cad',
    recurring:   { interval: 'month' },
    description: 'Leadership + group call · 2,000 $ROAD/mo',
  },

  // ── Merch ────────────────────────────────────────────────────────────────
  {
    envVar:      'NEXT_PUBLIC_STRIPE_PRICE_TEE',
    product:     'RoadHouse Tee',
    productKey:  'merch_tee',
    amount:      3500,
    currency:    'cad',
  },
  {
    envVar:      'NEXT_PUBLIC_STRIPE_PRICE_HAT',
    product:     'RoadHouse Snapback',
    productKey:  'merch_hat',
    amount:      4000,
    currency:    'cad',
  },
  {
    envVar:      'NEXT_PUBLIC_STRIPE_PRICE_HOODIE',
    product:     'Coconut Cowboy Hoodie',
    productKey:  'merch_hoodie',
    amount:      7500,
    currency:    'cad',
  },
  {
    envVar:      'NEXT_PUBLIC_STRIPE_PRICE_STICKERS',
    product:     'Sticker Pack',
    productKey:  'merch_stickers',
    amount:      1200,
    currency:    'cad',
  },
  {
    envVar:      'NEXT_PUBLIC_STRIPE_PRICE_GLASS',
    product:     'Whiskey Glass Set (2)',
    productKey:  'merch_glass',
    amount:      4500,
    currency:    'cad',
  },
  {
    envVar:      'NEXT_PUBLIC_STRIPE_PRICE_PHONE',
    product:     'Phone Case',
    productKey:  'merch_phone',
    amount:      2800,
    currency:    'cad',
  },

  // ── Digital Products ─────────────────────────────────────────────────────
  {
    envVar:      'NEXT_PUBLIC_STRIPE_PRICE_PLAYBOOK',
    product:     'Creator Playbook',
    productKey:  'digital_playbook',
    amount:      12999,
    currency:    'cad',
    description: 'Stream-to-capital framework. PDF + Notion template pack.',
  },
  {
    envVar:      'NEXT_PUBLIC_STRIPE_PRICE_TOOLKIT',
    product:     'Strategy Toolkit',
    productKey:  'digital_toolkit',
    amount:      29599,
    currency:    'cad',
    description: 'Canvases, calculators, scenario tools for creator economy operators.',
  },

  // ── Events ───────────────────────────────────────────────────────────────
  {
    envVar:      'NEXT_PUBLIC_STRIPE_PRICE_SKMT',
    product:     'Saskatchewan Meetup Ticket',
    productKey:  'event_skmt',
    amount:      99900,
    currency:    'cad',
  },
  {
    envVar:      'NEXT_PUBLIC_STRIPE_PRICE_SUMMIT',
    product:     'RoadHouse Summit Ticket',
    productKey:  'event_summit',
    amount:      159900,
    currency:    'cad',
  },
  {
    envVar:      'NEXT_PUBLIC_STRIPE_PRICE_SUMMIT_VIP',
    product:     'RoadHouse Summit VIP Pass',
    productKey:  'event_summit_vip',
    amount:      29900,
    currency:    'cad',
    description: 'VIP access · 25 spots maximum',
  },

  // ── Adventures (deposits) ─────────────────────────────────────────────────
  {
    envVar:      'NEXT_PUBLIC_STRIPE_PRICE_ADV_LAKE',
    product:     'Adventure #001 — Lake Trip Deposit',
    productKey:  'adventure_lake',
    amount:      19900,
    currency:    'cad',
    description: 'BC/AB · Summer 2026 · Full refund 30+ days out',
  },
  {
    envVar:      'NEXT_PUBLIC_STRIPE_PRICE_ADV_SKI',
    product:     'Adventure #002 — Ski Trip Deposit',
    productKey:  'adventure_ski',
    amount:      29900,
    currency:    'cad',
    description: 'Panorama or Whitefish · Winter 2026/27 · Opens after community Snapshot vote',
  },
  {
    envVar:      'NEXT_PUBLIC_STRIPE_PRICE_ADV_MED',
    product:     'Adventure #003 — Mediterranean Hold',
    productKey:  'adventure_med',
    amount:      100000,
    currency:    'cad',
    description: 'Summer 2027 · Ranch Hand+ only · $500 non-refundable within 14 days of event',
  },

  // ── Sponsorships ─────────────────────────────────────────────────────────
  {
    envVar:      'NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_TB',
    product:     'Trail Blazer Sponsorship',
    productKey:  'sponsor_trail_blazer',
    amount:      100000,
    currency:    'cad',
    recurring:   { interval: 'month' },
    description: '~5k reach/mo · Stream overlay + social shoutout + monthly analytics',
  },
  {
    envVar:      'NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_FR',
    product:     'Frontier Sponsorship',
    productKey:  'sponsor_frontier',
    amount:      250000,
    currency:    'cad',
    recurring:   { interval: 'month' },
    description: '~20k reach/mo · 5-min stream segment + TikTok + co-branded event',
  },
  {
    envVar:      'NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_PR',
    product:     'Praetor Sponsorship',
    productKey:  'sponsor_praetor',
    amount:      1000000,
    currency:    'cad',
    recurring:   { interval: 'month' },
    description: '~100k+ reach/mo · IP licensing + Summit presenting sponsor',
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Find an existing active Price by our stable env var metadata key */
async function findExistingPrice(envVar: string): Promise<Stripe.Price | null> {
  const results = await stripe.prices.search({
    query: `metadata['rh_env_var']:'${envVar}'`,
    limit: 5,
  })
  // Return the first active one
  return results.data.find(p => p.active) ?? null
}

/** Upsert a Product by productKey metadata — create if missing, return product ID */
async function upsertProduct(def: PriceDef): Promise<string> {
  const results = await stripe.products.search({
    query: `metadata['rh_product_key']:'${def.productKey}'`,
    limit: 5,
  })
  const existing = results.data.find(p => p.active)
  if (existing) return existing.id

  const product = await stripe.products.create({
    name: def.product,
    ...(def.description ? { description: def.description } : {}),
    metadata: { rh_product_key: def.productKey },
  })
  return product.id
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\nRoadHouse Capital — Stripe Product Setup`)
  console.log(`Account: ${(await stripe.accounts.retrieve()).id}`)
  console.log(`Mode:    ${key!.startsWith('sk_live') ? 'LIVE' : 'TEST'}\n`)
  console.log('─'.repeat(60))

  const results: { envVar: string; priceId: string; status: 'existing' | 'created'; amount: number }[] = []
  let created = 0
  let reused  = 0

  for (const def of PRICES) {
    try {
      // Check for existing
      const existing = await findExistingPrice(def.envVar)

      if (existing) {
        const existingAmount = existing.unit_amount ?? 0
        const amountMatch    = existingAmount === def.amount

        if (!amountMatch) {
          console.warn(
            `  ⚠  ${def.envVar}\n` +
            `     Existing price is $${(existingAmount / 100).toFixed(2)} but spec says $${(def.amount / 100).toFixed(2)}.\n` +
            `     Archive the old price in Stripe dashboard, then re-run to create the new one.\n` +
            `     Using existing: ${existing.id}`
          )
        } else {
          process.stdout.write(`  ✓  ${def.envVar.padEnd(42)} ${existing.id}  (existing)\n`)
        }

        results.push({ envVar: def.envVar, priceId: existing.id, status: 'existing', amount: existingAmount })
        reused++
        continue
      }

      // Create product
      const productId = await upsertProduct(def)

      // Create price
      const price = await stripe.prices.create({
        product:    productId,
        unit_amount: def.amount,
        currency:   def.currency,
        ...(def.recurring ? { recurring: def.recurring } : {}),
        metadata:   { rh_env_var: def.envVar, rh_product_key: def.productKey },
      })

      process.stdout.write(`  ✦  ${def.envVar.padEnd(42)} ${price.id}  (created)\n`)
      results.push({ envVar: def.envVar, priceId: price.id, status: 'created', amount: def.amount })
      created++

    } catch (err: any) {
      console.error(`  ✗  ${def.envVar}: ${err.message}`)
      process.exit(1)
    }
  }

  console.log('─'.repeat(60))
  console.log(`\n${created} created · ${reused} reused · ${PRICES.length} total\n`)

  // ── Output env var block ─────────────────────────────────────────────────
  console.log('─'.repeat(60))
  console.log('Copy these into Vercel → Settings → Environment Variables:\n')

  const sections: Record<string, typeof results> = {}
  for (const r of results) {
    const section = r.envVar.includes('_SUB_')        ? 'Memberships'
                  : r.envVar.includes('_PRICE_TEE')   ||
                    r.envVar.includes('_PRICE_HAT')   ||
                    r.envVar.includes('_PRICE_HOODIE') ||
                    r.envVar.includes('_PRICE_STICKERS') ||
                    r.envVar.includes('_PRICE_GLASS') ||
                    r.envVar.includes('_PRICE_PHONE')  ? 'Merch'
                  : r.envVar.includes('_PRICE_PLAYBOOK') ||
                    r.envVar.includes('_PRICE_TOOLKIT')  ? 'Digital'
                  : r.envVar.includes('_PRICE_SK')    ||
                    r.envVar.includes('_PRICE_SUMMIT') ? 'Events'
                  : r.envVar.includes('_PRICE_ADV_')  ? 'Adventures'
                  : r.envVar.includes('_PRICE_SPONSOR') ? 'Sponsorships'
                  : 'Other'
    if (!sections[section]) sections[section] = []
    sections[section].push(r)
  }

  for (const [section, items] of Object.entries(sections)) {
    console.log(`# ${section}`)
    for (const item of items) {
      console.log(`${item.envVar}=${item.priceId}`)
    }
    console.log()
  }

  // ── Verify count ─────────────────────────────────────────────────────────
  const allGood = results.length === PRICES.length
  console.log(`─`.repeat(60))
  console.log(allGood
    ? `✅  ${results.length}/${PRICES.length} price IDs ready.`
    : `❌  Only ${results.length}/${PRICES.length} completed — check errors above.`
  )
  console.log()
}

run().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
