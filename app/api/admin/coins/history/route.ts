// app/api/admin/coins/history/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function GET(req: Request) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const s = verifySession<{ isAdmin: boolean }>(token)
  if (!s?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const userId = Number(searchParams.get('userId') || 0)

  const where = userId ? { userId } : {}
  const history = await prisma.coinTransaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { user: { select: { id: true, name: true, username: true } }, admin: { select: { id: true, name: true, username: true } } },
  })

  return NextResponse.json(history)
}
