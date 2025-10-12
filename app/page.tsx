'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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

export default function Home() {
  const [items, setItems] = useState<Video[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/videos', { cache: 'no-store' })
        const text = await res.text()
        try {
          const j = JSON.parse(text)
          if (!j?.ok) {
            if (!cancelled) setError(j?.error || 'API returned error')
          } else if (!cancelled) {
            setItems(j.items as Video[])
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
  }, [])

  return (
    <div className="container" style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, margin: '8px 0' }}>So‘nggi videolar</h1>

      {loading ? (
        <div className="card" style={{ padding: 14, fontSize: 14, opacity: 0.85 }}>
          Yuklanmoqda…
        </div>
      ) : error ? (
        <div className="card" style={{ padding: 14, fontSize: 14, color: '#ff6b6b', whiteSpace: 'pre-wrap' }}>
          Xatolik: {error}
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 14, fontSize: 14, opacity: 0.85 }}>
          Hozircha videolar yo‘q yoki yuklanmadi.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {items.map((v) => (
            <Link key={v.id} href={`/video/${v.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ display: 'grid', gap: 10 }}>
                <div
                  style={{
                    aspectRatio: '16 / 9',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.06)',
                  }}
                >
                  {v.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaSrc(v.thumbUrl)}
                      alt={v.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={(e) => {
                        // fallback if proxy fails
                        const el = e.currentTarget
                        el.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%' }} />
                  )}
                </div>

                <div style={{ display: 'grid', gap: 4 }}>
                  <div style={{ fontWeight: 700 }}>
                    {v.title} {v.code ? <span style={{ opacity: 0.6, fontWeight: 400 }}>#{v.code}</span> : null}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>{v.category || '—'}</div>
                  <div style={{ fontSize: 13, color: '#f9b24e' }}>{v.isFree ? 'Bepul' : `${v.price} tanga`}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}