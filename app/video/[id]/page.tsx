// app/video/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import '../../globals.css'

type Video = {
  id: number
  code?: string | null
  title: string
  description: string
  url: string
  isFree: boolean
  price: number
  thumbUrl?: string | null
  category?: string | null
  tags: string[]
}

type Me = { id: number; username?: string | null; coins: number } | null

const proxify = (u?: string | null) =>
  u && /^https?:\/\//i.test(u) ? `/api/proxy-media?src=${encodeURIComponent(u)}` : undefined

export default function VideoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [video, setVideo] = useState<Video | null>(null)
  const [me, setMe] = useState<Me>(null)
  const [owned, setOwned] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [err, setErr] = useState<string>('')

  useEffect(() => {
    let stop = false
    ;(async () => {
      try {
        setLoading(true)
        setErr('')
        const vRes = await fetch(`/api/videos/${id}`, { cache: 'no-store' })
        const vJ = await vRes.json()
        if (!vRes.ok || !vJ?.ok) throw new Error(vJ?.error || 'Video topilmadi')
        if (stop) return
        setVideo(vJ.item)

        const meRes = await fetch('/api/me', { cache: 'no-store' })
        const meJ = await meRes.json().catch(() => ({}))
        if (!stop) setMe(meRes.ok && meJ?.ok ? meJ.user : null)

        const chkRes = await fetch(`/api/purchase/check?id=${encodeURIComponent(String(vJ.item.id))}`, { cache: 'no-store' })
        const chkJ = await chkRes.json().catch(() => ({}))
        if (!stop) setOwned(Boolean(chkJ?.owned || vJ.item.isFree))
      } catch (e: any) {
        if (!stop) setErr(String(e?.message || e))
      } finally {
        if (!stop) setLoading(false)
      }
    })()
    return () => { stop = true }
  }, [id])

  const buy = async () => {
    if (!video) return
    try {
      setErr('')
      const r = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video.id }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'Sotib olish muvaffaqiyatsiz')
      setOwned(true)
      const meRes = await fetch('/api/me', { cache: 'no-store' })
      const meJ = await meRes.json().catch(() => ({}))
      setMe(meRes.ok && meJ?.ok ? meJ.user : null)
    } catch (e: any) {
      setErr(String(e?.message || e))
      if (String(e?.message || '').toLowerCase().includes('balance') || String(e?.message || '').includes('tanga')) {
        window.open('https://t.me/videohubtolovbot', '_blank')
      }
    }
  }

  if (loading) return <div className="container">Yuklanmoqda...</div>
  if (err) return <div className="container">Xatolik: {err}</div>
  if (!video) return <div className="container">Video topilmadi</div>

  const videoSrc = proxify(video.url)
  const poster = proxify(video.thumbUrl || '')

  return (
    <div className="container" style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>{video.title}</h1>
        {video.code ? <span style={{ opacity: 0.7, fontSize: 14 }}>#{video.code}</span> : null}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="thumb" style={{ position: 'relative' }}>
          {owned ? (
            videoSrc ? (
              <video
                src={videoSrc}
                controls
                style={{ width: '100%', height: '100%' }}
                poster={poster}
              />
            ) : (
              <div style={{ padding: 12, fontSize: 13, opacity: 0.85 }}>
                Video URL mos kelmadi.
              </div>
            )
          ) : (
            <>
              {poster ? (
                <img
                  src={poster}
                  alt={video.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.08)' }} />
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.55))',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gap: 10,
                    background: 'rgba(0,0,0,0.65)',
                    padding: 16,
                    borderRadius: 12,
                    textAlign: 'center',
                    width: 'min(420px, 92%)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Video pullik</div>
                  <div style={{ fontSize: 14, opacity: 0.9 }}>
                    Narx: <b>{video.price} tanga</b>
                    {me ? <span style={{ opacity: 0.8 }}> • Balans: {me.coins} tanga</span> : null}
                  </div>
                  <button className="btn" onClick={buy}>Sotib olish</button>
                  <button className="btn" onClick={() => router.push('/')}>Bosh sahifaga qaytish</button>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    Yetarli tanga yo‘qmi? <a href="https://t.me/videohubtolovbot" target="_blank">To‘ldirish</a>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="section" style={{ display: 'grid', gap: 8 }}>
        <div style={{ opacity: 0.9 }}>{video.description}</div>
        <div style={{ opacity: 0.8, fontSize: 13 }}>
          {(video.category || '')} {video.tags?.length ? `• ${video.tags.join(', ')}` : ''}
        </div>
        <div className="badge" style={{ position: 'static', background: 'rgba(255,255,255,0.08)', width: 'fit-content' }}>
          {video.isFree ? 'Bepul' : `${video.price} tanga`}
        </div>
      </div>
    </div>
  )
}