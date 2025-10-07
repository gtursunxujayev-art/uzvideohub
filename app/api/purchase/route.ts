// app/api/purchase/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'
const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

// POST: buy a video with coins
export async function POST(req: Request) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const s = verifySession<{ userId: number }>(token)
  if (!s?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { videoId } = await req.json()
  const id = Number(videoId)
  if (!id) return NextResponse.json({ error: 'videoId required' }, { status: 400 })

  const video = await prisma.video.findUnique({ where: { id } })
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  if (video.isFree || video.price === 0) {
    // Free: create purchase if missing, but no coin change
    await prisma.purchase.upsert({
      where: { userId_videoId: { userId: s.userId, videoId: id } },
      create: { userId: s.userId, videoId: id, price: 0 },
      update: {},
    })
    return NextResponse.json({ ok: true })
  }

  const existing = await prisma.purchase.findUnique({
    where: { userId_videoId: { userId: s.userId, videoId: id } },
  })
  if (existing) return NextResponse.json({ ok: true })

  const user = await prisma.user.findUnique({ where: { id: s.userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.coins < video.price) {
    return NextResponse.json({ error: 'Tangalar yetarli emas' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { coins: user.coins - video.price },
    }),
    prisma.purchase.create({
      data: { userId: user.id, videoId: id, price: video.price },
    }),
  ])

  return NextResponse.json({ ok: true })
}
