// app/api/telegram/webhook/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { sendMessage, getFile } from '@/src/lib/telegramApi'

const SITE = process.env.PUBLIC_SITE_URL || 'https://uzvideohub.vercel.app'

export async function POST(req: Request) {
  try {
    const update = await req.json()
    const msg = update.message || update.channel_post

    if (msg?.chat?.id) {
      const chatId = msg.chat.id as number
      const text = (msg.text || '').trim()

      // 1) If you forward a VIDEO to the bot → it returns a direct URL
      const video = msg.video || msg.document // some clients send mp4 as "document"
      if (video?.file_id) {
        try {
          const f = await getFile(video.file_id)
          await sendMessage(chatId,
            `✅ Video link (paste this into "Video URL"):\n${f.url}\n\n` +
            `Preview:\n${f.url}`,
          )
        } catch (e: any) {
          await sendMessage(chatId, `❌ Failed to resolve video: ${String(e?.message || e)}`)
        }
        return NextResponse.json({ ok: true })
      }

      // 2) Command: /resolve <file_id>
      if (text.startsWith('/resolve')) {
        const parts = text.split(/\s+/)
        const fid = parts[1]
        if (!fid) {
          await sendMessage(chatId, 'Usage: /resolve <file_id>')
        } else {
          try {
            const f = await getFile(fid)
            await sendMessage(chatId, `✅ Direct file URL:\n${f.url}`)
          } catch (e: any) {
            await sendMessage(chatId, `❌ Failed: ${String(e?.message || e)}`)
          }
        }
        return NextResponse.json({ ok: true })
      }

      // 3) Normal start/help
      if (text === '/start' || text.startsWith('/start')) {
        await sendMessage(chatId, 'uzvideohub — veb-ilovani oching:', {
          reply_markup: { inline_keyboard: [[{ text: 'Uzvideohub', web_app: { url: `${SITE}/tg` } }]] },
        })
        return NextResponse.json({ ok: true })
      }

      if (text === '/help') {
        await sendMessage(chatId, `Commands:
/start — open the app
/help — help
/resolve <file_id> — get direct URL
Forward a video here — I’ll reply with a direct link.`)
        return NextResponse.json({ ok: true })
      }

      // default
      await sendMessage(chatId, 'Forward a video here — I’ll reply with a direct link.')
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
