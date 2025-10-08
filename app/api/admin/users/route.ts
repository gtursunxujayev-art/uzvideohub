// app/api/admin/users/route.ts
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
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      orderBy: [{ isAdmin: 'desc' }, { coins: 'desc' }],
      select: { id: true, username: true, name: true, coins: true, isAdmin: true },
      take: 1000,
    })

    return NextResponse.json({ ok: true, items: users })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}