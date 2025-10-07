// app/api/admin/users/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

function assertAdmin(token?: string) {
  const s = verifySession<{ isAdmin: boolean }>(token || '')
  if (!s?.isAdmin) throw new Error('Forbidden')
}

export async function GET(req: Request) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  try {
    assertAdmin(token)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(users)
}

export async function POST(req: Request) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  try {
    assertAdmin(token)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, coins } = await req.json()
  const user = await prisma.user.update({
    where: { id: Number(userId) },
    data: { coins: Number(coins) },
  })
  return NextResponse.json(user)
}
