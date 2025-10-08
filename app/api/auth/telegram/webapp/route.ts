// app/api/auth/telegram/webapp/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { signSession } from '@/src/lib/jwt'

/**
 * Expects JSON:
 * {
 *   tgId: string,            // Telegram user id as string
 *   username?: string,
 *   displayName?: string,
 *   ref?: string             // optional referral code (NOT user id)
 * }
 *
 * Behavior:
 * - Upsert user by tgId
 * - If user has no referral yet and "ref" is a valid referralCode of another user → attach + credit bonuses
 * - Sets auth cookie for session
 */
const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'
const REF_BONUS_REFERRER = Number(process.env.REF_BONUS_REFERRER || 5)
const REF_BONUS_NEWUSER  = Number(process.env.REF_BONUS_NEWUSER  || 3)

export async function POST(req: Request) {
  try {
    const { tgId, username, displayName, ref } = await req.json()

    if (!tgId) {
      return NextResponse.json({ ok: false, error: 'tgId required' }, { status: 400 })
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { tgId: String(tgId) },
      select: { id: true, tgId: true, username: true, displayName: true, coins: true, isAdmin: true, referredByUserId: true, referralCode: true }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          tgId: String(tgId),
          username: username || null,
          displayName: displayName || null,
          // referralCode will be generated lazily below if missing
        },
        select: { id: true, tgId: true, username: true, displayName: true, coins: true, isAdmin: true, referredByUserId: true, referralCode: true }
      })
    } else {
      // Light profile refresh
      if ((username && username !== user.username) || (displayName && displayName !== user.displayName)) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { username: username || user.username, displayName: displayName || user.displayName },
          select: { id: true, tgId: true, username: true, displayName: true, coins: true, isAdmin: true, referredByUserId: true, referralCode: true }
        })
      }
    }

    // Ensure this user has a referralCode for sharing later
    if (!user.referralCode) {
      // Generate short unique referral code (A-Z 2-9 without confusing chars)
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      function makeCode(len = 8) {
        let s = ''
        for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
        return s
      }
      while (!user.referralCode) {
        const code = makeCode()
        const exists = await prisma.user.findFirst({ where: { referralCode: code }, select: { id: true } })
        if (!exists) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { referralCode: code },
            select: { id: true, tgId: true, username: true, displayName: true, coins: true, isAdmin: true, referredByUserId: true, referralCode: true }
          })
        }
      }
    }

    // If ref provided AND user has NOT been referred yet → attach & credit (one-time)
    if (ref && !user.referredByUserId) {
      const referrer = await prisma.user.findFirst({
        where: { referralCode: String(ref) },
        select: { id: true }
      })

      if (referrer && referrer.id !== user.id) {
        await prisma.$transaction(async (tx) => {
          // Attach referral
          await tx.user.update({
            where: { id: user!.id },
            data: { referredByUserId: referrer.id },
          })
          // Credit referrer
          await tx.user.update({
            where: { id: referrer.id },
            data: { coins: { increment: REF_BONUS_REFERRER } },
          })
          await tx.coinTransaction.create({
            data: {
              userId: referrer.id,
              adminId: null,
              delta: REF_BONUS_REFERRER,
              reason: `Referral bonus: invited user #${user!.id}`,
            }
          })
          // Credit new user
          await tx.user.update({
            where: { id: user!.id },
            data: { coins: { increment: REF_BONUS_NEWUSER } },
          })
          await tx.coinTransaction.create({
            data: {
              userId: user!.id,
              adminId: null,
              delta: REF_BONUS_NEWUSER,
              reason: `Referral signup bonus (code ${ref})`,
            }
          })
        })

        // refresh local copy
        user = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, tgId: true, username: true, displayName: true, coins: true, isAdmin: true, referredByUserId: true, referralCode: true }
        }) as typeof user
      }
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
