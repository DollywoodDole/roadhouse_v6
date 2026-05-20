import { NextResponse } from 'next/server'

export function GET() {
  return new NextResponse(
    'User-agent: *\nAllow: /\n\nSitemap: https://motors.roadhouse.capital/motors/sitemap.xml\n',
    { headers: { 'Content-Type': 'text/plain' } }
  )
}
