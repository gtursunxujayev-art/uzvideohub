// app/api/auth/telegram/webapp/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { signSession } from '@/src/lib/jwt'
import { sendMessage } from '@/src/lib/telegramApi'

/**
 * Expects JSON:
 * {
 *   tgId: string,
 *   username?: string,
 *   displayName?: string,
 *   ref?: string        // referralCode of inviter (optional)
 * }
 *
 * Behavior:
 * - Upsert user by tgId
 * - New users receive 20 starting coins
 * - If ref present and not yet referred:
 *     * attach referrer
 *     * +5 coins to referrer, +3 coins to new user
 *     * send bot notification to referrer with inviter’s name + their ref link
 *     * send “3 tanga sovg'a” message to the new user (only once)
 * - Set session cookie
 */

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'
const REF_BONUS_REFERRER = Number(process.env.REF_BONUS_REFERRER || 5)
const REF_BONUS_NEWUSER  = Number(process.env.REF_BONUS_NEWUSER  || 3)
const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME || ''

function alphabetCode(len = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return s
}

export async function POST(req: Request) {
  try {
    const { tgId, username, displayName, ref } = await req.json()
    if (!tgId) return NextResponse.json({ ok: false, error: 'tgId required' }, { status: 400 })

    // find or create user by tgId
    let user = await prisma.user.findUnique({
      where: { tgId: String(tgId) },
      select: {
        id: true, tgId: true, username: true, displayName: true,
        coins: true, isAdmin: true, referredByUserId: true, referralCode: true
      }
    })

    let isNew = false

    if (!user) {
      // new user: start with 20 coins
      user = await prisma.user.create({
        data: {
          tgId: String(tgId),
          username: username || null,
          displayName: displayName || null,
          coins: 20,
        },
        select: {
          id: true, tgId: true, username: true, displayName: true,
          coins: true, isAdmin: true, referredByUserId: true, referralCode: true
        }
      })
      isNew = true
    } else {
      // profile refresh
      if ((username && username !== user.username) || (displayName && displayName !== user.displayName)) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { username: username || user.username, displayName: displayName || user.displayName },
          select: {
            id: true, tgId: true, username: true, displayName: true,
            coins: true, isAdmin: true, referredByUserId: true, referralCode: true
          }
        })
      }
    }

    // Ensure referralCode exists for this user (so they can invite others later)
    if (!user.referralCode) {
      while (!user.referralCode) {
        const code = alphabetCode(8)
        const exists = await prisma.user.findFirst({ where: { referralCode: code }, select: { id: true } })
        if (!exists) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { referralCode: code },
            select: {
              id: true, tgId: true, username: true, displayName: true,
              coins: true, isAdmin: true, referredByUserId: true, referralCode: true
            }
          })
        }
      }
    }

    // If ref code provided and not yet referred → attach & credit once
    if (ref && !user.referredByUserId) {
      const referrer = await prisma.user.findFirst({
        where: { referralCode: String(ref) },
        select: { id: true, tgId: true, username: true, displayName: true, referralCode: true }
      })

      if (referrer && referrer.id !== user.id) {
        await prisma.$transaction(async (tx) => {
          await tx.user.update({ where: { id: user!.id }, data: { referredByUserId: referrer.id } })
          // + coins to referrer
          await tx.user.update({ where: { id: referrer.id }, data: { coins: { increment: REF_BONUS_REFERRER } } })
          await tx.coinTransaction.create({
            data: { userId: referrer.id, adminId: null, delta: REF_BONUS_REFERRER, reason: `Referral bonus: invited user #${user!.id}` }
          })
          // + coins to new user (3)
          await tx.user.update({ where: { id: user!.id }, data: { coins: { increment: REF_BONUS_NEWUSER } } })
          await tx.coinTransaction.create({
            data: { userId: user!.id, adminId: null, delta: REF_BONUS_NEWUSER, reason: `Referral signup bonus (code ${ref})` }
          })
        })

        // Notify referrer via bot (if we know tgId)
        if (referrer.tgId) {
          const invitedName = user.displayName || user.username || `#${user.id}`
          const refLink = BOT_USERNAME ? `https://t.me/${BOT_USERNAME}?start=ref_${referrer.referralCode}` : ''
          const text =
`Tabriklaymiz!🎉
Do'stingiz ${invitedName} taklifingizni qabul qildi. Siz ${REF_BONUS_REFERRER} tanga qo'lga kiritdingiz.
Do'stlaringizni taklif qilishda davom eting!
${refLink}`
          try { await sendMessage(referrer.tgId, text) } catch {}
        }

        // Tell new user about +3 only once (now)
        const giftText = `Tabriklaymiz! Sizga ${REF_BONUS_NEWUSER} tanga sovg'a qilindi.`
        try { await sendMessage(String(tgId), giftText) } catch {}
      }
    } else if (isNew) {
      // Non-referred new users: no extra message; they already have 20 coins silently.
    }

    // session cookie
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
