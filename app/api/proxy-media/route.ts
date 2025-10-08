// app/api/proxy-media/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

/**
 * Stream-proxy for remote media with:
 * - Manual redirect following
 * - Range passthrough (byte seeking)
 * - CORS enabled for <video>/<img>
 * - Content-Type fallback by file extension
 *
 * Usage:
 *   /api/proxy-media?src=<encoded-absolute-url>
 */

const ALLOWED_HOSTS = [
  'api.telegram.org',
  'telegram-cdn.org',
  'cdn1.telegram-cdn.org',
  'cdn2.telegram-cdn.org',
  'cdn3.telegram-cdn.org',
  'cdn4.telegram-cdn.org',
  'cloud-api.yandex.net',
  'downloader.disk.yandex.ru',
  'disk.yandex.ru',
  'disk.yandex.com',
  'yadi.sk',
]

function isAllowed(urlStr: string) {
  try {
    const u = new URL(urlStr)
    return ALLOWED_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}

function guessContentType(urlStr: string): string | undefined {
  const path = urlStr.split('?')[0].toLowerCase()
  if (path.endsWith('.mp4')) return 'video/mp4'
  if (path.endsWith('.webm')) return 'video/webm'
  if (path.endsWith('.mov')) return 'video/quicktime'
  if (path.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl'
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg'
  if (path.endsWith('.png')) return 'image/png'
  if (path.endsWith('.gif')) return 'image/gif'
  return undefined
}

async function follow(urlStr: string, rangeHeader?: string, maxHops = 3): Promise<Response> {
  let current = urlStr
  let hops = 0
  while (true) {
    const res = await fetch(current, {
      method: 'GET',
      headers: rangeHeader ? { Range: rangeHeader } : undefined,
      redirect: 'manual',
    })

    // 3xx manual redirect
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) return res
      hops++
      if (hops > maxHops) return res
      const next = new URL(loc, current).toString()
      current = next
      // next loop iteration will re-fetch
      continue
    }

    return res
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const src = searchParams.get('src') || ''
    if (!src) return NextResponse.json({ ok: false, error: 'src required' }, { status: 400 })
    if (!isAllowed(src)) return NextResponse.json({ ok: false, error: 'host not allowed' }, { status: 400 })

    const range = req.headers.get('range') || undefined

    const upstream = await follow(src, range)

    // Prepare response headers
    const headers = new Headers()
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin')
    headers.set('Accept-Ranges', upstream.headers.get('accept-ranges') || 'bytes')
    headers.set('Cache-Control', 'public, max-age=600')

    // Content-Type: prefer upstream, else guess by extension
    const ct = upstream.headers.get('content-type') || guessContentType(src)
    if (ct) headers.set('Content-Type', ct)

    // Pass through useful headers if present
    const cl = upstream.headers.get('content-length')
    if (cl) headers.set('Content-Length', cl)

    const cr = upstream.headers.get('content-range')
    if (cr) headers.set('Content-Range', cr)

    const disp = upstream.headers.get('content-disposition')
    if (disp) headers.set('Content-Disposition', disp)

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
