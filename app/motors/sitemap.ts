import type { MetadataRoute } from 'next'
import { getInventory } from '@/lib/motors/storage'
import { SEED_DEALER_ID } from '@/lib/motors/seed'

const BASE = 'https://motors.roadhouse.capital'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let vehicles: { vin: string; updated_at: string }[] = []
  try {
    vehicles = await getInventory(SEED_DEALER_ID)
  } catch {
    // KV unavailable at build time — sitemap will only include static pages
  }

  const vehicleUrls: MetadataRoute.Sitemap = vehicles.map((v) => ({
    url: `${BASE}/vehicle/${v.vin}`,
    lastModified: new Date(v.updated_at),
    changeFrequency: 'daily',
    priority: 0.8,
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
    ...vehicleUrls,
  ]
}
