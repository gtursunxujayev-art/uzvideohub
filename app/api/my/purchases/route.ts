// app/api/my/purchases/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function GET() {
  try {
    const token = cookies().get(COOKIE)?.value || ''
    if (!token) return NextResponse.json({ ok: true, items: [] })

    const s = verifySession<{ userId: number }>(token)
    if (!s?.userId) return NextResponse.json({ ok: true, items: [] })

    const rows = await prisma.purchase.findMany({
      where: { userId: s.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        price: true,
        video: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbUrl: true,
            url: true,
            isFree: true,
            price: true,
            category: true,
            code: true,
          },
        },
      },
    })

    // Flatten to videos array (keeping purchase info if needed later)
    const items = rows
      .map(r => r?.video)
      .filter(Boolean)

    return NextResponse.json({ ok: true, items })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e), items: [] }, { status: 500 })
  }
}