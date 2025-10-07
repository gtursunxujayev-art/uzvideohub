// app/api/me/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function GET(req: Request) {
  // @ts-ignore - Next.js adds cookies on request
  const token = req.cookies?.get?.(COOKIE)?.value || null
  const session = verifySession<{ userId: number; isAdmin: boolean }>(token)
  if (!session) return NextResponse.json({ user: null })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, username: true, coins: true, isAdmin: true },
  })

  return NextResponse.json({ user })
}
