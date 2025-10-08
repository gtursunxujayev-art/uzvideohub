// app/api/telegram/resolve/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getFile } from '@/src/lib/telegramApi'

/**
 * GET /api/telegram/resolve?file_id=<FILE_ID>
 * -> { ok:true, url:"https://api.telegram.org/file/bot<TOKEN>/<file_path>" }
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const file_id = searchParams.get('file_id')
    if (!file_id) return NextResponse.json({ ok: false, error: 'file_id required' }, { status: 400 })

    const file = await getFile(file_id)
    return NextResponse.json({ ok: true, url: file.url })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
