import type { MetadataRoute } from 'next'
import { getIndexedVins } from '@/lib/motors/storage'
import { SEED_DEALER_ID } from '@/lib/motors/seed'

const BASE = 'https://motors.roadhouse.capital'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let vins: Set<string> = new Set()
  try {
    vins = await getIndexedVins(SEED_DEALER_ID)
  } catch {
    // KV unavailable at build time — sitemap will only include static pages
  }

  const vehicleUrls: MetadataRoute.Sitemap = [...vins].map((vin) => ({
    url: `${BASE}/vehicle/${vin}`,
    lastModified: new Date(),
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
