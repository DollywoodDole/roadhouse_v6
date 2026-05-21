import { NextRequest, NextResponse } from 'next/server'
import { getInventory, DEALER_ID } from '@/lib/motors/storage'
import type { Vehicle } from '@/types/inventory'

const BASE = 'https://motors.roadhouse.capital'

// FB Vehicles Catalog supports up to 20 images per listing
const IMAGE_COLS = 20

function auth(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  return header === `Bearer ${process.env.CRON_SECRET?.trim()}`
}

// ── FB enum mappers ────────────────────────────────────────────────────────────
// Body style values scraped from obrians.ca and stored in KV:
// SUV, Pickup Truck, Sedan, ATV, Side-by-side, Minivan/Van, Hatchback, Other body, Coupe

function mapBodyStyle(raw: string): string {
  const r = raw.toLowerCase()
  if (r === 'suv') return 'SUV'
  if (r.includes('pickup') || r.includes('truck')) return 'PICKUP'
  if (r === 'sedan') return 'SEDAN'
  if (r === 'coupe') return 'COUPE'
  if (r === 'hatchback') return 'HATCHBACK'
  if (r.includes('minivan') || r.includes('van')) return 'MINIVAN'
  // ATV, Side-by-side, Other body — no FB Vehicles Catalog equivalent
  return 'OTHER'
}

function mapFuelType(raw: string): string {
  const r = raw.toLowerCase()
  if (r.includes('diesel')) return 'DIESEL'
  if (r.includes('plug') && r.includes('hybrid')) return 'PLUGIN_HYBRID'
  if (r.includes('electric')) return 'ELECTRIC'
  if (r.includes('hybrid')) return 'HYBRID'
  return 'GASOLINE'
}

function mapTransmission(raw: string): string {
  const r = raw.toLowerCase()
  if (r.includes('manual')) return 'MANUAL'
  if (r.includes('cvt')) return 'SEMI_AUTOMATIC'
  return 'AUTOMATIC'
}

function mapAvailability(status: Vehicle['status']): string {
  if (status === 'available') return 'IN_STOCK'
  if (status === 'pending') return 'PENDING'
  return 'OUT_OF_STOCK'
}

// ── CSV helpers ────────────────────────────────────────────────────────────────

/** RFC 4180 cell escaping */
function cell(val: string | number | undefined | null): string {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/** Auto-generate a listing description from scraped fields */
function buildDescription(v: Vehicle): string {
  const km = new Intl.NumberFormat('en-CA').format(v.mileage)
  const parts: string[] = [
    `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ''}`,
    `${km} km`,
  ]
  if (v.exterior_color) parts.push(v.exterior_color)
  if (v.transmission) parts.push(v.transmission)
  if (v.fuel_type && v.fuel_type !== 'Gasoline') parts.push(v.fuel_type)

  // Up to 3 features for search richness — strip pipe chars that break FB's parser
  const feats = (v.features ?? [])
    .slice(0, 3)
    .map((f) => f.replace(/\|/g, ' '))
    .filter(Boolean)
  if (feats.length) parts.push(feats.join('. '))

  parts.push('Saskatchewan delivery available. DL#331386.')
  return parts.join('. ')
}

// ── CSV builder ────────────────────────────────────────────────────────────────

function toCatalogCsv(vehicles: Vehicle[]): NextResponse {
  // Dealer address fields — set in Vercel env vars
  // DEALER_ADDR1, DEALER_CITY, DEALER_POSTAL, DEALER_LAT, DEALER_LNG must be
  // configured for FB Marketplace geo-targeting to work correctly
  const dealerName   = process.env.DEALER_NAME   ?? 'RoadHouse Motors'
  const dealerPhone  = process.env.DEALER_PHONE  ?? '+13063818222'
  const dealerAddr1  = process.env.DEALER_ADDR1  ?? ''
  const dealerCity   = process.env.DEALER_CITY   ?? ''
  const dealerPostal = process.env.DEALER_POSTAL ?? ''
  const dealerLat    = process.env.DEALER_LAT    ?? ''
  const dealerLng    = process.env.DEALER_LNG    ?? ''

  const imageHeaders = Array.from({ length: IMAGE_COLS }, (_, i) => `image[${i}].url`)

  const headers = [
    'vehicle_id', 'vin', 'title', 'description', 'url',
    'make', 'model', 'year', 'trim', 'body_style',
    'fuel_type', 'transmission', 'drivetrain', 'state_of_vehicle',
    'exterior_color', 'interior_color',
    'mileage.value', 'mileage.unit',
    'price', 'availability', 'condition',
    ...imageHeaders,
    'dealer_name', 'dealer_phone',
    'address.addr1', 'address.city', 'address.region', 'address.country', 'address.postal_code',
    'latitude', 'longitude',
  ]

  const rows = vehicles.map((v) => {
    // Only include real CDN images — skip the local placeholder SVG
    const images = v.images.filter((img) => img.startsWith('http'))
    const imageCols = Array.from({ length: IMAGE_COLS }, (_, i) => images[i] ?? '')

    return [
      v.vin,                                              // vehicle_id
      v.vin,                                              // vin
      `${v.year} ${v.make} ${v.model} ${v.trim}`.trim(), // title
      buildDescription(v),                                // description
      `${BASE}/vehicle/${v.vin}`,                         // url
      v.make,                                             // make
      v.model,                                            // model
      v.year,                                             // year
      v.trim,                                             // trim
      mapBodyStyle(v.body_style),                         // body_style
      mapFuelType(v.fuel_type),                           // fuel_type
      mapTransmission(v.transmission),                    // transmission
      '',                                                 // drivetrain — not scraped from obrians.ca
      'USED',                                             // state_of_vehicle
      v.exterior_color,                                   // exterior_color
      v.interior_color,                                   // interior_color
      v.mileage,                                          // mileage.value
      'KM',                                               // mileage.unit
      `${v.price}.00 CAD`,                                // price — FB format: "28999.00 CAD"
      mapAvailability(v.status),                          // availability
      'GOOD',                                             // condition — not scraped; default GOOD
      ...imageCols,                                       // image[0].url … image[19].url
      dealerName,                                         // dealer_name
      dealerPhone,                                        // dealer_phone
      dealerAddr1,                                        // address.addr1
      dealerCity,                                         // address.city
      'SK',                                               // address.region
      'CA',                                               // address.country
      dealerPostal,                                       // address.postal_code
      dealerLat,                                          // latitude
      dealerLng,                                          // longitude
    ].map(cell)
  })

  const lines = [headers.join(','), ...rows.map((r) => r.join(','))]
  // RFC 4180 requires CRLF; FB's feed parser is strict about line endings
  const csv = lines.join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="roadhouse-motors-catalog.csv"',
      'Cache-Control':       'no-store',
    },
  })
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Default to available-only — FB Marketplace must not surface sold vehicles
  const statusParam = req.nextUrl.searchParams.get('status')
  const filters = statusParam
    ? { status: statusParam as Vehicle['status'] }
    : { status: 'available' as Vehicle['status'] }

  const vehicles = await getInventory(DEALER_ID, filters)
  return toCatalogCsv(vehicles)
}
