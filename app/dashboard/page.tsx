'use client'

/**
 * RoadHouse Capital — Member Dashboard Route
 * ────────────────────────────────────────────
 * Route: /dashboard
 *
 * Client boundary — required for wallet adapter hook context to propagate.
 * Note: metadata export below is documentation only; Next.js ignores metadata
 * from client components. Title/robots are not actively served from this file.
 * Grain overlay inherited from body.grain in app/layout.tsx.
 */

import RoadHouseDashboard from '@/components/dashboard/RoadHouseDashboard'

export default function DashboardPage() {
  return <RoadHouseDashboard />
}
