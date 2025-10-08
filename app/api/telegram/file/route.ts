// app/api/telegram/file/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN as string
if (!TOKEN) console.warn('Missing TELEGRAM_BOT_TOKEN')

const BOT_API = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : ''
const FILE_API = TOKEN ? `https://api.telegram.org/file/bot${TOKEN}` : ''

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
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) return res
      hops++
      if (hops > maxHops) return res
      current = new URL(loc, current).toString()
      continue
    }
    return res
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const file_id = searchParams.get('file_id') || ''
    if (!file_id) return NextResponse.json({ ok: false, error: 'file_id required' }, { status: 400 })
    if (!TOKEN) return NextResponse.json({ ok: false, error: 'Server missing TELEGRAM_BOT_TOKEN' }, { status: 500 })

    // 1) Resolve file_id -> file_path
    const infoRes = await fetch(`${BOT_API}/getFile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id }),
    })
    const infoJson = await infoRes.json()
    if (!infoJson.ok || !infoJson.result?.file_path) {
      return NextResponse.json({ ok: false, error: infoJson.description || 'getFile failed' }, { status: 404 })
    }

    const filePath: string = infoJson.result.file_path
    const fileUrl = `${FILE_API}/${filePath}`

    // 2) Stream with Range + CORS
    const range = req.headers.get('range') || undefined
    const upstream = await follow(fileUrl, range)

    const headers = new Headers()
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin')
    headers.set('Accept-Ranges', upstream.headers.get('accept-ranges') || 'bytes')
    headers.set('Cache-Control', 'public, max-age=600')

    const ct = upstream.headers.get('content-type') || guessContentType(fileUrl)
    if (ct) headers.set('Content-Type', ct)

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
