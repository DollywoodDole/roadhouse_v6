import { NextRequest, NextResponse } from 'next/server'
import { getInventory } from '@/lib/motors/storage'
import { SEED_DEALER_ID } from '@/lib/motors/seed'
import type { Vehicle } from '@/types/inventory'

const BASE = 'https://motors.roadhouse.capital'

function auth(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  return header === `Bearer ${process.env.CRON_SECRET}`
}

// JSON — clean array for internal ops / Google Sheets / custom tools
function toJson(vehicles: Vehicle[]) {
  const data = vehicles.map((v) => ({
    vin: v.vin,
    stock_number: v.stock_number,
    year: v.year,
    make: v.make,
    model: v.model,
    trim: v.trim,
    body_style: v.body_style,
    mileage_km: v.mileage,
    price_cad: v.price,
    msrp_cad: v.msrp ?? null,
    status: v.status,
    fuel_type: v.fuel_type,
    transmission: v.transmission,
    exterior_color: v.exterior_color,
    interior_color: v.interior_color,
    features: v.features,
    description: v.description ?? null,
    images: v.images,
    url: `${BASE}/vehicle/${v.vin}`,
    updated_at: v.updated_at,
  }))

  return NextResponse.json({ count: data.length, vehicles: data })
}

// XML — AAMVA-compatible vehicle catalog (Facebook, Kijiji, AutoTrader)
function toXml(vehicles: Vehicle[]): NextResponse {
  const esc = (s: string | number) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  const availability = (s: Vehicle['status']) =>
    s === 'available' ? 'IN_STOCK' : s === 'pending' ? 'PREORDER' : 'OUT_OF_STOCK'

  const items = vehicles
    .map((v) => {
      const image = v.images[0] ?? ''
      const additionalImages = v.images
        .slice(1, 5)
        .map((img) => `    <additional_image_url>${esc(img)}</additional_image_url>`)
        .join('\n')

      return `  <vehicle>
    <id>${esc(v.vin)}</id>
    <title>${esc(`${v.year} ${v.make} ${v.model} ${v.trim}`)}</title>
    <description>${esc(v.description ?? `${v.year} ${v.make} ${v.model} ${v.trim} — ${new Intl.NumberFormat('en-CA').format(v.mileage)} km, ${v.exterior_color}, ${v.transmission}.`)}</description>
    <url>${esc(`${BASE}/vehicle/${v.vin}`)}</url>
    <image_url>${esc(image)}</image_url>
${additionalImages ? additionalImages + '\n' : ''}    <price>${v.price} CAD</price>
    <availability>${availability(v.status)}</availability>
    <condition>USED</condition>
    <vehicle_type>CAR_TRUCK_VAN</vehicle_type>
    <make>${esc(v.make)}</make>
    <model>${esc(v.model)}</model>
    <year>${v.year}</year>
    <trim>${esc(v.trim)}</trim>
    <mileage>
      <value>${v.mileage}</value>
      <unit>KM</unit>
    </mileage>
    <body_style>${esc(v.body_style)}</body_style>
    <fuel_type>${esc(v.fuel_type)}</fuel_type>
    <transmission>${esc(v.transmission)}</transmission>
    <exterior_color>${esc(v.exterior_color)}</exterior_color>
    <interior_color>${esc(v.interior_color)}</interior_color>
    <vin>${esc(v.vin)}</vin>
    <state_of_vehicle>USED</state_of_vehicle>
    <date_first_on_lot>${esc(v.updated_at)}</date_first_on_lot>
  </vehicle>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<inventory>
  <dealer>
    <name>RoadHouse Motors</name>
    <url>${BASE}</url>
    <phone>+13063818222</phone>
    <licence>DL331386</licence>
    <address>
      <region>Saskatchewan</region>
      <country>CA</country>
    </address>
  </dealer>
  <vehicles count="${vehicles.length}">
${items}
  </vehicles>
</inventory>`

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}

export async function GET(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const format = req.nextUrl.searchParams.get('format') ?? 'json'
  const statusParam = req.nextUrl.searchParams.get('status')

  const filters = statusParam ? { status: statusParam as Vehicle['status'] } : {}
  const vehicles = await getInventory(SEED_DEALER_ID, filters)

  if (format === 'xml') return toXml(vehicles)
  return toJson(vehicles)
}
