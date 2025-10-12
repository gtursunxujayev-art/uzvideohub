// app/api/admin/videos/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const runtime = 'nodejs'
const prisma = new PrismaClient()

type Body = {
  code?: string
  title: string
  description?: string
  url: string              // can be http(s) or telegram file_id
  thumbUrl?: string        // http(s) or telegram file_id
  category?: string
  tags?: string[]          // optional array
  isFree?: boolean
  price?: number
}

/** very small utility to decide if string is http(s) link or telegram file_id */
function normalizeMedia(v?: string) {
  if (!v) return undefined
  const s = v.trim()
  if (!s) return undefined
  // Allow direct url or file_id; store as-is — your UI uses /api/proxy-media for http(s)
  return s
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Body

    const title = (b.title || '').trim()
    const url = normalizeMedia(b.url)
    if (!title) {
      return NextResponse.json({ ok: false, error: 'Sarlavha majburiy' }, { status: 400 })
    }
    if (!url) {
      return NextResponse.json({ ok: false, error: 'Video URL yoki file_id majburiy' }, { status: 400 })
    }

    const isFree = Boolean(b.isFree)
    const price = isFree ? 0 : Math.max(0, Number.isFinite(b.price as any) ? Number(b.price) : 0)

    if (!isFree && price <= 0) {
      return NextResponse.json({ ok: false, error: 'Pullik video uchun narx > 0 bo‘lishi kerak' }, { status: 400 })
    }

    const data = {
      code: (b.code || '').trim() || null,
      title,
      description: (b.description || '').trim(),
      url,
      thumbUrl: normalizeMedia(b.thumbUrl) || null,
      category: (b.category || '').trim() || null,
      tags: Array.isArray(b.tags) ? b.tags.map(s => String(s).trim()).filter(Boolean) : [],
      isFree,
      price,
    }

    const created = await prisma.video.create({ data })
    return NextResponse.json({ ok: true, item: created })
  } catch (e: any) {
    // surface prisma details if available
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    )
  }
}