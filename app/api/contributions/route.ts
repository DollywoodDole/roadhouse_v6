import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { addContribution } from '@/lib/road-balance';

/**
 * POST /api/contributions
 *
 * Accepts a protocol submission from the Protocol tab.
 * Writes to contributions[] on the member's KV record.
 * Does not auto-award $ROAD — that happens on Steward verification (M3).
 * Records the submission type and multiplier for when verification runs.
 */

function getRedis() {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN not set');
  return new Redis({ url, token });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const { type, data, multiplier, guild, walletAddress, customerId } = body as {
    type:          string;
    data:          Record<string, string>;
    multiplier?:   string;
    guild?:        string;
    walletAddress?: string;
    customerId?:   string;
  };

  if (!type || !data) {
    return NextResponse.json({ error: 'type and data required' }, { status: 400 });
  }

  // Resolve customerId from wallet session header or body
  let resolvedCustomerId = customerId ?? null;

  if (!resolvedCustomerId && walletAddress) {
    const kv = getRedis();
    resolvedCustomerId = await kv.get<string>(`wallet:${walletAddress}`);
  }

  if (!resolvedCustomerId) {
    return NextResponse.json(
      { error: 'Could not resolve member — connect wallet or sign in' },
      { status: 401 }
    );
  }

  // Map protocol submission to the existing contribution shape.
  // roadEarned = 0 until Steward verification in M3 (verified: false).
  const contribution = {
    id:         `${type}-${Date.now()}`,
    date:       new Date().toISOString().split('T')[0],
    label:      `${type} — ${guild ?? 'general'} (${multiplier ?? 'daily_checkin'})`,
    roadEarned: 0,       // awarded at Steward verification, M3
    guildId:    guild ?? null,
    verified:   false,
  };

  await addContribution(resolvedCustomerId, contribution);

  return NextResponse.json({ ok: true, id: contribution.id, status: 'pending' });
}
