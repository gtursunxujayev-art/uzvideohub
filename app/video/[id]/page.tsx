'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Video = {
  id: number
  code?: string | null
  title: string
  description: string
  url: string
  thumbUrl?: string | null
  category?: string | null
  isFree: boolean
  price: number
}

function mediaSrc(value?: string | null) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return `/api/proxy-media?src=${encodeURIComponent(value)}`
  return `/api/proxy-media?file_id=${encodeURIComponent(value)}`
}

export default function VideoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!id) return
    ;(async () => {
      try {
        const res = await fetch(`/api/videos?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
        const text = await res.text()
        try {
          const j = JSON.parse(text)
          if (!j?.ok) {
            if (!cancelled) setError(j?.error || 'Video topilmadi')
          } else if (!cancelled) {
            setVideo(j.item as Video)
          }
        } catch {
          if (!cancelled) {
            setError(`Invalid JSON from server (${res.status}). First chars: ${text.slice(0, 140)}`)
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="container" style={{ display: 'grid', gap: 16 }}>
        <div className="card" style={{ padding: 14, fontSize: 14, opacity: 0.85 }}>Yuklanmoqda…</div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="container" style={{ display: 'grid', gap: 16 }}>
        <div className="card" style={{ padding: 14, fontSize: 14, color: '#ff6b6b', whiteSpace: 'pre-wrap' }}>
          {error || 'Topilmadi'}
        </div>
        <button
          onClick={() => router.back()}
          className="btn"
          style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: '#f9b24e', color: '#111' }}
        >
          Orqaga
        </button>
      </div>
    )
  }

  return (
    <div className="container" style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, margin: '8px 0' }}>
        {video.title} {video.code ? <span style={{ opacity: 0.6, fontWeight: 400 }}>#{video.code}</span> : null}
      </h1>

      <div
        style={{
          display: 'grid',
          gap: 16,
        }}
      >
        <div
          style={{
            aspectRatio: '16 / 9',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.06)',
          }}
        >
          {/* Prefer the actual video if provided; otherwise show poster */}
          {video.url ? (
            <video
              controls
              preload="metadata"
              poster={video.thumbUrl ? mediaSrc(video.thumbUrl) : undefined}
              style={{ width: '100%', height: '100%', display: 'block', background: 'black' }}
              src={mediaSrc(video.url)}
            />
          ) : video.thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaSrc(video.thumbUrl)}
              alt={video.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%' }} />
          )}
        </div>

        <div className="card" style={{ display: 'grid', gap: 8, padding: 14 }}>
          <div style={{ fontSize: 15, opacity: 0.9 }}>{video.description || '—'}</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            {video.category ? `Kategoriya: ${video.category}` : 'Kategoriya: —'}
          </div>
          <div style={{ fontSize: 13, color: '#f9b24e' }}>
            {video.isFree ? 'Bepul' : `${video.price} tanga`}
          </div>
        </div>
      </div>
    </div>
  )
}