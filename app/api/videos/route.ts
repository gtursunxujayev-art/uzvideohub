// app/api/videos/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'

export async function GET() {
  try {
    // Minimal, safe SELECT for the homepage
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
      take: 200,
    })

    // Filter out any unexpected/falsy rows just in case
    const items = (rows || []).filter(
      (v) => v && typeof v.id === 'number' && Number.isFinite(v.id)
    )

    return NextResponse.json({
      ok: true,
      items,
      total: items.length,
      page: 1,
      limit: items.length,
    })
  } catch (e: any) {
    // Always return a safe JSON shape
    return NextResponse.json(
      { ok: false, error: String(e?.message || e), items: [], total: 0, page: 1, limit: 0 },
      { status: 500 }
    )
  }
}