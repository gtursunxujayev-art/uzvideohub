// app/api/telegram/webhook/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { sendMessage } from '@/src/lib/telegramApi'

const SITE = process.env.PUBLIC_SITE_URL || 'https://uzvideohub.vercel.app'

export async function POST(req: Request) {
  try {
    // ✅ No secret validation at all
    const update = await req.json()

    // Handle messages
    const message = update.message || update.edited_message
    if (message?.chat?.id) {
      const chatId = message.chat.id as number
      const text = (message.text || '').trim()

      if (text === '/start' || text.startsWith('/start')) {
        await sendMessage(chatId, 'Welcome to uzvideohub! Tap to open:', {
          reply_markup: {
            keyboard: [
              [{ text: 'Open uzvideohub', web_app: { url: `${SITE}/tg` } }],
            ],
            resize_keyboard: true,
            one_time_keyboard: false,
          },
        })
      } else if (text === '/help') {
        await sendMessage(
          chatId,
          `Commands:
/start — show WebApp button
/help — this help

Tap "Open uzvideohub" to sign in and watch videos.`
        )
      } else {
        await sendMessage(chatId, 'Send /start to open the app.')
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Webhook error', e)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
