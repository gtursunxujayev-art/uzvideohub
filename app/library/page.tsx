// app/library/page.tsx
'use client'

import { useEffect, useState } from 'react'
import '../globals.css'

type Video = {
  id: number
  title: string
  description: string
  thumbUrl?: string | null
  url: string
  isFree: boolean
  price: number
  category?: string | null
  code?: string | null
}

export default function LibraryPage() {
  const [list, setList] = useState<Video[]>([])
  const [err, setErr] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      try {
        setErr('')
        const r = await fetch('/api/my/purchases', { cache: 'no-store' })
        const j = await r.json()
        if (!r.ok || !j?.ok || !Array.isArray(j.items)) throw new Error(j?.error || 'Yuklashda xatolik')
        const safe: Video[] = j.items.filter((v: any) => v && Number.isFinite(v.id))
        setList(safe)
      } catch (e: any) {
        setErr(String(e?.message || e))
        setList([])
      }
    })()
  }, [])

  return (
    <div className="container" style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>Sotib olingan</h1>

      {err && <div className="section" style={{ color: '#ffb4b4' }}>Xatolik: {err}</div>}
      {!err && list.length === 0 && <div className="section">Hali sotib olingan video yo‘q.</div>}

      {!err && list.length > 0 && (
        <div style={{ display: 'grid', gap: 20 }}>
          {list.map(v => (
            <a
              key={v.id}
              href={`/video/${v.id}`}
              style={{
                display: 'block',
                borderRadius: 14,
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.06)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              {/* Top: thumbnail */}
              {v.thumbUrl && /^https?:\/\//i.test(v.thumbUrl) ? (
                <img
                  src={v.thumbUrl}
                  alt={v.title}
                  style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16 / 9',
                    background: 'rgba(255,255,255,0.08)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 12,
                    opacity: 0.8,
                  }}
                >
                  Poster yo‘q
                </div>
              )}

              {/* Bottom: meta */}
              <div style={{ padding: 12, display: 'grid', gap: 4, background: 'rgba(0,0,0,0.15)' }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>
                  {v.title} {v.code ? <span style={{ opacity: 0.6, fontSize: 13 }}>· #{v.code}</span> : null}
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{v.category || 'Kategoriya yo‘q'}</div>
                <div style={{ fontSize: 13, color: v.isFree ? '#7fff9e' : '#ffbf69' }}>
                  {v.isFree ? 'Bepul' : `${v.price} tanga`}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}