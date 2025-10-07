// app/api/videos/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const category = (searchParams.get('category') || '').trim()

  const videos = await prisma.video.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { tags: { has: q } },
              ],
            }
          : {},
        category ? { category: { equals: category, mode: 'insensitive' } } : {},
      ],
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(videos)
}

export async function POST(req: Request) {
  // admin only
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const session = verifySession<{ isAdmin: boolean }>(token)
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const {
    title,
    description,
    url,
    price,
    isFree,
    thumbUrl,
    category,
    tags,
  } = body

  if (!title || !url) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const video = await prisma.video.create({
    data: {
      title,
      description: description || '',
      url,
      price: Number(price) || 0,
      isFree: !!isFree,
      thumbUrl: thumbUrl || null,
      category: category || null,
      tags: Array.isArray(tags)
        ? tags.map((t: string) => String(t).trim()).filter(Boolean)
        : typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    },
  })
  return NextResponse.json(video)
}
