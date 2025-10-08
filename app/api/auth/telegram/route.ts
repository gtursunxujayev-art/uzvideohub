// app/api/auth/telegram/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { signSession } from '@/src/lib/jwt'

/**
 * Body JSON:
 * {
 *   telegramId: string | number,
 *   username?: string,
 *   name?: string,
 *   displayName?: string
 * }
 *
 * NOTE: Prisma field is `tgId` (mapped to DB column "telegramId").
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
    const username = (body.username ?? null) as string | null
    const name = (body.name ?? null) as string | null
    const displayName = (body.displayName ?? null) as string | null

    if (!telegramId) {
      return NextResponse.json({ ok: false, error: 'telegramId required' }, { status: 400 })
    }

    const isAdmin = adminIds.includes(telegramId)

    // FIND by tgId (NOT telegramId)
    let user = await prisma.user.findUnique({
      where: { tgId: telegramId },
      select: {
        id: true, tgId: true, username: true, name: true, displayName: true,
        coins: true, isAdmin: true, referralCode: true, referredByUserId: true
      }
    })

    if (!user) {
      // CREATE with tgId
      user = await prisma.user.create({
        data: {
          tgId: telegramId,
          username,
          name,
          displayName,
          isAdmin,
          coins: 20,
        },
        select: {
          id: true, tgId: true, username: true, name: true, displayName: true,
          coins: true, isAdmin: true, referralCode: true, referredByUserId: true
        }
      })
    } else {
      // UPDATE profile + admin flag
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

    // Session cookie
    const token = signSession({ userId: user.id, isAdmin: user.isAdmin })
    const res = NextResponse.json({ ok: true, user })
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
    return res
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
