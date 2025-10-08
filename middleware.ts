// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: ['/admin'],
}

export async function middleware(req: NextRequest) {
  // Allow API/static prefetches to pass (shouldn't hit due to matcher, but safe)
  if (req.nextUrl.pathname.startsWith('/api')) return NextResponse.next()

  // Ask server to confirm admin (passes user cookies through)
  const checkUrl = new URL('/api/auth/check-admin', req.url)
  const res = await fetch(checkUrl, {
    method: 'GET',
    headers: { cookie: req.headers.get('cookie') || '' },
    // Important for Vercel edge → same-region
    cache: 'no-store',
    redirect: 'manual',
  })

  if (res.ok) {
    // Admin confirmed
    return NextResponse.next()
  }

  // Not admin → redirect to home
  const home = new URL('/', req.url)
  return NextResponse.redirect(home)
}
