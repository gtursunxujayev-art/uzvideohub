// app/video/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

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
      const r = await fetch('/api/videos?limit=1&code=&q=&sort=newest')
      // In your existing code you likely fetch by id via a separate route.
      // If you already have /api/videos/[id], use that instead:
      const v = await fetch(`/api/videos?id=${params.id}`).then(res => res.json()).catch(() => null)
      setVideo(v?.item || null)
    })()
  }, [params.id])

  if (!video) return <div>Yuklanmoqda...</div>

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <h1 style={{ fontWeight: 800, fontSize: 24, margin: 0 }}>{video.title}</h1>
        {video.code ? <span style={{ opacity: 0.7, fontSize: 14 }}>#{video.code}</span> : null}
      </div>

      <div style={{ aspectRatio: '16 / 9', background: 'rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
        {/* your existing player logic applies here */}
        <div style={{ padding: 12, fontSize: 13, opacity: 0.8 }}>Video player joyi</div>
      </div>

      <div style={{ opacity: 0.9 }}>{video.description}</div>
      <div style={{ opacity: 0.8, fontSize: 13 }}>
        {(video.category || '')} {video.tags?.length ? `• ${video.tags.join(', ')}` : ''}
      </div>
    </div>
  )
}
