// app/api/me/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function GET() {
  try {
    const token = cookies().get(COOKIE)?.value || ''
    if (!token) return NextResponse.json({ ok: true, user: null })
    const s = verifySession<{ userId: number }>(token)
    if (!s?.userId) return NextResponse.json({ ok: true, user: null })

    const user = await prisma.user.findUnique({
      where: { id: s.userId },
      select: { id: true, username: true, name: true, coins: true, isAdmin: true },
    })
    return NextResponse.json({ ok: true, user: user || null })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}