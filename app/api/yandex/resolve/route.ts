// app/api/yandex/resolve/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

/**
 * GET /api/yandex/resolve?url=<yandex_public_link>
 * Resolves a Yandex Disk public link to a direct download URL (href).
 * Works for both images and videos.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const input = searchParams.get('url') || ''
    if (!input) {
      return NextResponse.json({ ok: false, error: 'url is required' }, { status: 400 })
    }

    // Yandex Disk Public API (no auth required):
    // https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=<link>
    const api = 'https://cloud-api.yandex.net/v1/disk/public/resources/download'
    const u = `${api}?public_key=${encodeURIComponent(input)}`
    const r = await fetch(u, { method: 'GET' })
    const j = await r.json()
    if (!r.ok || !j?.href) {
      return NextResponse.json({ ok: false, error: j?.message || 'cannot resolve' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, href: j.href })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
