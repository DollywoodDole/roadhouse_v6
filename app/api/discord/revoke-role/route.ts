/**
 * RoadHouse Capital — Manual Discord Role Revocation
 * ───────────────────────────────────────────────────
 * Internal admin endpoint for manually revoking Discord membership roles.
 * Protected by DISCORD_ADMIN_SECRET header.
 *
 * POST /api/discord/revoke-role
 * Body: { discordUserId: string, tier?: 'regular' | 'ranch-hand' | 'partner' }
 *       Omit tier to revoke ALL membership roles.
 * Header: x-admin-secret: <DISCORD_ADMIN_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { optionalEnv } from '@/lib/env'
import { revokeMembershipRole, revokeAllMembershipRoles } from '@/lib/discord'
import type { MembershipTier } from '@/lib/membership'

const VALID_TIERS: MembershipTier[] = ['regular', 'ranch-hand', 'partner']

export async function POST(req: NextRequest) {
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

  if (!discordUserId) {
    return NextResponse.json({ error: 'discordUserId is required' }, { status: 400 })
  }

  if (tier && !VALID_TIERS.includes(tier as MembershipTier)) {
    return NextResponse.json(
      { error: `tier must be one of: ${VALID_TIERS.join(', ')} (or omit to revoke all)` },
      { status: 400 }
    )
  }

  try {
    if (tier) {
      await revokeMembershipRole(discordUserId, tier as MembershipTier)
      console.log(JSON.stringify({ evt: 'discord.revoke_role.manual', discordUserId, tier }))
    } else {
      await revokeAllMembershipRoles(discordUserId)
      console.log(JSON.stringify({ evt: 'discord.revoke_role.all_manual', discordUserId }))
    }
    return NextResponse.json({ success: true, discordUserId, tier: tier ?? 'all' })
  } catch (err) {
    console.error(JSON.stringify({ evt: 'discord.revoke_role.error', error: String(err) }))
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
