// app/api/referrals/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function GET(req: Request) {
  try {
    // get session from cookie
    const token = (req.headers.get('cookie') || '')
      .split(';')
      .map(s => s.trim())
      .find(s => s.startsWith(COOKIE + '='))
      ?.split('=')[1]

    let userId: number | null = null
    if (token) {
      try {
        const s = verifySession<{ userId: number }>(token)
        userId = s?.userId || null
      } catch {}
    }

    const leaderboard = await prisma.user.findMany({
      where: { referrals: { some: {} } },
      select: {
        id: true,
        displayName: true,
        username: true,
        coins: true,
        referrals: { select: { id: true } },
      },
    })

    const ranks = leaderboard
      .map(u => ({
        id: u.id,
        name: u.displayName || u.username || `#${u.id}`,
        coins: u.coins,
        count: u.referrals.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    let myInvites: any[] = []
    if (userId) {
      myInvites = await prisma.user.findMany({
        where: { referredByUserId: userId },
        select: {
          id: true,
          displayName: true,
          username: true,
          coins: true,
          createdAt: true,
        },
      })
    }

    return NextResponse.json({ ok: true, leaderboard: ranks, myInvites })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
