import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);

/**
 * Route gating — wallet session JWT only (no next-auth / Google OAuth).
 *
 * PUBLIC (no auth needed):
 *   /login, /welcome, /compound, /portal
 *   /api/webhooks/*, /api/discord/*, /api/auth/*
 *   /_next/*, static assets
 *
 * LANDING / (auth required, membership optional):
 *   Session present → allow
 *   No session → /login
 *
 * DASHBOARD /dashboard (auth + active membership required):
 *   Session + isMember → allow
 *   Session + !isMember → / (upgrade prompt)
 *   No session → /login
 *
 * /partners — TokenGate handles this at component level, skip here
 */

const PUBLIC_PATHS = [
  '/login',
  '/welcome',
  '/compound',
  '/portal',
  '/api/webhooks',
  '/api/discord',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

const MEMBER_ONLY_PATHS = ['/dashboard'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static files and public paths — allow immediately
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?)$/)) {
    return NextResponse.next();
  }

  const session = await resolveWalletSession(req);

  // /login — skip to destination if already authenticated
  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL(session.isMember ? '/dashboard' : '/', req.url));
    }
    return NextResponse.next();
  }

  // No session → /login
  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Dashboard requires active membership
  if (MEMBER_ONLY_PATHS.some((p) => pathname.startsWith(p)) && !session.isMember) {
    return NextResponse.redirect(new URL('/?upgrade=1', req.url));
  }

  // Authenticated — pass session info to server components via headers
  const res = NextResponse.next();
  res.headers.set('x-rh-member', session.isMember ? '1' : '0');
  res.headers.set('x-rh-tier',   session.tier ?? '');
  return res;
}

async function resolveWalletSession(req: NextRequest): Promise<{
  isMember: boolean;
  tier:     string | null;
} | null> {
  const cookie = req.cookies.get('rh-wallet-session')?.value;
  if (!cookie) return null;
  try {
    const { payload } = await jwtVerify(cookie, secret);
    return {
      isMember: !!(payload as any).isMember,
      tier:     (payload as any).tier ?? null,
    };
  } catch {
    return null;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
