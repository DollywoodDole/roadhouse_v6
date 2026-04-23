import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);

/**
 * Route gating — wallet session JWT only (no next-auth / Google OAuth).
 *
 * FULLY_PUBLIC: No session resolution at all. Fast path.
 *   These routes never need to know who the user is.
 *
 * SESSION_OPTIONAL: Resolve session if present, set x-rh-member/x-rh-tier
 *   headers, but never redirect. Publicly accessible — benefits from knowing
 *   who the user is (e.g. upgrade banner on /, TokenGate on /partners).
 *
 * Authenticated (all other routes): session required → /login if missing.
 *   /dashboard: additionally requires isMember → /?upgrade=1 if not.
 */

const FULLY_PUBLIC = [
  '/login',
  '/welcome',
  '/compound',
  '/portal',
  // API — webhook receivers (have their own auth)
  '/api/webhooks',
  '/api/webhook',
  '/api/discord',
  // API — auth + wallet registration
  '/api/auth',
  '/api/wallet',
  // API — cron-authed (CRON_SECRET Bearer)
  '/api/road/accrue',
  '/api/leaderboard',
  // API — public reads
  '/api/road',
  '/api/contact',
  '/api/portal',
  // API — checkout (credential is priceId or session_id, not session cookie)
  '/api/checkout',
  '/api/subscription',
  // API — contributions + bounties (validated internally by wallet/customerId)
  '/api/contributions',
  '/api/bounties',
  // Motors — public dealer subdomain, no auth
  '/motors',
  '/api/motors',
  // Static
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

/**
 * Session-optional routes: publicly accessible, but middleware resolves the
 * session if a cookie is present and injects x-rh-member / x-rh-tier headers.
 * Never redirects — the page or client component decides what to render.
 */
const SESSION_OPTIONAL = [
  '/',        // landing — shows upgrade banner for authenticated non-members
  '/partners', // public render — TokenGate handles membership prompt client-side
];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = req.headers.get('host') ?? '';

  // motors.roadhouse.capital/* → /motors/*
  // If pathname already starts with /motors (e.g. browser following a redirect),
  // pass through directly — prevents /motors/motors/... double-prefix.
  if (host.startsWith('motors.')) {
    if (pathname.startsWith('/motors')) return NextResponse.next();
    const rewritePath = pathname === '/' ? '/motors' : `/motors${pathname}`;
    const url = req.nextUrl.clone();
    url.pathname = rewritePath;
    url.search = search;
    return NextResponse.rewrite(url);
  }

  // Static files — fast path before anything else
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff2?)$/)) {
    return NextResponse.next();
  }

  // Fully public — no session resolution, immediate passthrough
  if (FULLY_PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Resolve session for all remaining routes
  const session = await resolveWalletSession(req);

  // Session-optional: resolve but never redirect
  if (SESSION_OPTIONAL.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    const res = NextResponse.next();
    if (session) {
      res.headers.set('x-rh-member', session.isMember ? '1' : '0');
      res.headers.set('x-rh-tier',   session.tier ?? '');
    }
    return res;
  }

  // /login — skip to destination if already authenticated
  if (pathname === '/login') {
    if (session) {
      return NextResponse.redirect(new URL(session.isMember ? '/dashboard' : '/', req.url));
    }
    return NextResponse.next();
  }

  // All other routes: require session
  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // /dashboard — additionally requires active membership
  if (pathname.startsWith('/dashboard') && !session.isMember) {
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
