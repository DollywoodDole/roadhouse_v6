import { Redis } from '@upstash/redis'

function getRedis(): Redis {
  const url   = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN not set')
  return new Redis({ url, token })
}

/**
 * Shared 60-second per-phone rate limit for all motors lead endpoints.
 * Returns true if the request may proceed; false if rate-limited.
 * Never throws — KV failure is non-blocking (allows the request through).
 */
export async function checkPhoneRateLimit(cleanPhone: string): Promise<boolean> {
  try {
    const redis = getRedis()
    const key   = `motors:ratelimit:phone:${cleanPhone}`
    const hit   = await redis.get(key)
    if (hit) return false
    await redis.set(key, '1', { ex: 60 })
    return true
  } catch {
    return true
  }
}
