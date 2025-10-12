import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Fix: ensure absolute URL
    const fullUrl =
      req.url.startsWith('http')
        ? req.url
        : `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('host')}${req.url}`
    const { searchParams } = new URL(fullUrl)
    const id = searchParams.get('id')

    if (id) {
      const vid = await prisma.video.findUnique({
        where: { id: Number(id) || -1 },
      })
      if (!vid) {
        return NextResponse.json({ ok: false, error: 'Video topilmadi' }, { status: 404 })
      }
      return NextResponse.json({ ok: true, item: vid })
    }

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