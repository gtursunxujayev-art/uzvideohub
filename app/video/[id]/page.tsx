// app/video/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

export default function VideoPage() {
  const { id } = useParams<{ id: string }>()
  const [video, setVideo] = useState<Video | null>(null)
  const [err, setErr] = useState<string>('')

  useEffect(() => {
    let stop = false
    ;(async () => {
      try {
        setErr('')
        setVideo(null)
        const res = await fetch(`/api/videos/${id}`, { cache: 'no-store' })
        const j = await res.json()
        if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to load')
        if (!stop) setVideo(j.item)
      } catch (e: any) {
        if (!stop) setErr(String(e?.message || e))
      }
    })()
    return () => { stop = true }
  }, [id])

  if (err) return <div className="container">Xatolik: {err}</div>
  if (!video) return <div className="container">Yuklanmoqda...</div>

  // Resolve playable src:
  // - Regular http(s) URL works directly
  // - If you’re using Telegram file_id:... you’ll need a proxy later; for now just show fallback box.
  const isDirectUrl = typeof video.url === 'string' && /^https?:\/\//i.test(video.url)
  const canPlay = isDirectUrl

  return (
    <div className="container" style={{ display: 'grid', gap: 14 }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>{video.title}</h1>
        {video.code ? <span style={{ opacity: 0.7, fontSize: 14 }}>#{video.code}</span> : null}
      </div>

      {/* Single column layout – just the video block */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="thumb">
          {canPlay ? (
            <video
              src={video.url}
              controls
              style={{ width: '100%', height: '100%' }}
              poster={video.thumbUrl && /^https?:\/\//i.test(video.thumbUrl) ? video.thumbUrl : undefined}
            />
          ) : (
            <div style={{ padding: 12, fontSize: 13, opacity: 0.85 }}>
              Videoni ko‘rsatib bo‘lmadi. Agar <code>file_id:...</code> ishlatayotgan bo‘lsangiz,
              keyingi qadamda Telegram fayl proksi yoqamiz.
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
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