// app/api/telegram/webhook/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { sendMessage } from '@/src/lib/telegramApi'

const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || ''
const SITE = process.env.PUBLIC_SITE_URL || 'https://example.com'

export async function POST(req: Request) {
  try {
    // Verify secret header from Telegram
    const header = req.headers.get('x-telegram-bot-api-secret-token') || ''
    if (!SECRET || header !== SECRET) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    const update = await req.json()

    // Handle messages
    const message = update.message || update.edited_message
    if (message?.chat?.id) {
      const chatId = message.chat.id as number
      const text = (message.text || '').trim()

      if (text === '/start' || text.startsWith('/start')) {
        // WebApp keyboard opens /tg inside Telegram
        await sendMessage(chatId, 'Welcome to uzvideohub! Tap to open:', {
          reply_markup: {
            keyboard: [
              [
                {
                  text: 'Open uzvideohub',
                  web_app: { url: `${SITE}/tg` },
                },
              ],
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

Tip: Tap "Open uzvideohub" to sign in and watch videos.`
        )
      } else {
        await sendMessage(chatId, 'Send /start to open the app.')
      }
    }

    // Optionally handle callback_query / web_app_data, etc.
    // const cbq = update.callback_query
    // const wad = update.web_app_data

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Webhook error', e)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

// Telegram requires a fast 200 OK on GET too (for some verifiers)
export async function GET() {
  return NextResponse.json({ ok: true })
}
