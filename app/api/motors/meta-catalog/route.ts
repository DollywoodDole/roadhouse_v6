import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual, createHash } from 'crypto'
import { getInventory, DEALER_ID } from '@/lib/motors/storage'
import type { Vehicle } from '@/types/inventory'

const BASE = 'https://motors.roadhouse.capital'

const DEALER = {
  name:        'RoadHouse Motors',
  addr1:       '815 Circle Dr E',
  city:        'Saskatoon',
  region:      'SK',
  postal_code: 'S7K 3S4',
  country:     'CA',
}

// Hash both sides to equal length, then constant-time compare
function tokenValid(provided: string | null): boolean {
  const expected = process.env.MOTORS_FEED_TOKEN?.trim()
  if (!expected || !provided) return false
  try {
    const a = createHash('sha256').update(provided).digest()
    const b = createHash('sha256').update(expected).digest()
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

// RFC 4180: quote any field that contains a comma, double-quote, CR, or LF.
// Escape embedded double-quotes by doubling them.
function field(value: string | number): string {
  const s = String(value ?? '')
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const HEADER =
  'vehicle_id,title,description,url,' +
  'image[0].url,image[1].url,image[2].url,image[3].url,image[4].url,' +
  'make,model,year,trim,mileage.value,mileage.unit,price,' +
  'state_of_vehicle,exterior_color,transmission,body_style,vin,condition,availability,' +
  'address.addr1,address.city,address.region,address.postal_code,address.country,dealer_name'

function toRow(v: Vehicle): string {
  const title = `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ''}`
  const description =
    v.description ??
    `${title} — ${new Intl.NumberFormat('en-CA').format(v.mileage)} km, ${v.exterior_color}, ${v.transmission}.`

  const imgs = v.images.slice(0, 5)
  const imgCols = Array.from({ length: 5 }, (_, i) => field(imgs[i] ?? ''))

  return [
    field(v.vin),                     // vehicle_id — must match pixel content_ids
    field(title),
    field(description),
    field(`${BASE}/vehicle/${v.vin}`),
    ...imgCols,
    field(v.make),
    field(v.model),
    field(v.year),
    field(v.trim),
    field(v.mileage),                 // mileage.value
    field('KM'),                      // mileage.unit
    field(`${v.price} CAD`),          // price
    field('USED'),                    // state_of_vehicle
    field(v.exterior_color),
    field(v.transmission),
    field(v.body_style),
    field(v.vin),                     // vin (required alongside vehicle_id per Meta spec)
    field('GOOD'),                    // condition — no per-vehicle rating in Vehicle schema
    field('IN_STOCK'),                // availability
    field(DEALER.addr1),
    field(DEALER.city),
    field(DEALER.region),
    field(DEALER.postal_code),
    field(DEALER.country),
    field(DEALER.name),
  ].join(',')
}

// GET /api/motors/meta-catalog?token={MOTORS_FEED_TOKEN}
// Meta Automotive Inventory Ads vehicle feed — RFC 4180 CSV, CRLF line endings.
// Query-token auth: Meta cannot send Authorization headers against a catalog URL.
// Cache-Control: no-store — Meta fetches daily; always serve live inventory.
export async function GET(req: NextRequest) {
  if (!tokenValid(req.nextUrl.searchParams.get('token'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const all = await getInventory(DEALER_ID)

  // In-stock only: price must be real, at least one photo required
  const vehicles = all.filter(
    (v) => v.status === 'available' && v.price > 0 && v.images.length > 0
  )

  const csv = [HEADER, ...vehicles.map(toRow)].join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type':  'text/csv; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
