import { Redis } from '@upstash/redis'
import type { Vehicle, InventoryFilters } from '@/types/inventory'

function getRedis(): Redis {
  const url   = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN not set')
  return new Redis({ url, token })
}

function vehicleKey(dealer_id: string, vin: string): string {
  return `motors:inventory:${dealer_id}:${vin}`
}

function dealerIndexKey(dealer_id: string): string {
  return `motors:index:${dealer_id}`
}

export async function seedInventory(vehicles: Vehicle[]): Promise<void> {
  const redis = getRedis()
  await Promise.all(
    vehicles.map(async (v) => {
      await redis.set(vehicleKey(v.dealer_id, v.vin), v)
      await redis.sadd(dealerIndexKey(v.dealer_id), v.vin)
    })
  )
}

export async function getInventory(
  dealer_id: string,
  filters?: InventoryFilters
): Promise<Vehicle[]> {
  const redis = getRedis()
  const vins = await redis.smembers<string[]>(dealerIndexKey(dealer_id))
  if (!vins || vins.length === 0) return []

  const keys = vins.map((vin) => vehicleKey(dealer_id, vin))
  const records = await redis.mget<(Vehicle | null)[]>(...keys)
  let vehicles = records.filter((v): v is Vehicle => v !== null)

  if (!filters) return vehicles

  if (filters.make) {
    const make = filters.make.toLowerCase()
    vehicles = vehicles.filter((v) => v.make.toLowerCase() === make)
  }
  if (filters.model) {
    const model = filters.model.toLowerCase()
    vehicles = vehicles.filter((v) => v.model.toLowerCase() === model)
  }
  if (filters.year_min !== undefined) {
    vehicles = vehicles.filter((v) => v.year >= filters.year_min!)
  }
  if (filters.year_max !== undefined) {
    vehicles = vehicles.filter((v) => v.year <= filters.year_max!)
  }
  if (filters.price_min !== undefined) {
    vehicles = vehicles.filter((v) => v.price >= filters.price_min!)
  }
  if (filters.price_max !== undefined) {
    vehicles = vehicles.filter((v) => v.price <= filters.price_max!)
  }
  if (filters.status) {
    vehicles = vehicles.filter((v) => v.status === filters.status)
  }

  return vehicles.sort((a, b) => a.price - b.price)
}

export async function getVehicleByVin(
  dealer_id: string,
  vin: string
): Promise<Vehicle | null> {
  return getRedis().get<Vehicle>(vehicleKey(dealer_id, vin))
}

export async function getInventoryCount(dealer_id: string): Promise<number> {
  const redis = getRedis()
  return redis.scard(dealerIndexKey(dealer_id))
}

export async function getIndexedVins(dealer_id: string): Promise<Set<string>> {
  const redis = getRedis()
  const vins = await redis.smembers<string[]>(dealerIndexKey(dealer_id))
  return new Set(vins ?? [])
}

export async function removeVehicle(dealer_id: string, vin: string): Promise<void> {
  const redis = getRedis()
  await Promise.all([
    redis.del(vehicleKey(dealer_id, vin)),
    redis.srem(dealerIndexKey(dealer_id), vin),
  ])
}
