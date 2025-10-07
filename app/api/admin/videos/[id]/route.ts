// app/api/admin/videos/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'
const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

// PATCH: update video (admin)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const s = verifySession<{ isAdmin?: boolean }>(token)
  if (!s?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = Number(params.id)
  const body = await req.json()
  const data: any = {}

  if ('title' in body) data.title = String(body.title || '')
  if ('description' in body) data.description = String(body.description || '')
  if ('url' in body) data.url = String(body.url || '')
  if ('thumbUrl' in body) data.thumbUrl = body.thumbUrl ? String(body.thumbUrl) : null
  if ('category' in body) data.category = body.category ? String(body.category) : null
  if ('isFree' in body) data.isFree = Boolean(body.isFree)
  if ('price' in body) data.price = Number(body.price) || 0
  if ('tags' in body) {
    data.tags = Array.isArray(body.tags)
      ? body.tags
      : (typeof body.tags === 'string'
          ? body.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : [])
  }

  await prisma.video.update({ where: { id }, data })
  return NextResponse.json({ ok: true })
}

// DELETE: remove video (admin)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const s = verifySession<{ isAdmin?: boolean }>(token)
  if (!s?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = Number(params.id)
  await prisma.purchase.deleteMany({ where: { videoId: id } })
  await prisma.video.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
