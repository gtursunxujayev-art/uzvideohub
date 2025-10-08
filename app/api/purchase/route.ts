// app/api/purchase/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const videoId = Number(body?.videoId)
    if (!Number.isFinite(videoId)) {
      return NextResponse.json({ ok: false, error: 'Invalid videoId' }, { status: 400 })
    }

    // Auth
    const token = cookies().get(COOKIE)?.value || ''
    if (!token) return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 })
    const s = verifySession<{ userId: number }>(token)
    if (!s?.userId) return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 })

    // Load video (need price)
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, isFree: true, price: true },
    })
    if (!video) return NextResponse.json({ ok: false, error: 'Video not found' }, { status: 404 })

    if (video.isFree) {
      // Free: nothing to charge; optionally grant library entry
      return NextResponse.json({ ok: true, message: 'Free' })
    }

    // Already owned?
    const exists = await prisma.purchase.findFirst({
      where: { userId: s.userId, videoId },
      select: { id: true },
    })
    if (exists) {
      return NextResponse.json({ ok: true, message: 'Already owned' })
    }

    // Balance check
    const user = await prisma.user.findUnique({
      where: { id: s.userId },
      select: { id: true, coins: true },
    })
    if (!user) return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 })
    if ((user.coins || 0) < video.price) {
      return NextResponse.json({ ok: false, error: 'Tangalar yetarli emas (balance)' }, { status: 400 })
    }

    // Charge + create purchase (note: Purchase requires price)
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: s.userId },
        data: { coins: { decrement: video.price } },
        select: { id: true, coins: true },
      })
      await tx.purchase.create({
        data: {
          userId: s.userId,
          videoId,
          price: video.price, // <- REQUIRED by your schema
        },
      })
      return updated
    })

    return NextResponse.json({ ok: true, balance: result.coins })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
```0