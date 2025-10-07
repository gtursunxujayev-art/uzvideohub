// app/api/telegram/manage/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { setWebhook, deleteWebhook } from '@/src/lib/telegramApi'

const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || ''
const SITE = process.env.PUBLIC_SITE_URL || ''

export async function POST(req: Request) {
  const { action } = await req.json()

  if (action === 'set') {
    if (!SITE) return NextResponse.json({ ok: false, error: 'Missing PUBLIC_SITE_URL' }, { status: 400 })
    const webhookUrl = `${SITE}/api/telegram/webhook`
    const result = await setWebhook(webhookUrl, SECRET || undefined)
    return NextResponse.json({ ok: true, result, webhookUrl })
  }
  if (action === 'delete') {
    const result = await deleteWebhook()
    return NextResponse.json({ ok: true, result })
  }
  return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
}
