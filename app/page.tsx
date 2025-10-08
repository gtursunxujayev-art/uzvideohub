// app/page.tsx
'use client'

import { useEffect, useState } from 'react'

type Video = {
  id: number
  title: string
  description: string
  thumbUrl?: string | null
  price: number
  isFree: boolean
  category?: string | null
  code?: string | null
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      try {
        setError('')
        const res = await fetch('/api/videos', { cache: 'no-store' })
        const j = await res.json()
        if (!res.ok || !j?.ok || !Array.isArray(j.items))
          throw new Error(j?.error || 'Serverdan noto‘g‘ri javob')
        setVideos(j.items)
      } catch (e: any) {
        setError(String(e?.message || e))
      }
    })()
  }, [])

  if (error)
    return (
      <div className="container" style={{ color: 'salmon', marginTop: 16 }}>
        Xatolik: {error}
      </div>
    )

  if (!videos.length)
    return (
      <div className="container" style={{ marginTop: 16 }}>
        Hozircha video mavjud emas.
      </div>
    )

  return (
    <div className="container" style={{ display: 'grid', gap: 18 }}>
      <h1 style={{ fontWeight: 800, fontSize: 22 }}>So‘nggi videolar</h1>

      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        }}
      >
        {videos.map((v) => (
          <a
            key={v.id}
            href={`/video/${v.id}`}
            style={{
              display: 'block',
              borderRadius: 10,
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.06)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            {v.thumbUrl ? (
              <img
                src={v.thumbUrl}
                alt={v.title}
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  background: 'rgba(255,255,255,0.08)',
                }}
              />
            )}
            <div style={{ padding: 8 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  marginBottom: 4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {v.title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.7,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {v.category || 'Kategoriya yo‘q'}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: v.isFree ? '#7fff9e' : '#ffbf69',
                }}
              >
                {v.isFree ? 'Bepul' : `${v.price} tanga`}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}