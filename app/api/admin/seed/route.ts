// app/api/admin/seed/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

type Body = {
  video?: {
    title?: string
    description?: string
    url?: string
    isFree?: boolean
    price?: number
    thumbUrl?: string | null
    category?: string | null
    code?: string | null
    tags?: string[] | string | null
  }
}

async function getAdmin() {
  const token = cookies().get(COOKIE)?.value || ''
  if (!token) return null
  try {
    const s = verifySession<{ userId: number }>(token)
    if (!s?.userId) return null
    const u = await prisma.user.findUnique({
      where: { id: s.userId },
      select: { id: true, isAdmin: true },
    })
    return u && u.isAdmin ? u : null
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdmin()
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized: admin only' },
        { status: 401 }
      )
    }

    const body = (await req.json().catch(() => ({}))) as Body
    const v = body?.video || {}

    // Validate
    const title = (v.title || '').trim()
    const url = (v.url || '').trim()
    if (!title) {
      return NextResponse.json(
        { ok: false, error: "Title (sarlavha) is required" },
        { status: 400 }
      )
    }
    if (!url) {
      return NextResponse.json(
        { ok: false, error: "URL is required (video url or file_id:...)" },
        { status: 400 }
      )
    }

    // Normalize
    const description = (v.description || '').trim()
    const isFree = !!v.isFree
    const price = Number.isFinite(v?.price as number) ? Number(v?.price) : 0
    const thumbUrl = (v.thumbUrl || null) as string | null
    const category = (v.category || null) as string | null
    const code = (v.code || null) as string | null
    let tags: string[] = []
    if (Array.isArray(v.tags)) {
      tags = v.tags.map(s => String(s).trim()).filter(Boolean)
    } else if (typeof v.tags === 'string') {
      tags = v.tags.split(',').map(s => s.trim()).filter(Boolean)
    }

    const item = await prisma.video.create({
      data: { title, description, url, isFree, price, thumbUrl, category, code, tags },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, id: item.id })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    )
  }
}