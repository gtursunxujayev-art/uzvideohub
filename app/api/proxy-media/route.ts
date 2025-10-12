// app/api/proxy-media/route.ts
import { NextRequest, NextResponse } from 'next/server'

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status })
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const src = searchParams.get('src')?.trim()
    const fileId = searchParams.get('file_id')?.trim()
    const BOT = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN

    if (!src && !fileId) return bad('Provide ?src=https://… or ?file_id=XXXX')

    // Case A: raw https URL — just redirect
    if (src) {
      try {
        const u = new URL(src)
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          return bad('src must be http(s) URL')
        }
      } catch {
        return bad('src is not a valid URL')
      }
      return NextResponse.redirect(src, 302)
    }

    // Case B: Telegram file_id
    if (!BOT) return bad('Server missing TELEGRAM_BOT_TOKEN', 500)

    // Resolve file_id -> file_path
    const r = await fetch(
      `https://api.telegram.org/bot${BOT}/getFile?file_id=${encodeURIComponent(fileId!)}`
    )
    const j = await r.json().catch(() => ({} as any))
    if (!r.ok || !j?.ok || !j?.result?.file_path) {
      const reason = j?.description || `getFile failed (status ${r.status})`
      return bad(`Telegram getFile error: ${reason}`)
    }
    const direct = `https://api.telegram.org/file/bot${BOT}/${j.result.file_path}`

    // 302 redirect to Telegram CDN
    return NextResponse.redirect(direct, 302)
  } catch (e: any) {
    return bad(String(e?.message || e), 500)
  }
}