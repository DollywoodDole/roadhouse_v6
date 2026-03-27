/**
 * RoadHouse Capital — DeSci Experiment Tracking
 * ───────────────────────────────────────────────
 * Stores active experiment protocol + member daily logs in Upstash Redis.
 * Uses the same Redis client pattern as lib/api/listings.ts.
 *
 * KV key schema:
 *   experiment:active          → ExperimentEntry JSON (current protocol)
 *   experiment:log:{publicKey} → DailyEntry[] (member submissions, max 30)
 *   experiment:aggregate       → AggregateStats JSON
 */

import { Redis } from '@upstash/redis'
import { randomUUID } from 'crypto'

export type ExperimentEntry = {
  id:           string
  title:        string
  description:  string
  weekCurrent:  number
  weekTotal:    number
  participants: number
}

export type DailyEntry = {
  id:          string
  publicKey:   string
  date:        string
  bedtime:     string
  waketime:    string
  energyScore: number
  createdAt:   string
}

export type AggregateStats = {
  avgEnergyScore: number
  avgSleepHours:  number
  totalEntries:   number
  updatedAt:      string
}

// ── Seed data — mirrors DeSciTab hardcoded values ──────────────────────────

const SEED_EXPERIMENT: ExperimentEntry = {
  id:           'seed-exp-1',
  title:        'Sleep Optimisation Sprint',
  description:  '10pm–6am protocol. Track bedtime, wake time, energy.',
  weekCurrent:  2,
  weekTotal:    4,
  participants: 23,
}

const DEFAULT_AGGREGATE: AggregateStats = {
  avgEnergyScore: 7.2,
  avgSleepHours:  7.8,
  totalEntries:   23,
  updatedAt:      new Date().toISOString(),
}

// ── Redis client (lazy — same pattern as lib/api/listings.ts) ─────────────

function getRedis(): Redis {
  const url   = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN not set')
  return new Redis({ url, token })
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Returns the current active experiment protocol.
 * Seeds KV with hardcoded values from DeSciTab on first call if key is missing.
 * TODO M3: admin route to set new active experiment
 */
export async function getActiveExperiment(): Promise<ExperimentEntry> {
  const redis = getRedis()
  const existing = await redis.get<ExperimentEntry>('experiment:active')
  if (existing) return existing
  await redis.set('experiment:active', SEED_EXPERIMENT)
  return SEED_EXPERIMENT
}

/**
 * Submits a daily entry for a member.
 * Throws 'Already submitted today' if an entry for today already exists.
 * Prepends to member log, caps at 30 days.
 * Best-effort aggregate update — entry is still saved if aggregate calc fails.
 */
export async function submitDailyEntry(
  publicKey: string,
  entry: Omit<DailyEntry, 'id' | 'publicKey' | 'createdAt'>,
): Promise<void> {
  const daily: DailyEntry = {
    ...entry,
    id:        randomUUID(),
    publicKey,
    createdAt: new Date().toISOString(),
  }

  const redis    = getRedis()
  const logKey   = `experiment:log:${publicKey}`
  const existing = await redis.get<DailyEntry[]>(logKey) ?? []

  if (existing.some(e => e.date === entry.date)) {
    throw new Error('Already submitted today')
  }

  const updated = [daily, ...existing].slice(0, 30)
  await redis.set(logKey, updated)

  // Best-effort aggregate update
  // TODO M3: cross-member aggregate via proper query
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const recentEntries = updated.filter(e => e.date >= sevenDaysAgo)

    const avgEnergy = recentEntries.length
      ? recentEntries.reduce((sum, e) => sum + e.energyScore, 0) / recentEntries.length
      : DEFAULT_AGGREGATE.avgEnergyScore

    // Parse sleep hours from bedtime + waketime strings (HH:MM format)
    const sleepHoursList = recentEntries
      .filter(e => e.bedtime && e.waketime)
      .map(e => {
        const [bh, bm] = e.bedtime.split(':').map(Number)
        const [wh, wm] = e.waketime.split(':').map(Number)
        // Assume bedtime is PM (after noon), waketime is AM (before noon)
        const bedMinutes  = bh * 60 + bm
        const wakeMinutes = wh * 60 + wm
        // If waketime is "earlier" in the day numerically, it crossed midnight
        const sleepMinutes = wakeMinutes < bedMinutes
          ? (24 * 60 - bedMinutes) + wakeMinutes
          : wakeMinutes - bedMinutes
        return sleepMinutes / 60
      })
      .filter(h => h > 0 && h < 24)

    const avgSleep = sleepHoursList.length
      ? sleepHoursList.reduce((a, b) => a + b, 0) / sleepHoursList.length
      : DEFAULT_AGGREGATE.avgSleepHours

    const current = await redis.get<AggregateStats>('experiment:aggregate')
    const aggregate: AggregateStats = {
      avgEnergyScore: Math.round(avgEnergy * 10) / 10,
      avgSleepHours:  Math.round(avgSleep  * 10) / 10,
      totalEntries:   (current?.totalEntries ?? DEFAULT_AGGREGATE.totalEntries) + 1,
      updatedAt:      new Date().toISOString(),
    }
    await redis.set('experiment:aggregate', aggregate)
  } catch {
    // Aggregate update failed — entry already saved, swallow error
  }
}

/**
 * Returns aggregate stats across all member logs.
 * Returns seeded defaults if key is missing.
 * TODO M3: real-time aggregate from all member logs
 */
export async function getAggregateStats(): Promise<AggregateStats> {
  const redis = getRedis()
  const existing = await redis.get<AggregateStats>('experiment:aggregate')
  if (existing) return existing
  return { ...DEFAULT_AGGREGATE, updatedAt: new Date().toISOString() }
}
