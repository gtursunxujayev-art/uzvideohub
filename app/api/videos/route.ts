// app/api/videos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    // Single video
    if (id) {
      const vid = await prisma.video.findUnique({
        where: { id: Number(id) || -1 },
      })
      if (!vid) {
        return NextResponse.json({ ok: false, error: 'Video topilmadi' }, { status: 404 })
      }
      return NextResponse.json({ ok: true, item: vid })
    }

    // List videos
    const items = await prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json({ ok: true, items })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    )
  }
}