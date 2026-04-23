import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const { pathname, search } = req.nextUrl

  // motors.roadhouse.capital/* → /motors/*
  if (host.startsWith('motors.')) {
    const rewritePath = pathname === '/' ? '/motors' : `/motors${pathname}`
    const url = req.nextUrl.clone()
    url.pathname = rewritePath
    url.search = search
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
