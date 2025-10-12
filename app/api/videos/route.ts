// app/api/videos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

function ok(data: any, init?: number) {
  return NextResponse.json({ ok: true, ...data }, { status: init ?? 200 })
}
function err(message: string, init = 400, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status: init })
}

export async function GET(req: NextRequest) {
  try {
    // Ensure absolute URL for URL parsing on Vercel
    const fullUrl = req.url.startsWith('http')
      ? req.url
      : `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('host')}${req.url}`

    const { searchParams } = new URL(fullUrl)
    const raw = (searchParams.get('id') || '').trim()

    // If detail requested
    if (raw) {
      // Try numeric id first
      const isDigits = /^[0-9]+$/.test(raw)
      let vid = null

      if (isDigits) {
        const numId = parseInt(raw, 10)
        vid = await prisma.video.findUnique({ where: { id: numId } })
      }

      // If not found by numeric id OR raw is not digits, try by code
      if (!vid) {
        vid = await prisma.video.findFirst({ where: { code: raw } })
      }

      if (!vid) return err('Video topilmadi', 404, { query: raw })

      return ok({ item: vid })
    }

    // List page
    const items = await prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return ok({ items })
  } catch (e: any) {
    return err(String(e?.message || e), 500)
  }
}