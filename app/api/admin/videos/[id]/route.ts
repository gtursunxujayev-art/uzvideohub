// app/api/admin/videos/[id]/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

function requireAdmin(req: Request) {
  const cookieHeader = req.headers.get('cookie') || ''
  const token = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='))?.split('=')[1] || ''
  const s = verifySession<{ userId: number; isAdmin?: boolean }>(token)
  if (!s?.userId) return null
  return s
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const s = requireAdmin(req)
    if (!s) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const idNum = parseInt(params.id, 10)
    if (!Number.isFinite(idNum)) return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 })

    const body = await req.json()
    const payload: any = {}

    if ('code' in body) payload.code = body.code || null
    if ('title' in body) payload.title = body.title
    if ('description' in body) payload.description = body.description
    if ('url' in body) payload.url = body.url
    if ('isFree' in body) payload.isFree = !!body.isFree
    if ('price' in body) payload.price = Number(body.price || 0)
    if ('thumbUrl' in body) payload.thumbUrl = body.thumbUrl || null
    if ('category' in body) payload.category = body.category || null
    if ('tags' in body) payload.tags = Array.isArray(body.tags) ? body.tags : []

    const updated = await prisma.video.update({
      where: { id: idNum },
      data: payload,
      select: {
        id: true, code: true, title: true, description: true, url: true, isFree: true, price: true,
        thumbUrl: true, category: true, tags: true, updatedAt: true
      }
    })

    return NextResponse.json({ ok: true, video: updated })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const s = requireAdmin(req)
    if (!s) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const idNum = parseInt(params.id, 10)
    if (!Number.isFinite(idNum)) return NextResponse.json({ ok: false, error: 'Invalid id' }, { status: 400 })

    await prisma.video.delete({ where: { id: idNum } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
