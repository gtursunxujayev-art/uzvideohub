// app/api/auth/telegram/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifyTelegramAuth } from '@/src/lib/telegram'
import { signSession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, string>

  if (!verifyTelegramAuth(body)) {
    return NextResponse.json(
      { ok: false, error: 'Auth failed: bad signature' },
      { status: 401 }
    )
  }

  const telegramId = String(body.id)
  const username = body.username || null
  const name =
    [body.first_name, body.last_name].filter(Boolean).join(' ').trim() || null

  const adminIds = (process.env.ADMIN_TELEGRAM_IDS || '')
    .split(',')
    .map((x) => x.trim())
  const isAdmin = adminIds.includes(telegramId)

  let user = await prisma.user.findUnique({ where: { telegramId } })
  if (!user) {
    user = await prisma.user.create({
      data: { telegramId, username, name, isAdmin, coins: 20 },
    })
  } else if (isAdmin && !user.isAdmin) {
    user = await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } })
  }

  const token = signSession({ userId: user.id, isAdmin: user.isAdmin })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
