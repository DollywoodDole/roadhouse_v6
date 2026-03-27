/**
 * RoadHouse Capital — Manual Discord Role Assignment
 * ───────────────────────────────────────────────────
 * Internal admin endpoint for manually assigning a Discord membership role.
 * Protected by DISCORD_ADMIN_SECRET header.
 *
 * POST /api/discord/assign-role
 * Body: { discordUserId: string, tier: 'regular' | 'ranch-hand' | 'partner' }
 * Header: x-admin-secret: <DISCORD_ADMIN_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { optionalEnv } from '@/lib/env'
import { grantMembershipRole } from '@/lib/discord'
import type { MembershipTier } from '@/lib/membership'

const VALID_TIERS: MembershipTier[] = ['regular', 'ranch-hand', 'partner']

export async function POST(req: NextRequest) {
  // Auth check — basic shared secret
  const adminSecret = optionalEnv('DISCORD_ADMIN_SECRET')
  if (adminSecret) {
    const provided = req.headers.get('x-admin-secret') ?? ''
    if (provided !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: { discordUserId?: string; tier?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { discordUserId, tier } = body

  if (!discordUserId || !tier) {
    return NextResponse.json({ error: 'discordUserId and tier are required' }, { status: 400 })
  }

  if (!VALID_TIERS.includes(tier as MembershipTier)) {
    return NextResponse.json(
      { error: `tier must be one of: ${VALID_TIERS.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    await grantMembershipRole(discordUserId, tier as MembershipTier)
    console.log(JSON.stringify({ evt: 'discord.assign_role.manual', discordUserId, tier }))
    return NextResponse.json({ success: true, discordUserId, tier })
  } catch (err) {
    console.error(JSON.stringify({ evt: 'discord.assign_role.error', error: String(err) }))
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
