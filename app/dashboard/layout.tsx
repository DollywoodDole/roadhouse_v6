import type { Metadata } from 'next'

/**
 * Dashboard layout — server component.
 * Exports metadata here because page.tsx is 'use client'
 * and Next.js ignores metadata exports from client components.
 * noindex: dashboard is member-gated, must not appear in search results.
 */

export const metadata: Metadata = {
  title: 'Member Dashboard — RoadHouse',
  robots: { index: false, follow: false },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
