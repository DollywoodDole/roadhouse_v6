import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

/**
 * POST /api/auth/wallet
 *
 * Creates a lightweight JWT session for wallet-authenticated members.
 * Called after wallet connects — looks up wallet:{publicKey} → customerId
 * and issues a session cookie that middleware can verify.
 *
 * This runs in parallel to next-auth, not through it.
 * Both produce the same RoadHouseSession shape consumed by middleware.
 *
 * Body: { publicKey: string }
 * Response: { ok: true, isMember: boolean, tier: string | null }
 *
 * DELETE /api/auth/wallet — clears the wallet session cookie.
 */

const SESSION_COOKIE = 'rh-wallet-session';
const secret         = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);

function getRedis() {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('KV_REST_API_URL / KV_REST_API_TOKEN not set');
  return new Redis({ url, token });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { publicKey } = body as { publicKey?: string };

  if (!publicKey || typeof publicKey !== 'string') {
    return NextResponse.json({ error: 'publicKey required' }, { status: 400 });
  }

  const kv = getRedis();

  // Resolve customerId from wallet reverse index
  const customerId = await kv.get<string>(`wallet:${publicKey}`);
  let isMember = false;
  let tier: string | null = null;

  if (customerId) {
    const balance = await kv.get<{ tier: string; balance: number }>(
      `road:${customerId}`
    );
    isMember = !!balance;
    tier     = balance?.tier ?? null;
  }

  // Issue JWT session cookie (7-day expiry)
  const token = await new SignJWT({
    publicKey,
    customerId: customerId ?? null,
    isMember,
    tier,
    provider:   'wallet',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
    path:     '/',
  });

  return NextResponse.json({ ok: true, isMember, tier });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}

