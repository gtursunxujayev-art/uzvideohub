// app/api/videos/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'

type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'title'

function parseIntSafe(v: string | null, def: number) {
  const n = v ? parseInt(v, 10) : NaN
  return Number.isFinite(n) ? n : def
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('q')?.trim() || ''
    const category = url.searchParams.get('category')?.trim() || ''
    const tag = url.searchParams.get('tag')?.trim() || ''
    const code = url.searchParams.get('code')?.trim() || ''
    const sort = (url.searchParams.get('sort') as SortKey) || 'newest'

    const page = Math.max(1, parseIntSafe(url.searchParams.get('page'), 1))
    const limit = Math.min(50, Math.max(1, parseIntSafe(url.searchParams.get('limit'), 24)))
    const skip = (page - 1) * limit

    const where: any = {}
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (category) where.category = { equals: category, mode: 'insensitive' }
    if (tag) where.tags = { has: tag }
    if (code) where.code = { equals: code, mode: 'insensitive' }

    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'price_asc') orderBy = { price: 'asc' }
    else if (sort === 'price_desc') orderBy = { price: 'desc' }
    else if (sort === 'title') orderBy = { title: 'asc' }

    const [total, items] = await Promise.all([
      prisma.video.count({ where }),
      prisma.video.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
      }),
    ])

    return NextResponse.json({
      ok: true,
      page,
      limit,
      total,
      items,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
