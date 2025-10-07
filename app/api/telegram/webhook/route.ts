// app/api/telegram/webhook/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { sendMessage } from '@/src/lib/telegramApi'

const SITE = process.env.PUBLIC_SITE_URL || 'https://uzvideohub.vercel.app'

export async function POST(req: Request) {
  try {
    const update = await req.json()

    const message = update.message || update.edited_message
    if (message?.chat?.id) {
      const chatId = message.chat.id as number
      const text = (message.text || '').trim()

      if (text === '/start' || text.startsWith('/start')) {
        // ✅ Inline keyboard with web_app (opens INSIDE Telegram)
        await sendMessage(chatId, 'Welcome to uzvideohub — open the app:', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Open uzvideohub', web_app: { url: `${SITE}/tg` } }],
            ],
          },
        })
      } else if (text === '/help') {
        await sendMessage(
          chatId,
          `Commands:
/start — open the app
/help — this help

Tip: use the top-right “Open” button to launch inside Telegram.`
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
