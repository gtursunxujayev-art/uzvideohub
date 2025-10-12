// app/api/proxy-media/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const src = url.searchParams.get('src') || ''

    if (!src || !/^https?:\/\//i.test(src)) {
      return NextResponse.json({ ok: false, error: 'Invalid src' }, { status: 400 })
    }

    // Forward Range header for video streaming
    const range = req.headers.get('range') || undefined
    const upstream = await fetch(src, {
      headers: range ? { Range: range } : undefined,
      // Telegram/Yandex usually allow GET without cookies
      redirect: 'follow',
    })

    const headers = new Headers()
    // Pass through important media headers
    const ct = upstream.headers.get('content-type') || 'application/octet-stream'
    headers.set('Content-Type', ct)
    const cl = upstream.headers.get('content-length')
    if (cl) headers.set('Content-Length', cl)
    const cr = upstream.headers.get('content-range')
    if (cr) headers.set('Content-Range', cr)
    const ar = upstream.headers.get('accept-ranges')
    if (ar) headers.set('Accept-Ranges', ar)

    // Cache a bit to reduce load (adjust as you like)
    headers.set('Cache-Control', 'public, max-age=3600')

    return new Response(upstream.body, { status: upstream.status, headers })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}