import type { Vehicle } from '@/types/inventory'

const OBRIANS_BASE = 'https://www.obrians.ca'
const DEALER_ID = 'obrians'
// Webflow CMS subfolder that holds O'Brian's vehicle photos
const VEHICLE_CDN = '620fb02195ca806649283a5d'
const MAX_CONCURRENT = 8
const UA = 'Mozilla/5.0 (compatible; RoadHouseMotorsBot/1.0; +https://motors.roadhouse.capital)'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchPage(url: string): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':      UA,
          'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-CA,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
        },
        cache: 'no-store',
      })
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.text()
    } catch {
      if (attempt === 2) return null
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
  return null
}

function htmlAttr(tag: string, name: string): string {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`, 'i'))
  return m ? m[1].replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&#39;/g, "'") : ''
}

function fuelType(engine: string): string {
  const e = engine.toLowerCase()
  if (e.includes('diesel')) return 'Diesel'
  if (e.includes('hybrid')) return 'Hybrid'
  if (e.includes('electric')) return 'Electric'
  return 'Gasoline'
}

// Run up to `limit` promises concurrently
async function withConcurrency<T>(
  items: string[],
  limit: number,
  fn: (item: string) => Promise<T>
): Promise<T[]> {
  const results: T[] = []
  let idx = 0

  async function worker() {
    while (idx < items.length) {
      const i = idx++
      results[i] = await fn(items[i])
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

// ── Core scraping functions ───────────────────────────────────────────────────

export async function fetchInventorySlugs(): Promise<string[]> {
  const html = await fetchPage(`${OBRIANS_BASE}/inventory`)
  if (!html) return []

  const matches = [...html.matchAll(/class="jetboost-list-item"[^>]*value="([^"]+)"/g)]
  // Deduplicate — the page may render the same item twice in mobile/desktop views
  return [...new Set(matches.map(m => m[1]))]
}

// Extract VIN from slug — VIN is always the last 17 characters
function vinFromSlug(slug: string): string {
  return slug.slice(-17).toUpperCase()
}

export function parseListing(html: string, slug: string): Vehicle | null {
  // The #listing-info div holds all core form attributes
  const infoMatch = html.match(/<div [^>]*id="listing-info"[^>]*>/)
  if (!infoMatch) return null

  const tag = infoMatch[0]

  const vin          = htmlAttr(tag, 'formVin') || vinFromSlug(slug)
  const stockNumber  = htmlAttr(tag, 'formStock')
  const year         = parseInt(htmlAttr(tag, 'formYear'), 10)
  const price        = parseInt(htmlAttr(tag, 'formPrice'), 10)
  const mileage      = parseInt(htmlAttr(tag, 'formMileage'), 10)
  const make         = htmlAttr(tag, 'formMake')
  const model        = htmlAttr(tag, 'formModel')
  const trim         = htmlAttr(tag, 'formTrim')
  const transmission = htmlAttr(tag, 'formTransmission') || 'Automatic'
  const bodyRaw      = htmlAttr(tag, 'formBody')

  // 1000 is O'Brian's sentinel for "contact for price" — skip unpublished pricing
  if (!vin || !year || !price || price === 1000 || !mileage || !make || !model) return null

  // Spec pairs: text-block-8 (label) → text-block-9 (value)
  const specs: Record<string, string> = {}
  for (const [, k, v] of html.matchAll(
    /text-block-8">([^<]+)<\/div><div class="text-block-9">([^<]+)<\/div>/g
  )) {
    specs[k.trim()] = v.trim()
  }

  // Features are injected via JS as a pipe-delimited string
  const featMatch = html.match(/const featureString = "([^"]+)"/)
  const features = featMatch
    ? featMatch[1].split('|').map(f => f.trim()).filter(Boolean)
    : []

  // Vehicle CDN images — Webflow loads the gallery via JS so the static HTML only
  // contains photos that were rendered server-side (varies per listing). Related-vehicle
  // thumbnails from the "similar vehicles" section also bleed in. We group by the first
  // 18 hex chars of each filename (the Webflow upload-batch ID) and take the largest
  // group with ≥ 5 images — a vehicle's own gallery always wins over singletons and
  // small clusters of site-asset variants or related-vehicle thumbnails.
  const allImgs = [
    ...new Set(
      [...html.matchAll(
        new RegExp(`https://cdn\\.prod\\.website-files\\.com/${VEHICLE_CDN}/[^"'\\s]+`, 'g')
      )].map(m => m[0])
    ),
  ]
  const cleanImgs = allImgs.filter(u => !u.toLowerCase().includes('comingsoon'))
  const batchGroups = new Map<string, string[]>()
  for (const url of cleanImgs) {
    const key = (url.split('/').pop() ?? '').split('_')[0].slice(0, 18)
    const group = batchGroups.get(key) ?? []
    group.push(url)
    batchGroups.set(key, group)
  }
  let bestGroup: string[] = []
  for (const group of batchGroups.values()) {
    if (group.length > bestGroup.length) bestGroup = group
  }
  const images = bestGroup.length >= 5 ? bestGroup : []

  const body_style = bodyRaw || specs['Body'] || 'Vehicle'
  const engine     = specs['Engine'] || ''
  const extColor   = specs['Exterior Colour'] || ''
  const intColor   = specs['Interior Colour'] || ''

  return {
    id:             `${DEALER_ID}-${vin}`,
    dealer_id:      DEALER_ID,
    vin,
    stock_number:   stockNumber,
    year,
    make,
    model,
    trim:           trim || specs['Trim'] || '',
    body_style,
    mileage,
    price,
    msrp:           undefined,
    status:         'available',
    images:         images.length ? images : ['/motors/rh-coming-soon.svg'],
    fuel_type:      fuelType(engine),
    transmission,
    exterior_color: extColor,
    interior_color: intColor,
    features,
    description:    undefined,
    updated_at:     new Date().toISOString(),
  }
}

// ── Sync orchestration ────────────────────────────────────────────────────────

export type SyncResult = {
  added: number
  updated: number
  removed: number
  errors: number
  total: number
  duration_ms: number
}

export async function scrapeObriansInventory(
  existingVins: Set<string>
): Promise<{ vehicles: Vehicle[]; removed: string[]; errors: number }> {
  const slugs = await fetchInventorySlugs()
  if (slugs.length === 0) {
    throw new Error('Failed to fetch O\'Brian\'s inventory index — 0 slugs returned')
  }

  const liveVins = new Set(slugs.map(vinFromSlug))

  // VINs currently in KV but no longer on O'Brian's site → mark for removal
  const removed = [...existingVins].filter(v => !liveVins.has(v))

  let errors = 0
  const vehicles: Vehicle[] = []

  const parsed = await withConcurrency(slugs, MAX_CONCURRENT, async (slug) => {
    const html = await fetchPage(`${OBRIANS_BASE}/inventory/${slug}`)
    if (!html) return null
    return parseListing(html, slug)
  })

  for (const v of parsed) {
    if (v) {
      vehicles.push(v)
    } else {
      errors++
    }
  }

  return { vehicles, removed, errors }
}
