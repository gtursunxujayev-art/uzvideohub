// app/api/my/purchases/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'
const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function GET(req: Request) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const s = verifySession<{ userId: number }>(token)
  if (!s?.userId) return NextResponse.json([])

  const items = await prisma.purchase.findMany({
    where: { userId: s.userId },
    orderBy: { createdAt: 'desc' },
    include: { video: { select: { id: true, title: true, description: true } } },
  })

  const videos = items.map((i) => ({
    id: i.video.id,
    title: i.video.title,
    description: i.video.description,
    price: i.price,
  }))

  return NextResponse.json(videos)
}
