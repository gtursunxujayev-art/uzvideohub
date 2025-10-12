// app/api/proxy-media/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * Supports:
 *   /api/proxy-media?src=https://example.com/file.jpg
 *   /api/proxy-media?file_id=BAACAgIA.... (Telegram file_id)
 *
 * For file_id, we call getFile and 302-redirect to Telegram's file URL.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const direct = url.searchParams.get('src')
    const fileId = url.searchParams.get('file_id')
    const type = url.searchParams.get('type') || '' // optional (thumb/video) – not required

    if (direct) {
      // Just redirect to the direct URL so the browser loads it
      return NextResponse.redirect(direct)
    }

    if (fileId) {
      const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN
      if (!token) {
        return NextResponse.json({ ok: false, error: 'Missing TELEGRAM_BOT_TOKEN' }, { status: 500 })
      }

      // 1) Resolve file_id -> file_path
      const api = `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`
      const res = await fetch(api, { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok || !data?.result?.file_path) {
        const msg = data?.description || 'getFile failed'
        return NextResponse.json({ ok: false, error: msg }, { status: 502 })
      }

      // 2) Build downloadable file URL and redirect
      const filePath = data.result.file_path as string
      const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`
      return NextResponse.redirect(fileUrl)
    }

    return NextResponse.json({ ok: false, error: 'Missing src or file_id' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}