// app/api/purchase/check/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function GET(req: Request) {
  // @ts-ignore
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const session = verifySession<{ userId: number }>(token)
  const { searchParams } = new URL(req.url)
  const videoId = Number(searchParams.get('videoId') || '0')

  if (!videoId) return NextResponse.json({ error: 'Missing videoId' }, { status: 400 })
  if (!session?.userId) return NextResponse.json({ owned: false })

  const purchase = await prisma.purchase.findUnique({
    where: { userId_videoId: { userId: session.userId, videoId } },
  })

  return NextResponse.json({ owned: !!purchase })
}
