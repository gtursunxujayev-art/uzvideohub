// app/api/admin/coins/history/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'
const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function GET(req: Request) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const s = verifySession<{ isAdmin?: boolean }>(token)
  if (!s?.isAdmin) return NextResponse.json([], { status: 403 })

  const items = await prisma.coinTransaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { id: true, name: true, username: true } },
      admin: { select: { id: true, name: true, username: true } },
    },
  })
  return NextResponse.json(items)
}
