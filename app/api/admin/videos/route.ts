// app/api/admin/videos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { Prisma } from '@prisma/client'

/** Helper to send JSON errors with details */
function jErr(message: string, details?: any, status = 400) {
  return NextResponse.json({ ok: false, error: message, details }, { status })
}

function isHttpUrl(v?: string | null) {
  if (!v) return false
  try {
    const u = new URL(v)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
function isTelegramFileId(v?: string | null) {
  if (!v) return false
  // Anything that is NOT http(s) and looks like a tg file_id token
  return !/^https?:\/\//i.test(v) && /^[A-Za-z0-9_\-:]{10,}$/.test(v)
}

export async function POST(req: NextRequest) {
  try {
    // --- 1) Admin check (adapt if your /api/me differs) --------------------
    const meUrl = new URL('/api/me', req.url)
    const meRes = await fetch(meUrl.toString(), {
      headers: { cookie: req.headers.get('cookie') || '' },
      cache: 'no-store',
      redirect: 'manual',
    }).catch(() => null)
    const meJson = await meRes?.json().catch(() => ({} as any))
    const isAdmin = Boolean(meRes?.ok && meJson?.ok && meJson?.user?.isAdmin)
    if (!isAdmin) return jErr('Faqat admin video qo‘sha oladi', undefined, 403)

    // --- 2) Parse & validate input ----------------------------------------
    const body = await req.json().catch(() => ({}))
    const {
      code,
      title,
      description = '',
      thumbUrl,
      category,
      tags,
      url,
      isFree = false,
      price,
    } = body || {}

    if (!title || !String(title).trim()) {
      return jErr('Validatsiya xatosi: "Sarlavha" kiritilishi shart', { field: 'title' })
    }
    if (!url || !String(url).trim()) {
      return jErr('Validatsiya xatosi: "Video URL yoki file_id" kiritilishi shart', { field: 'url' })
    }

    const videoUrlOk = isHttpUrl(url) || isTelegramFileId(url)
    if (!videoUrlOk) {
      return jErr(
        'Validatsiya xatosi: "Video URL yoki file_id" noto‘g‘ri. https havola yoki Telegram file_id bo‘lishi kerak.',
        { field: 'url', received: url }
      )
    }

    if (thumbUrl) {
      const thumbOk = isHttpUrl(thumbUrl) || isTelegramFileId(thumbUrl)
      if (!thumbOk) {
        return jErr(
          'Validatsiya xatosi: "Poster URL yoki file_id" noto‘g‘ri. https havola yoki Telegram file_id bo‘lishi kerak.',
          { field: 'thumbUrl', received: thumbUrl }
        )
      }
    }

    const normalizedPrice = isFree ? 0 : Number(price ?? 0)
    if (!isFree && (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0)) {
      return jErr('Validatsiya xatosi: Pullik video uchun "Narx" > 0 bo‘lishi kerak', {
        field: 'price',
        received: price,
      })
    }

    const normalizedTags: string[] = Array.isArray(tags)
      ? (tags as string[]).map(s => String(s).trim()).filter(Boolean)
      : String(tags || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)

    // --- 3) Create in DB ---------------------------------------------------
    try {
      const created = await prisma.video.create({
        data: {
          code: code ? String(code).trim() : null,
          title: String(title).trim(),
          description: String(description || '').trim(),
          thumbUrl: thumbUrl ? String(thumbUrl).trim() : null,
          category: category ? String(category).trim() : null,
          tags: normalizedTags,
          url: String(url).trim(),
          isFree: Boolean(isFree),
          price: normalizedPrice,
        },
      })
      return NextResponse.json({ ok: true, item: created })
    } catch (e: any) {
      // Prisma known error handling
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint (e.g., duplicate code)
        if (e.code === 'P2002') {
          const target = (e.meta?.target as string[])?.join(', ') || 'unique field'
          return jErr('Ushbu qiymat oldin ishlatilgan. Iltimos, boshqasini kiriting.', {
            code: e.code,
            target,
          })
        }
        // Value too long, etc.
        if (e.code === 'P2000') {
          return jErr('Maydon qiymati juda uzun yoki noto‘g‘ri.', { code: e.code, meta: e.meta })
        }
      }
      // Unknown DB/server error → return detailed payload for admin to see
      return jErr('Server xatosi: bazaga yozishda muammo yuz berdi', {
        name: e?.name,
        message: e?.message,
      }, 500)
    }
  } catch (e: any) {
    // Top-level catch (JSON parse or unexpected)
    return jErr('Server error while creating video', { message: String(e?.message || e) }, 500)
  }
}