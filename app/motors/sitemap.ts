import type { MetadataRoute } from 'next'
import { getInventory, DEALER_ID } from '@/lib/motors/storage'

const BASE = 'https://motors.roadhouse.capital'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let vehicles: { vin: string; make: string; status: string; updated_at: string }[] = []
  try {
    vehicles = await getInventory(DEALER_ID)
  } catch {
    // KV unavailable at build time — sitemap will only include static pages
  }

  const vehicleUrls: MetadataRoute.Sitemap = vehicles.map((v) => ({
    url: `${BASE}/vehicle/${v.vin}`,
    lastModified: new Date(v.updated_at),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  // One sitemap entry per make with available inventory — unique metadata, indexable as distinct pages
  const makeCounts = new Map<string, number>()
  vehicles.forEach((v) => {
    if (v.status !== 'sold') makeCounts.set(v.make, (makeCounts.get(v.make) ?? 0) + 1)
  })
  const makeUrls: MetadataRoute.Sitemap = Array.from(makeCounts.entries())
    .filter(([, count]) => count > 0)
    .map(([make]) => ({
      url: `${BASE}/inventory?make=${encodeURIComponent(make)}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.75,
    }))

  return [
    {
      url: `${BASE}/inventory`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE}/credit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...makeUrls,
    ...vehicleUrls,
  ]
}
