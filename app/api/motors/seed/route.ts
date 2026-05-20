import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { message: 'Manual seed deprecated. Use /api/motors/sync to trigger scraper.' },
    { status: 410 }
  )
}

export async function GET() {
  return NextResponse.json(
    { message: 'Manual seed deprecated. Use /api/motors/sync to trigger scraper.' },
    { status: 410 }
  )
}
