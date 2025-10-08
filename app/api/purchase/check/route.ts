// app/api/purchase/check/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const idRaw = url.searchParams.get('id')
    const videoId = Number(idRaw)
    if (!Number.isFinite(videoId)) {
      return NextResponse.json({ ok: false, error: 'Invalid id', owned: false }, { status: 400 })
    }

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, isFree: true, price: true },
    })
    if (!video) return NextResponse.json({ ok: false, error: 'Not found', owned: false }, { status: 404 })
    if (video.isFree) return NextResponse.json({ ok: true, owned: true, price: 0, isFree: true })

    const token = cookies().get(COOKIE)?.value || ''
    if (!token) return NextResponse.json({ ok: true, owned: false, price: video.price, isFree: false })

    const s = verifySession<{ userId: number }>(token)
    if (!s?.userId) return NextResponse.json({ ok: true, owned: false, price: video.price, isFree: false })

    const has = await prisma.purchase.findFirst({
      where: { userId: s.userId, videoId },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, owned: !!has, price: video.price, isFree: false })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e), owned: false }, { status: 500 })
  }
}