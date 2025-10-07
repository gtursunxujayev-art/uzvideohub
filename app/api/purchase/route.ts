// app/api/purchase/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function POST(req: Request) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const session = verifySession<{ userId: number }>(token)
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { videoId } = await req.json()
  const video = await prisma.video.findUnique({ where: { id: Number(videoId) } })
  if (!video) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (video.isFree || video.price === 0) {
    return NextResponse.json({ ok: true, free: true })
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owned = await prisma.purchase.findUnique({
    where: { userId_videoId: { userId: user.id, videoId: video.id } },
  })
  if (owned) return NextResponse.json({ ok: true, owned: true })

  if (user.coins < video.price) return NextResponse.json({ error: 'Not enough coins' }, { status: 400 })

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { coins: { decrement: video.price } } }),
    prisma.purchase.create({ data: { userId: user.id, videoId: video.id, price: video.price } }),
  ])

  return NextResponse.json({ ok: true })
}
