import { NextResponse } from 'next/server'
import { seedInventory, getIndexedVins, removeVehicle, getInventoryCount, getVehiclesByVins } from '@/lib/motors/storage'
import { scrapeObriansInventory } from '@/lib/motors/scraper'
import { mergeVehicleHistory } from '@/lib/motors/diff'

const DEALER_ID    = 'obrians'
const ALERT_EMAIL  = 'roadhousesyndicate@gmail.com'
const RESEND_API   = 'https://api.resend.com/emails'

export const maxDuration = 300

async function sendSyncAlert(payload: {
  errors:  number
  added:   number
  removed: number
  total:   number
  reason:  string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from   = process.env.RESEND_FROM_EMAIL ?? 'hello@roadhouse.capital'
  if (!apiKey) return

  const text = [
    'MOTORS SYNC DEGRADED',
    '',
    `Reason:  ${payload.reason}`,
    `Errors:  ${payload.errors}`,
    `Added:   ${payload.added}`,
    `Removed: ${payload.removed}`,
    `Total:   ${payload.total}`,
    '',
    'Manual review required — check obrians.ca page structure.',
  ].join('\n')

  await fetch(RESEND_API, {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    `RoadHouse Motors <${from}>`,
      to:      [ALERT_EMAIL],
      subject: 'MOTORS SYNC DEGRADED',
      text,
    }),
  }).catch(e => console.error('[motors/sync] alert email failed:', e))
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET?.trim()}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()

  let existingVins: Set<string>
  let vehicles: Awaited<ReturnType<typeof scrapeObriansInventory>>['vehicles']
  let removed:  string[]
  let scrapeErrors: number

  try {
    existingVins = await getIndexedVins(DEALER_ID)
    ;({ vehicles, removed, errors: scrapeErrors } = await scrapeObriansInventory(existingVins))
  } catch (err) {
    console.error(JSON.stringify({ evt: 'motors.sync.scraper_fatal', dealer: DEALER_ID, error: String(err) }))
    return NextResponse.json({ ok: false, error: 'Scraper threw — inventory unchanged', detail: String(err) }, { status: 500 })
  }

  if (vehicles.length === 0 && existingVins.size > 0) {
    console.error(JSON.stringify({ evt: 'motors.sync.zero_vehicles', dealer: DEALER_ID, existing: existingVins.size }))
    return NextResponse.json({ ok: false, error: 'Scraper returned 0 vehicles — inventory unchanged to prevent data loss', existing: existingVins.size }, { status: 500 })
  }

  let kvRejected = 0
  if (vehicles.length > 0) {
    const existingMap = await getVehiclesByVins(DEALER_ID, vehicles.map((v) => v.vin))
    const merged = vehicles.map((v) => mergeVehicleHistory(v, existingMap.get(v.vin) ?? null))
    const result = await seedInventory(merged)
    kvRejected = result.rejected
  }

  const parsedVins = new Set(vehicles.map(v => v.vin))
  const staleVins  = [...existingVins].filter(v => !parsedVins.has(v))
  await Promise.all([
    ...removed.map(vin => removeVehicle(DEALER_ID, vin)),
    ...staleVins.filter(v => !removed.includes(v)).map(vin => removeVehicle(DEALER_ID, vin)),
  ])

  const added      = vehicles.filter(v => !existingVins.has(v.vin)).length
  const updated    = vehicles.filter(v =>  existingVins.has(v.vin)).length
  const totalErrors = scrapeErrors + kvRejected

  // Tripwire: alert if error count is high or inventory dropped more than 20%
  const inventoryDrop = existingVins.size > 0 && vehicles.length < 0.8 * existingVins.size
  if (totalErrors > 5 || inventoryDrop) {
    const reason = inventoryDrop
      ? `Inventory dropped from ${existingVins.size} → ${vehicles.length} (>${Math.round((1 - vehicles.length / existingVins.size) * 100)}% loss)`
      : `High error count: ${totalErrors}`
    await sendSyncAlert({ errors: totalErrors, added, removed: removed.length, total: vehicles.length, reason })
  }

  return NextResponse.json({
    ok:          true,
    dealer_id:   DEALER_ID,
    added,
    updated,
    removed:     removed.length,
    errors:      totalErrors,
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
