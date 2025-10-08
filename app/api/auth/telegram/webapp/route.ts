// app/api/auth/telegram/webapp/route.ts
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'

export async function POST(req: Request) {
  const data = await req.json()
  const { telegramId, username, displayName, ref } = data

  if (!telegramId) return NextResponse.json({ ok: false, error: 'No telegramId' })

  let user = await prisma.user.findUnique({ where: { telegramId } })
  if (!user) {
    const referredBy = ref ? await prisma.user.findUnique({ where: { id: parseInt(ref) || 0 } }) : null
    user = await prisma.user.create({
      data: {
        telegramId,
        username,
        displayName,
        referredById: referredBy ? referredBy.id : null,
      },
    })
    // give bonus coins to referrer
    if (referredBy) {
      await prisma.user.update({
        where: { id: referredBy.id },
        data: { coins: { increment: 5 } },
      })
    }
  }

  return NextResponse.json({ ok: true, user })
}
