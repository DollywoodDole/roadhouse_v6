import { NextResponse } from 'next/server'
import { seedInventory, getInventoryCount } from '@/lib/motors/storage'
import { SEED_VEHICLES, SEED_DEALER_ID } from '@/lib/motors/seed'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await seedInventory(SEED_VEHICLES)

  return NextResponse.json({
    ok: true,
    dealer_id: SEED_DEALER_ID,
    seeded: SEED_VEHICLES.length,
  })
}

export async function GET() {
  const count = await getInventoryCount(SEED_DEALER_ID)
  return NextResponse.json({ dealer_id: SEED_DEALER_ID, count })
}
