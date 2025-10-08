// app/api/telegram/webhook/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { sendMessage, getFile } from '@/src/lib/telegramApi'

const SITE = process.env.PUBLIC_SITE_URL || 'https://uzvideohub.vercel.app'
const ADMIN_TELEGRAM_IDS = (process.env.ADMIN_TELEGRAM_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

function largestPhoto(photos: any[] | undefined) {
  if (!Array.isArray(photos) || photos.length === 0) return null
  return photos.reduce((a, b) => ((a.width || 0) * (a.height || 0) > (b.width || 0) * (b.height || 0) ? a : b))
}

function webAppBtn(url: string) {
  return { reply_markup: { inline_keyboard: [[{ text: 'UzvideoHub — veb ilovani oching', web_app: { url } }]] } }
}

export async function POST(req: Request) {
  try {
    const update = await req.json()
    const msg = update.message || update.channel_post || update.edited_message
    if (!msg?.chat?.id) return NextResponse.json({ ok: true })

    const chatId = msg.chat.id as number
    const fromId = String(msg.from?.id || '')
    const isAdmin = ADMIN_TELEGRAM_IDS.includes(fromId)
    const text = (msg.text || '').trim()

    // Always respond to /start with the WebApp button (pass ref if present)
    if (text.startsWith('/start')) {
      const m = text.match(/^\/start\s+ref_(\S+)/)
      const code = m?.[1]
      const url = code ? `${SITE}/tg?ref=${encodeURIComponent(code)}` : `${SITE}/tg`
      await sendMessage(chatId, 'UzvideoHub — veb ilovani oching', webAppBtn(url))
      return NextResponse.json({ ok: true })
    }

    // Media handling:
    const video = msg.video || (msg.document?.mime_type?.startsWith?.('video/') ? msg.document : null)
    const photo = largestPhoto(msg.photo) || (msg.document?.mime_type?.startsWith?.('image/') ? msg.document : null)

    if (video?.file_id || photo?.file_id) {
      if (isAdmin) {
        const fileId = (video || photo).file_id as string
        try {
          const f = await getFile(fileId)
          const isVid = !!video
          const reply =
`${isVid ? '🎞 Video' : '🖼 Rasm'} aniqlandi.
file_id: ${fileId}

To‘g‘ridan havola:
${f.url}

👉 Admin panel:
• ${isVid ? '"Video URL"' : '"Poster/thumbnail URL"'} maydoniga quyidagidan birini qo‘ying:
   - file_id:${fileId}  (tavsiya etiladi)
   - ${f.url}  (ham ishlaydi)`
          await sendMessage(chatId, reply)
        } catch (e: any) {
          await sendMessage(chatId, `❌ Faylni olishda xatolik: ${String(e?.message || e)}`)
        }
      } else {
        await sendMessage(chatId, 'UzvideoHub — veb ilovani oching', webAppBtn(`${SITE}/tg`))
      }
      return NextResponse.json({ ok: true })
    }

    // /help → just show button (no extra spam)
    if (text === '/help') {
      await sendMessage(chatId, 'UzvideoHub — veb ilovani oching', webAppBtn(`${SITE}/tg`))
      return NextResponse.json({ ok: true })
    }

    // Default: be silent
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Webhook error', e)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
