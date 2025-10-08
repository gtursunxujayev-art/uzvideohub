// app/api/proxy-media/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

/**
 * Proxies remote media with Range support + permissive CORS so <video> can play it.
 * Usage: /api/proxy-media?src=<encoded-absolute-url>
 */
const ALLOWED_HOSTS = [
  'api.telegram.org',
  'telegram.org',
  'telegram-cdn.org',
  'cdn1.telegram-cdn.org',
  'cdn2.telegram-cdn.org',
  'cdn3.telegram-cdn.org',
  'cdn4.telegram-cdn.org',
  'downloader.disk.yandex.ru',
  'disk.yandex.ru',
  'disk.yandex.com',
  'yadi.sk',
]

function isAllowed(urlStr: string) {
  try {
    const u = new URL(urlStr)
    return ALLOWED_HOSTS.some(h => u.hostname.endsWith(h))
  } catch {
    return false
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const src = searchParams.get('src') || ''
    if (!src) return NextResponse.json({ ok: false, error: 'src required' }, { status: 400 })
    if (!isAllowed(src)) return NextResponse.json({ ok: false, error: 'host not allowed' }, { status: 400 })

    const range = (req.headers.get('range') || undefined)
    const upstream = await fetch(src, {
      method: 'GET',
      headers: range ? { Range: range } : undefined,
    })

    // Build a streaming response with important media headers passed through
    const headers = new Headers()
    // Always allow cross-origin media use
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Accept-Ranges', upstream.headers.get('accept-ranges') || 'bytes')

    const ct = upstream.headers.get('content-type')
    if (ct) headers.set('Content-Type', ct)

    const cl = upstream.headers.get('content-length')
    if (cl) headers.set('Content-Length', cl)

    const cr = upstream.headers.get('content-range')
    if (cr) headers.set('Content-Range', cr)

    const disp = upstream.headers.get('content-disposition')
    if (disp) headers.set('Content-Disposition', disp)

    // modest caching for CDN-backed files
    headers.set('Cache-Control', 'public, max-age=600')

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
