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

  const existingVins = await getIndexedVins(DEALER_ID)

  const { vehicles, removed, errors } = await scrapeObriansInventory(existingVins)

  // Upsert all scraped vehicles into KV
  if (vehicles.length > 0) {
    await seedInventory(vehicles)
  }

  // Remove vehicles no longer on O'Brian's site
  await Promise.all(removed.map(vin => removeVehicle(DEALER_ID, vin)))

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

export async function GET() {
  const count = await getInventoryCount(DEALER_ID)
  return NextResponse.json({ dealer_id: DEALER_ID, count })
}
