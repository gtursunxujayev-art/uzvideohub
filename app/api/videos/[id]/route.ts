// app/api/videos/[id]/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id)
    if (!Number.isFinite(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 })
    }

    const video = await prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        url: true,
        isFree: true,
        price: true,
        thumbUrl: true,
        category: true,
        tags: true,
        createdAt: true,
      },
    })

    if (!video) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

    return NextResponse.json({ ok: true, item: video })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}