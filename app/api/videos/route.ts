// app/api/videos/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limitRaw = url.searchParams.get('limit')
    const take = Math.min(Math.max(parseInt(limitRaw || '24', 10) || 24, 1), 500)

    const rows = await prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        thumbUrl: true,
        price: true,
        isFree: true,
        category: true,
        code: true,
      },
      take,
    })

    return NextResponse.json({
      ok: true,
      items: rows,
      total: rows.length,
      page: 1,
      limit: take,
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e), items: [], total: 0, page: 1, limit: 0 },
      { status: 500 }
    )
  }
}