// app/api/admin/videos/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

function isAdmin(token?: string) {
  const s = verifySession<{ isAdmin: boolean }>(token || '')
  return !!s?.isAdmin
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  if (!isAdmin(token)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = Number(params.id)
  const body = await req.json()

  const updated = await prisma.video.update({
    where: { id },
    data: {
      title: body.title ?? undefined,
      description: body.description ?? undefined,
      url: body.url ?? undefined,
      thumbUrl: body.thumbUrl ?? undefined,
      category: body.category ?? undefined,
      tags: Array.isArray(body.tags)
        ? body.tags
        : typeof body.tags === 'string'
        ? body.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : undefined,
      isFree: typeof body.isFree === 'boolean' ? body.isFree : undefined,
      price: typeof body.price === 'number' ? body.price : undefined,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  if (!isAdmin(token)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const id = Number(params.id)
  await prisma.video.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
