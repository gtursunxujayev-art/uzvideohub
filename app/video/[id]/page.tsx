// app/video/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import '../globals.css'

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
  const params = useParams<{ id: string }>()
  const [video, setVideo] = useState<Video | null>(null)

  useEffect(() => {
    ;(async () => {
      const r = await fetch('/api/videos?id=' + params.id, { cache: 'no-store' }).then(res => res.json()).catch(() => null)
      setVideo(r?.item || null)
    })()
  }, [params.id])

  if (!video) return <div className="container">Yuklanmoqda...</div>

  return (
    <div className="container" style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>{video.title}</h1>
        {video.code ? <span style={{ opacity: 0.7, fontSize: 14 }}>#{video.code}</span> : null}
      </div>

      {/* Responsive: the player section stacks on mobile */}
      <div style={{
        display: 'grid',
        gap: 14,
        gridTemplateColumns: '1fr',
      }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="thumb">
            {/* Replace with your actual player (video tag or iframe) */}
            <div style={{ padding: 12, fontSize: 13, opacity: 0.8 }}>Video player joyi</div>
          </div>
        </div>

        <div className="section" style={{ display: 'grid', gap: 8 }}>
          <div style={{ opacity: 0.9 }}>{video.description}</div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>
            {(video.category || '')} {video.tags?.length ? `• ${video.tags.join(', ')}` : ''}
          </div>
        </div>
      </div>
    </div>
  )
}