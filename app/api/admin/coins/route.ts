// app/api/admin/users/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'
const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

// GET: list users (admin)
export async function GET(req: Request) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const s = verifySession<{ isAdmin?: boolean }>(token)
  if (!s?.isAdmin) return NextResponse.json([], { status: 403 })

  const users = await prisma.user.findMany({
    orderBy: { id: 'desc' },
    select: { id: true, name: true, username: true, coins: true, isAdmin: true },
    take: 200,
  })
  return NextResponse.json(users)
}

// POST: set absolute coins for a user (admin)
export async function POST(req: Request) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const s = verifySession<{ userId: number; isAdmin?: boolean }>(token)
  if (!s?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, coins } = await req.json()
  if (!userId || typeof coins !== 'number') {
    return NextResponse.json({ error: 'userId and coins required' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: Number(userId) },
    data: { coins: Math.max(0, Math.floor(coins)) },
    select: { id: true, coins: true },
  })
  return NextResponse.json({ ok: true, user: updated })
}
