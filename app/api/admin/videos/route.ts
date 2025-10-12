// app/api/admin/videos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma' // ← uses your alias "@/src/*"

function err(message: string, details?: any, status = 400) {
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
function isTgFileId(v?: string | null) {
  if (!v) return false
  return !/^https?:\/\//i.test(v) && /^[A-Za-z0-9_-]{10,}$/.test(v)
}

export async function POST(req: NextRequest) {
  try {
    // minimal admin check via /api/me (adapt to your auth if needed)
    const meR = await fetch(new URL('/api/me', req.url).toString(), {
      headers: req.headers,
      cache: 'no-store',
    }).catch(() => null)
    const meJ = await meR?.json().catch(() => ({} as any))
    if (!meR?.ok || !meJ?.ok || !meJ?.user?.isAdmin) {
      return err('Only admin can create videos', undefined, 403)
    }

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
      return err('Validation error: "title" is required', { field: 'title' })
    }
    if (!url || !String(url).trim()) {
      return err('Validation error: "url" (video) is required', { field: 'url' })
    }

    const urlOk = isHttpUrl(url) || isTgFileId(url)
    if (!urlOk) {
      return err('Validation error: "url" must be an https link or a Telegram file_id', {
        field: 'url',
        received: url,
      })
    }

    if (thumbUrl) {
      const thumbOk = isHttpUrl(thumbUrl) || isTgFileId(thumbUrl)
      if (!thumbOk) {
        return err('Validation error: "thumbUrl" must be an https link or a Telegram file_id', {
          field: 'thumbUrl',
          received: thumbUrl,
        })
      }
    }

    const p = isFree ? 0 : Number(price ?? 0)
    if (!isFree && (!Number.isFinite(p) || p <= 0)) {
      return err('Validation error: "price" must be > 0 for paid videos', {
        field: 'price',
        received: price,
      })
    }

    const created = await prisma.video.create({
      data: {
        code: code ? String(code) : null,
        title: String(title).trim(),
        description: String(description || '').trim(),
        thumbUrl: thumbUrl ? String(thumbUrl).trim() : null,
        category: category ? String(category).trim() : null,
        tags: Array.isArray(tags)
          ? (tags as string[]).map(s => String(s).trim()).filter(Boolean)
          : String(tags || '')
              .split(',')
              .map(s => s.trim())
              .filter(Boolean),
        url: String(url).trim(),
        isFree: Boolean(isFree),
        price: p,
      },
    })

    return NextResponse.json({ ok: true, item: created })
  } catch (e: any) {
    return err('Server error while creating video', { message: String(e?.message || e) }, 500)
  }
}