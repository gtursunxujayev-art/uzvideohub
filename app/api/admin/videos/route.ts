// app/api/admin/videos/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

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

export async function GET() {
  try {
    const admin = await getAdmin()
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized: admin only' },
        { status: 401 }
      )
    }

    const items = await prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
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
        updatedAt: true,
      },
    })

    return NextResponse.json({ ok: true, items, total: items.length })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    )
  }
}