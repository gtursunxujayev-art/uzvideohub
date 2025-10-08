// app/video/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'

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
type Me = { user: { coins: number } | null }

function isYandexLink(url: string | null | undefined) {
  if (!url) return false
  return url.includes('disk.yandex') || url.includes('yadi.sk')
}
function isTelegramFileUrl(url: string | null | undefined) {
  if (!url) return false
  return url.includes('api.telegram.org/file') || url.includes('telegram-cdn.org')
}
// Detect a Telegram file_id entry
function extractFileId(val: string | null | undefined): string | null {
  if (!val) return null
  let s = val.trim()
  if (s.startsWith('file_id:')) s = s.slice('file_id:'.length)
  // file_id charset is base64-like with _ and -, length typically > 50
  if (!s.includes('://') && s.length > 30) return s
  return null
}

async function resolveYandex(url: string): Promise<string> {
  try {
    const r = await fetch(`/api/yandex/resolve?url=${encodeURIComponent(url)}`)
    const j = await r.json()
    if (j?.ok && j?.href) return j.href as string
  } catch {}
  return url
}

export default function VideoPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)

  const [video, setVideo] = useState<Video | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [status, setStatus] = useState<'idle' | 'playing' | 'needbuy' | 'free'>('idle')
  const [error, setError] = useState<string>('')

  const [playUrl, setPlayUrl] = useState<string>('')   // final src for <video>
  const [thumbUrl, setThumbUrl] = useState<string>('') // final poster src

  async function refreshMe() {
    try { const j = await fetch('/api/me').then((r) => r.json()); setMe(j) } catch {}
  }
  async function checkOwned(videoId: number) {
    try { const j = await fetch(`/api/purchase/check?videoId=${videoId}`).then((r) => r.json()); return !!j?.owned } catch { return false }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [vlist, meRes] = await Promise.all([
          fetch('/api/videos').then((r) => r.json()),
          fetch('/api/me').then((r) => r.json()),
        ])
        if (cancelled) return
        const v = (vlist as Video[]).find((x) => x.id === id) || null
        setVideo(v || null)
        setMe(meRes || null)
        if (!v) return

        // VIDEO SRC: order of handling
        // 1) Telegram file_id → our streaming endpoint
        const fid = extractFileId(v.url)
        if (fid) {
          setPlayUrl(`/api/telegram/file?file_id=${encodeURIComponent(fid)}`)
        } else {
          // 2) Yandex public page → resolve to direct href, still streamable
          let src = v.url
          if (isYandexLink(src)) src = await resolveYandex(src)
          if (isTelegramFileUrl(src)) {
            // if someone pasted a full telegram file URL, it may 404 later — but try it anyway via direct
            setPlayUrl(src) // our <video> can still play it if Telegram accepts
          } else {
            setPlayUrl(src)
          }
        }

        // POSTER/THUMB
        const tFid = extractFileId(v.thumbUrl || '')
        if (tFid) {
          setThumbUrl(`/api/telegram/file?file_id=${encodeURIComponent(tFid)}`)
        } else if (v.thumbUrl) {
          let poster = v.thumbUrl
          if (isYandexLink(poster)) poster = await resolveYandex(poster)
          setThumbUrl(poster)
        } else {
          setThumbUrl('')
        }

        // ACCESS
        if (v.isFree || v.price === 0) setStatus('free')
        else {
          const owned = await checkOwned(id)
          if (!cancelled) setStatus(owned ? 'playing' : 'needbuy')
        }
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || e))
      }
    })()
    return () => { cancelled = true }
  }, [id])

  async function buy() {
    try {
      const r = await fetch('/api/purchase', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: id }),
      })
      const j = await r.json()
      if (j.ok) { setStatus('playing'); await refreshMe() }
      else { alert(j.error || 'Xarid amalga oshmadi') }
    } catch (e: any) {
      alert(String(e?.message || e))
    }
  }

  if (!video) return <div>Yuklanmoqda...</div>

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Katta video player */}
      <div
        style={{
          aspectRatio: '16 / 9',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 12,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {status === 'playing' || status === 'free' ? (
          <video
            src={playUrl || video.url}
            controls
            style={{ width: '100%', height: '100%' }}
            playsInline
            preload="metadata"
            poster={thumbUrl || undefined}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              opacity: 0.9,
              fontWeight: 800,
              fontSize: 18,
              padding: 16,
              textAlign: 'center',
            }}
          >
            Tomosha qilish uchun sotib oling
          </div>
        )}
      </div>

      {/* Ma'lumotlar va tugmalar */}
      <div>
        <h1 style={{ fontWeight: 800, fontSize: 24 }}>{video.title}</h1>
        <p style={{ opacity: 0.85, marginTop: 6 }}>{video.description}</p>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
          {video.category ? `Kategoriya: ${video.category}` : ''}
          {video.tags?.length ? ` · Teglar: ${video.tags.join(', ')}` : ''}
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {video.isFree || video.price === 0 ? (
            <button onClick={() => setStatus('playing')}>Bepul tomosha qilish</button>
          ) : status === 'needbuy' ? (
            <>
              <span style={{ fontWeight: 700 }}>Narx: {video.price} tanga</span>
              <button onClick={buy}>Sotib olish</button>
            </>
          ) : (
            <button onClick={() => setStatus('playing')}>Tomosha qilish</button>
          )}
          {me?.user ? <span style={{ opacity: 0.8 }}>Tangalar: {me.user.coins}</span> : <span>Profilga kiring</span>}
        </div>

        {error ? <div style={{ color: '#ff6f6f', marginTop: 8 }}>Xatolik: {error}</div> : null}
      </div>
    </div>
  )
}
