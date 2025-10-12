// app/api/proxy-media/route.ts
import { NextRequest } from 'next/server'

/**
 * This route proxies:
 *  - /api/proxy-media?src=https://...   (direct https url)
 *  - /api/proxy-media?file_id=XXXX      (Telegram file_id)
 *
 * It resolves Telegram file_id -> file_path via getFile,
 * forwards Range headers, and streams the response with proper
 * status/headers so <video> can play.
 */

export const dynamic = 'force-dynamic' // ensure no static caching on Vercel

// --- tiny helpers ------------------------------------------------------------
function bad(status: number, message: string) {
  return new Response(message, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
function isHttpUrl(v?: string | null) {
  if (!v) return false
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

async function tgGetFilePath(fileId: string): Promise<string | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return null
  const u = new URL(`https://api.telegram.org/bot${token}/getFile`)
  u.searchParams.set('file_id', fileId)

  const r = await fetch(u.toString(), { method: 'GET', cache: 'no-store' })
  if (!r.ok) return null
  const j = await r.json().catch(() => null) as any
  const path = j?.result?.file_path
  return typeof path === 'string' && path.length ? path : null
}

function buildTgFileUrl(filePath: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN!
  return `https://api.telegram.org/file/bot${token}/${filePath}`
}

// --- main handler ------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const fullUrl = req.url.startsWith('http')
      ? req.url
      : `${req.headers.get('x-forwarded-proto') || 'https'}://${req.headers.get('host')}${req.url}`
    const { searchParams } = new URL(fullUrl)

    const src = searchParams.get('src')
    const fileId = searchParams.get('file_id')

    let target: string | null = null

    if (fileId) {
      const path = await tgGetFilePath(fileId)
      if (!path) return bad(400, 'file_id resolve failed')
      target = buildTgFileUrl(path)
    } else if (src && isHttpUrl(src)) {
      target = src
    } else {
      return bad(400, 'missing or invalid src/file_id')
    }

    // Forward Range (important for <video>)
    const headers: Record<string, string> = {
      // Fake a normal browser UA — Telegram sometimes 401s otherwise
      'user-agent':
        req.headers.get('user-agent') ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      // Some CDNs require a referer; keep it light/safe
      'referer': req.headers.get('referer') || 'https://vercel.app/',
    }
    const range = req.headers.get('range')
    if (range) headers['range'] = range

    // Stream fetch
    const upstream = await fetch(target, {
      method: 'GET',
      headers,
      cache: 'no-store',
      redirect: 'follow',
    })

    // If Telegram threw an HTML 401 page, surface its text for easier debugging
    const status = upstream.status
    const outHeaders = new Headers()

    // Copy important headers
    const copyList = [
      'content-type',
      'content-length',
      'accept-ranges',
      'content-range',
      'etag',
      'last-modified',
      'cache-control',
    ]
    for (const k of copyList) {
      const v = upstream.headers.get(k)
      if (v) outHeaders.set(k, v)
    }

    // Always allow our client to fetch
    outHeaders.set('access-control-allow-origin', '*')
    outHeaders.set('access-control-expose-headers', 'Content-Range, Accept-Ranges, Content-Length')
    // Avoid buffering on some platforms
    outHeaders.set('x-accel-buffering', 'no')

    // If it’s clearly HTML, read text and return as 502 with snippet
    const ct = upstream.headers.get('content-type') || ''
    if (!upstream.ok && ct.includes('text/html')) {
      const text = await upstream.text()
      return new Response(`Upstream error ${status}\n\n${text.slice(0, 500)}`, {
        status: 502,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      })
    }

    // Stream body directly
    return new Response(upstream.body, {
      status,
      headers: outHeaders,
    })
  } catch (e: any) {
    return bad(500, `proxy error: ${String(e?.message || e)}`)
  }
}