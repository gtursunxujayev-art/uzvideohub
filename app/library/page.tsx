// app/library/page.tsx
'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type Video = { id: number; title: string; description: string; url: string; isFree: boolean; price: number }

export default function LibraryPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/my/purchases')
      if (res.ok) setVideos(await res.json())
      setLoading(false)
    })()
  }, [])

  if (loading) return <div>Loading…</div>

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: 24, marginBottom: 12 }}>My Library</h1>
      {videos.length === 0 ? (
        <div style={{ opacity: 0.75 }}>No purchased videos yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {videos.map(v => (
            <Link key={v.id} href={`/video/${v.id}`} style={{ background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 12, display: 'block' }}>
              <div style={{ height: 140, background: 'rgba(0,0,0,0.35)', borderRadius: 8, marginBottom: 8 }} />
              <div style={{ fontWeight: 700 }}>{v.title}</div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{v.description}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
