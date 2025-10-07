// app/api/auth/telegram/webapp/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { signSession } from '@/src/lib/jwt'
import { verifyInitData } from '@/src/lib/telegramWebApp'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function POST(req: Request) {
  const { initData } = await req.json()
  const verified = verifyInitData(String(initData || ''))
  if (!verified.ok) {
    return NextResponse.json({ ok: false, error: 'Auth failed: bad signature' }, { status: 401 })
  }

  // initData contains "user" field with Telegram user object
  const tgUser =
    (verified.data?.user as any) ||
    (verified.data?.['user'] ? JSON.parse(String(verified.data?.['user'])) : null)

  if (!tgUser?.id) {
    return NextResponse.json({ ok: false, error: 'No user' }, { status: 400 })
  }

  const telegramId = String(tgUser.id)
  const username = tgUser.username || null
  const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ').trim() || null

  const adminIds = (process.env.ADMIN_TELEGRAM_IDS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

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
