// app/api/admin/coins/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function POST(req: Request) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const s = verifySession<{ isAdmin: boolean; userId: number }>(token)
  if (!s?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, delta, reason } = await req.json()
  const uid = Number(userId)
  const d = Number(delta)
  if (!uid || !Number.isFinite(d)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: uid } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const updated = await prisma.$transaction(async (tx) => {
    await tx.coinTransaction.create({
      data: { userId: uid, adminId: s.userId, delta: d, reason: reason || null },
    })
    return tx.user.update({
      where: { id: uid },
      data: { coins: { increment: d } },
      select: { id: true, coins: true },
    })
  })

  return NextResponse.json({ ok: true, user: updated })
}
