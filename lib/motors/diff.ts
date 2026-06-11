import type { Vehicle } from '@/types/inventory'

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000

export function mergeVehicleHistory(
  incoming: Vehicle,
  existing: Vehicle | null,
): Vehicle {
  const now = new Date().toISOString()

  if (!existing) {
    return { ...incoming, firstSeenAt: now }
  }

  // Existing vehicles without firstSeenAt are pre-feature — backdate past the
  // 7-day Just Arrived window so they don't all badge on first migration sync.
  const firstSeenAt = existing.firstSeenAt
    ?? new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  const priceDrop =
    incoming.price > 0 && existing.price > 0 && incoming.price < existing.price

  if (priceDrop) {
    return {
      ...incoming,
      firstSeenAt,
      previousPrice: existing.price,
      priceDroppedAt: now,
    }
  }

  if (existing.priceDroppedAt) {
    const dropAge = Date.now() - new Date(existing.priceDroppedAt).getTime()
    if (dropAge <= FOURTEEN_DAYS_MS) {
      return {
        ...incoming,
        firstSeenAt,
        previousPrice: existing.previousPrice,
        priceDroppedAt: existing.priceDroppedAt,
      }
    }
  }

  return { ...incoming, firstSeenAt }
}
