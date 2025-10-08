// app/api/auth/check-admin/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function GET(req: Request) {
  // @ts-ignore (Edge passes cookies differently, but Node runtime supports this)
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const s = verifySession<{ userId: number }>(token)
  if (!s?.userId) return NextResponse.json({ ok: false }, { status: 401 })

  const u = await prisma.user.findUnique({ where: { id: s.userId }, select: { isAdmin: true } })
  if (!u?.isAdmin) return NextResponse.json({ ok: false }, { status: 403 })

  return NextResponse.json({ ok: true })
}
