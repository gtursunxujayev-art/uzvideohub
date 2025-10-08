// app/api/profile/refcode/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function GET(req: Request) {
  try {
    // @ts-ignore
    const token = req.cookies?.get?.(COOKIE)?.value || ''
    const s = verifySession<{ userId: number }>(token)
    if (!s?.userId) return NextResponse.json({ code: '' })

    let user = await prisma.user.findUnique({
      where: { id: s.userId },
      select: { id: true, referralCode: true }
    })
    if (!user) return NextResponse.json({ code: '' })

    if (!user.referralCode) {
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      function makeCode(len = 8) {
        let s = ''
        for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
        return s
      }
      // generate unique code
      while (!user.referralCode) {
        const code = makeCode()
        const exists = await prisma.user.findFirst({ where: { referralCode: code }, select: { id: true } })
        if (!exists) {
          await prisma.user.update({ where: { id: user.id }, data: { referralCode: code } })
          user = { ...user, referralCode: code }
        }
      }
    }

    return NextResponse.json({ code: user.referralCode })
  } catch (e: any) {
    return NextResponse.json({ code: '' })
  }
}
