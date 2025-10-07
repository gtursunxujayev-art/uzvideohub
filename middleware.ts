// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get(COOKIE)?.value
    if (!token) return NextResponse.redirect(new URL('/login', req.url))
    try {
      const data = jwt.verify(token, process.env.JWT_SECRET as string) as any
      if (!data?.isAdmin)
        return NextResponse.redirect(new URL('/', req.url))
    } catch {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
