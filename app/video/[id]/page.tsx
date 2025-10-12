'use client'

import { useEffect, useRef, useState } from 'react'
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

  const vRef = useRef<HTMLVideoElement | null>(null)
  const [ratio, setRatio] = useState<number | null>(null)
  const [fs, setFs] = useState(false)

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
          if (!cancelled) setError(`Invalid JSON from server (${res.status}). First chars: ${text.slice(0, 140)}`)
        }
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  const onLoadedMetadata = () => {
    const el = vRef.current
    if (!el) return
    if (el.videoWidth && el.videoHeight) setRatio(el.videoWidth / el.videoHeight)
  }

  const openFullscreen = async () => {
    const el = vRef.current
    if (!el) return
    const anyEl: any = el
    const req =
      el.requestFullscreen ||
      anyEl.webkitRequestFullscreen ||
      anyEl.mozRequestFullScreen ||
      anyEl.msRequestFullscreen
    if (req) {
      try {
        await req.call(el)
        return
      } catch {
        /* fall back to overlay */
      }
    }
    setFs(true)
  }
  const closeOverlay = () => setFs(false)

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

  // Wrapper around the video so we can absolutely position our custom control
  const pageBoxStyle: React.CSSProperties = ratio
    ? {
        width: '100%',
        height: 'min(65vh, calc((100vw - 32px) / ' + ratio + '))',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.06)',
        position: 'relative',
      }
    : {
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.06)',
        position: 'relative',
      }

  // Height of the native control strip (approx), to float "above" it:
  const liftAboveControlsPx = 46   // adjust if your device overlays are taller/shorter

  return (
    <>
      <div className="container" style={{ display: 'grid', gap: 16 }}>
        <h1 style={{ fontWeight: 800, fontSize: 24, margin: '8px 0' }}>
          {video.title} {video.code ? <span style={{ opacity: 0.6, fontWeight: 400 }}>#{video.code}</span> : null}
        </h1>

        <div style={{ display: 'grid', gap: 16 }}>
          <div style={pageBoxStyle}>
            {/* Inline player */}
            <video
              ref={vRef}
              controls
              playsInline
              preload="metadata"
              poster={video.thumbUrl ? mediaSrc(video.thumbUrl) : undefined}
              onLoadedMetadata={onLoadedMetadata}
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
                background: 'black',
              }}
              src={mediaSrc(video.url)}
            />

            {/* Custom fullscreen button — SHORT TEXT and just ABOVE native icon */}
            <button
  onClick={openFullscreen}
  aria-label="Full"
  style={{
    position: 'absolute',
    right: 9,
    bottom: liftAboveControlsPx - 14, // lowered by ~20px
    zIndex: 3,
    pointerEvents: 'auto',
    background: 'rgba(17,17,17,0.85)',
    border: '1px solid rgba(255,255,255,0.25)',
    color: '#fff',
    padding: '6px 7px',
    borderRadius: 10,
    fontSize: 12,
    boxShadow: '0 3px 10px rgba(0,0,0,0.35)',
  }}
>
  To‘liq
</button>
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

      {/* Fullscreen overlay fallback */}
      {fs && (
        <div
          onClick={closeOverlay}
          role="dialog"
          aria-label="Fullscreen video"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.98)',
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <video
            controls
            autoPlay
            playsInline
            preload="metadata"
            poster={video.thumbUrl ? mediaSrc(video.thumbUrl) : undefined}
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            style={{
              width: '100vw',
              height: '100vh',
              objectFit: 'contain',
              background: 'black',
            }}
            src={mediaSrc(video.url)}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={closeOverlay}
            aria-label="Yopish"
            style={{
              position: 'fixed',
              top: 12,
              right: 12,
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 13,
              zIndex: 1001,
            }}
          >
            Yopish
          </button>
        </div>
      )}
    </>
  )
}