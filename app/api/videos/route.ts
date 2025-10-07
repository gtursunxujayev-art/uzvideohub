// app/api/videos/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

// GET: list videos (public)
export async function GET() {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, description: true, url: true, isFree: true, price: true,
      thumbUrl: true, category: true, tags: true,
    },
  })
  return NextResponse.json(videos, { headers: { 'Cache-Control': 'no-store' } })
}

// POST: add a video (admin only)
export async function POST(req: Request) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const s = verifySession<{ userId: number; isAdmin?: boolean }>(token)
  if (!s?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const {
    title = '',
    description = '',
    url = '',
    price = 0,
    isFree = false,
    thumbUrl = null,
    category = null,
    tags = [],
  } = body || {}

  if (!title || !url) {
    return NextResponse.json({ error: 'title and url are required' }, { status: 400 })
  }

  const normTags: string[] = Array.isArray(tags)
    ? tags
    : (typeof tags === 'string'
        ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [])

  const created = await prisma.video.create({
    data: {
      title: String(title),
      description: String(description),
      url: String(url),
      price: Number(price) || 0,
      isFree: Boolean(isFree),
      thumbUrl: thumbUrl ? String(thumbUrl) : null,
      category: category ? String(category) : null,
      tags: normTags,
    },
    select: { id: true },
  })

  return NextResponse.json({ ok: true, id: created.id })
}
