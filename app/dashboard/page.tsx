import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import RoadHouseDashboard from '@/components/dashboard/RoadHouseDashboard';

/**
 * RoadHouse Capital — Member Dashboard Route
 * ────────────────────────────────────────────
 * Route: /dashboard
 *
 * Server component: uses middleware-injected x-rh-member header to gate access.
 * Middleware already redirects unauthenticated users to /login before this runs —
 * this guard is a belt-and-suspenders check for the non-member case.
 *
 * Client boundary lives in RoadHouseDashboard.jsx ('use client').
 * Grain overlay inherited from body.grain in app/layout.tsx.
 */

export default async function DashboardPage() {
  const headersList = await headers();
  const isMember    = headersList.get('x-rh-member') === '1';

  if (!isMember) {
    redirect('/?upgrade=1');
  }

  return <RoadHouseDashboard />;
}
