import { NextResponse } from 'next/server'
import { seedInventory, getIndexedVins, removeVehicle, getInventoryCount } from '@/lib/motors/storage'
import { scrapeObriansInventory } from '@/lib/motors/scraper'

const DEALER_ID = 'obrians'

export const maxDuration = 300

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET?.trim()}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()

  let existingVins: Set<string>
  let vehicles: Awaited<ReturnType<typeof scrapeObriansInventory>>['vehicles']
  let removed:  string[]
  let errors:   unknown[]

  try {
    existingVins = await getIndexedVins(DEALER_ID)
    ;({ vehicles, removed, errors } = await scrapeObriansInventory(existingVins))
  } catch (err) {
    console.error(JSON.stringify({ evt: 'motors.sync.scraper_fatal', dealer: DEALER_ID, error: String(err) }))
    return NextResponse.json({ ok: false, error: 'Scraper threw — inventory unchanged', detail: String(err) }, { status: 500 })
  }

  // Guard against silent scraper failure wiping the whole inventory
  if (vehicles.length === 0 && existingVins.size > 0) {
    console.error(JSON.stringify({ evt: 'motors.sync.zero_vehicles', dealer: DEALER_ID, existing: existingVins.size }))
    return NextResponse.json({ ok: false, error: 'Scraper returned 0 vehicles — inventory unchanged to prevent data loss', existing: existingVins.size }, { status: 500 })
  }

  // Upsert all successfully scraped vehicles
  if (vehicles.length > 0) {
    await seedInventory(vehicles)
  }

  // Remove vehicles that are either:
  // a) no longer on O'Brian's site (sold), or
  // b) still listed but failed to parse (became contact-for-price, etc.)
  const parsedVins = new Set(vehicles.map(v => v.vin))
  const staleVins  = [...existingVins].filter(v => !parsedVins.has(v))
  await Promise.all([
    ...removed.map(vin => removeVehicle(DEALER_ID, vin)),
    ...staleVins.filter(v => !removed.includes(v)).map(vin => removeVehicle(DEALER_ID, vin)),
  ])

  const added   = vehicles.filter(v => !existingVins.has(v.vin)).length
  const updated = vehicles.filter(v =>  existingVins.has(v.vin)).length

  return NextResponse.json({
    ok:          true,
    dealer_id:   DEALER_ID,
    added,
    updated,
    removed:     removed.length,
    errors,
    total:       vehicles.length,
    duration_ms: Date.now() - start,
  })
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET?.trim()}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const count = await getInventoryCount(DEALER_ID)
  return NextResponse.json({ dealer_id: DEALER_ID, count })
}
