// app/api/admin/coins/route.ts
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

type Body = {
  userId?: number
  amount?: number
  note?: string
}

export async function POST(req: Request) {
  try {
    const admin = await getAdmin()
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as Body
    const userId = Number(body.userId)
    const amount = Number(body.amount)

    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ ok: false, error: 'Noto‘g‘ri foydalanuvchi' }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount === 0) {
      return NextResponse.json({ ok: false, error: 'Miqdor 0 bo‘la olmaydi' }, { status: 400 })
    }

    // Update user balance atomically
    const user = await prisma.user.update({
      where: { id: userId },
      data: { coins: { increment: amount } },
      select: { id: true, coins: true, username: true, name: true },
    })

    // If you later add a CoinTransaction table, you can write a record here.

    return NextResponse.json({ ok: true, user })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}