// app/api/me/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function GET(req: Request) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const s = verifySession<{ userId: number; isAdmin?: boolean }>(token)
  if (!s?.userId) return NextResponse.json({ user: null })

  const user = await prisma.user.findUnique({ where: { id: s.userId } })
  if (!user) return NextResponse.json({ user: null })

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      coins: user.coins,
      isAdmin: user.isAdmin,
    },
  })
}

export async function PATCH(req: Request) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const s = verifySession<{ userId: number }>(token)
  if (!s?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const username = (body?.username ?? '').toString().trim()
  if (!username) return NextResponse.json({ error: 'Username kerak' }, { status: 400 })

  const updated = await prisma.user.update({
    where: { id: s.userId },
    data: { username },
    select: { id: true, username: true },
  })

  return NextResponse.json({ ok: true, user: updated })
}
