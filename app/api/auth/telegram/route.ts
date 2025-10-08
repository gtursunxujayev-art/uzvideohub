// app/api/auth/telegram/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { signSession } from '@/src/lib/jwt'

/**
 * Body JSON (from your Telegram login flow):
 * {
 *   telegramId: string | number,
 *   username?: string,
 *   name?: string,
 *   displayName?: string
 * }
 *
 * Note: Prisma schema uses `tgId` (mapped to DB column "telegramId").
 */

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'
const adminIds = (process.env.ADMIN_TELEGRAM_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const telegramId = String(body.telegramId || '')
    const username = body.username || null
    const name = body.name || null
    const displayName = body.displayName || null

    if (!telegramId) {
      return NextResponse.json({ ok: false, error: 'telegramId required' }, { status: 400 })
    }

    const isAdmin = adminIds.includes(telegramId)

    // ❗ Prisma field is tgId (mapped to DB column "telegramId")
    let user = await prisma.user.findUnique({
      where: { tgId: telegramId },
      select: {
        id: true, tgId: true, username: true, name: true, displayName: true,
        coins: true, isAdmin: true, referralCode: true, referredByUserId: true
      }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          tgId: telegramId,
          username,
          name,
          displayName,
          isAdmin,
          coins: 20, // welcome bonus (adjust as you like)
        },
        select: {
          id: true, tgId: true, username: true, name: true, displayName: true,
          coins: true, isAdmin: true, referralCode: true, referredByUserId: true
        }
      })
    } else {
      // light profile refresh + admin flag refresh
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          username: username ?? user.username,
          name: name ?? user.name,
          displayName: displayName ?? user.displayName,
          isAdmin,
        },
        select: {
          id: true, tgId: true, username: true, name: true, displayName: true,
          coins: true, isAdmin: true, referralCode: true, referredByUserId: true
        }
      })
    }

    // Issue session cookie
    const token = signSession({ userId: user.id, isAdmin: user.isAdmin })
    const res = NextResponse.json({ ok: true, user })
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
    return res
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
