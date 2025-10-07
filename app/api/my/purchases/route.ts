// app/api/my/purchases/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function GET(req: Request) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const session = verifySession<{ userId: number }>(token)
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const purchases = await prisma.purchase.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: { video: true },
  })

  const videos = purchases.map(p => p.video)
  return NextResponse.json(videos)
}
