// app/page.tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Video = {
  id: number
  title: string
  description: string
  url: string
  isFree: boolean
  price: number
  thumbUrl?: string | null
  category?: string | null
  tags?: string[]
}

function isYandexLink(u?: string | null) {
  const s = u || ''
  return s.includes('disk.yandex') || s.includes('yadi.sk')
}
function isTgFileUrl(u?: string | null) {
  const s = u || ''
  return s.includes('api.telegram.org/file') || s.includes('telegram-cdn.org')
}
function extractFileId(val?: string | null): string | null {
  if (!val) return null
  let s = val.trim()
  if (s.startsWith('file_id:')) s = s.slice('file_id:'.length)
  if (!s.includes('://') && s.length > 30) return s
  return null
}
async function resolveYandexPublic(link: string): Promise<string> {
  try {
    const r = await fetch(`/api/yandex/resolve?url=${encodeURIComponent(link)}`)
    const j = await r.json()
    if (j?.ok && j?.href) return j.href as string
  } catch {}
  return link
}
function toThumbSrc(input?: string | null): Promise<string> | string {
  if (!input) return ''
  const fid = extractFileId(input)
  if (fid) return `/api/telegram/file?file_id=${encodeURIComponent(fid)}`
  if (isYandexLink(input)) return resolveYandexPublic(input)
  // Telegram direct URL is also fine for <img>/background
  return input
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([])
  const [thumbs, setThumbs] = useState<Record<number, string>>({})
  const [err, setErr] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/videos')
        if (!r.ok) throw new Error('API /api/videos failed')
        const j: Video[] = await r.json()
        setVideos(j || [])

        // resolve thumbnails
        const out: Record<number, string> = {}
        await Promise.all(
          (j || []).map(async (v) => {
            const t = await toThumbSrc(v.thumbUrl || '')
            out[v.id] = t || ''
          })
        )
        setThumbs(out)
      } catch (e: any) {
        setErr(String(e?.message || e))
      }
    })()
  }, [])

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: 24, marginBottom: 12 }}>Yangi videolar</h1>
      {err ? <div style={{ color: '#ff6f6f', marginBottom: 12 }}>Xatolik: {err}</div> : null}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {videos.map((v) => (
          <Link key={v.id} href={`/video/${v.id}`} style={{ background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 12, display: 'block' }}>
            <div
              style={{
                height: 140,
                borderRadius: 8,
                marginBottom: 8,
                background: 'rgba(0,0,0,0.35)',
                backgroundImage: thumbs[v.id] ? `url(${thumbs[v.id]})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
              {v.isFree || v.price === 0 ? (
                <span style={{ fontSize: 12, opacity: 0.85 }}>Bepul</span>
              ) : (
                <span style={{ fontSize: 12, color: '#ff9900', border: '1px solid #ff9900', borderRadius: 6, padding: '2px 6px' }}>
                  Pullik · {v.price} tanga
                </span>
              )}
              {v.category ? (
                <span style={{ fontSize: 11, opacity: 0.75, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '2px 6px' }}>
                  {v.category}
                </span>
              ) : null}
            </div>
            <div style={{ fontWeight: 700 }}>{v.title}</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{v.description}</div>
            {v.tags?.length ? <div style={{ fontSize: 11, opacity: 0.65, marginTop: 6 }}>#{v.tags.join(' #')}</div> : null}
          </Link>
        ))}
        {!videos.length && !err ? (
          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              height: 180,
              borderRadius: 12,
              display: 'grid',
              placeItems: 'center',
              opacity: 0.7,
            }}
          >
            Hozircha video yo‘q — /admin orqali qo‘shing
          </div>
        ) : null}
      </div>
    </div>
  )
}
