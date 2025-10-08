// app/api/telegram/webhook/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { sendMessage, getFile } from '@/src/lib/telegramApi'

const SITE = process.env.PUBLIC_SITE_URL || 'https://uzvideohub.vercel.app'

function largestPhoto(photos: any[] | undefined) {
  if (!Array.isArray(photos) || photos.length === 0) return null
  return photos.reduce((a, b) => ((a.width || 0) * (a.height || 0) > (b.width || 0) * (b.height || 0) ? a : b))
}

export async function POST(req: Request) {
  try {
    const update = await req.json()
    const msg = update.message || update.channel_post || update.edited_message
    if (!msg?.chat?.id) return NextResponse.json({ ok: true })

    const chatId = msg.chat.id as number
    const text = (msg.text || '').trim()

    // 1) If VIDEO sent/forwarded -> reply with file_id + direct URL
    const asVideo = msg.video || (msg.document?.mime_type?.startsWith?.('video/') ? msg.document : null)
    if (asVideo?.file_id) {
      try {
        const f = await getFile(asVideo.file_id)
        await sendMessage(
          chatId,
          [
            '🎞 Video aniqlangan.',
            `file_id: \`${asVideo.file_id}\``,
            '',
            'To‘g‘ridan havola (video uchun):',
            `${f.url}`,
            '',
            '👉 Admin panelda “Video URL” maydoniga quyidagilardan birini qo‘ying:',
            '- `file_id:...`  (tavsiya etiladi, eng barqaror)',
            `- ${f.url}  (ham ishlaydi)`,
          ].join('\n'),
          { parse_mode: 'Markdown' }
        )
      } catch (e: any) {
        await sendMessage(chatId, `❌ Video aniqlashda xatolik: ${String(e?.message || e)}`)
      }
      return NextResponse.json({ ok: true })
    }

    // 2) If PHOTO sent/forwarded -> reply with file_id + direct URL (for thumbnails/posters)
    const p = largestPhoto(msg.photo)
    const asImageDoc = msg.document?.mime_type?.startsWith?.('image/') ? msg.document : null
    const photoLike = p || asImageDoc
    if (photoLike?.file_id) {
      try {
        const f = await getFile(photoLike.file_id)
        await sendMessage(
          chatId,
          [
            '🖼 Rasm aniqlangan.',
            `file_id: \`${photoLike.file_id}\``,
            '',
            'To‘g‘ridan havola (poster/thumbnail uchun):',
            `${f.url}`,
            '',
            '👉 Admin panelda “Poster/thumbnail URL” maydoniga quyidagilardan birini qo‘ying:',
            '- `file_id:...`  (tavsiya etiladi, eng barqaror)',
            `- ${f.url}  (ham ishlaydi)`,
          ].join('\n'),
          { parse_mode: 'Markdown' }
        )
      } catch (e: any) {
        await sendMessage(chatId, `❌ Rasm aniqlashda xatolik: ${String(e?.message || e)}`)
      }
      return NextResponse.json({ ok: true })
    }

    // 3) Commands
    if (text === '/start' || text.startsWith('/start')) {
      await sendMessage(chatId, 'uzvideohub — veb-ilovani oching:', {
        reply_markup: { inline_keyboard: [[{ text: 'Uzvideohub', web_app: { url: `${SITE}/tg` } }]] },
      })
      return NextResponse.json({ ok: true })
    }

    if (text === '/help') {
      await sendMessage(
        chatId,
        [
          'Yordam:',
          '— Videoni yoki rasmini shu botga yuboring/forward qiling — men sizga `file_id` va to‘g‘ridan havolani beraman.',
          '— Admin panelda:',
          '   • Video URL: `file_id:XXXX` YOKI to‘g‘ridan havola',
          '   • Poster URL: `file_id:XXXX` YOKI to‘g‘ridan havola',
          '',
          'Eslatma: t.me/<kanal>/<msg> havolasi orqali faylni olish imkoni yo‘q.',
          'Kanal postidan fayl olish uchun — xabarni botga forward qiling (yoki botni kanalga admin qilib qo‘ying va forward qiling).',
        ].join('\n')
      )
      return NextResponse.json({ ok: true })
    }

    // 4) Default hint
    await sendMessage(chatId, 'Rasm yoki videoni yuboring/forward qiling — men sizga `file_id` va havolani yuboraman.')

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Webhook error', e)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
