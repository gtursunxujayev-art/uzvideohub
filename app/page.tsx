'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Video = { id: number; title: string; description: string; url: string; isFree: boolean; price: number }

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([])
  useEffect(() => { fetch('/api/videos').then(r => r.json()).then(setVideos) }, [])

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: 24, marginBottom: 12 }}>Latest Videos</h1>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {videos.map(v => (
          <Link key={v.id} href={`/video/${v.id}`} style={{ background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 12, display: 'block' }}>
            <div style={{ height: 140, background: 'rgba(0,0,0,0.35)', borderRadius: 8, marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              {v.isFree || v.price === 0 ? (
                <span style={{ fontSize: 12, opacity: 0.85 }}>Free</span>
              ) : (
                <span style={{ fontSize: 12, color: '#ff9900', border: '1px solid #ff9900', borderRadius: 6, padding: '2px 6px' }}>
                  Paid · {v.price} coins
                </span>
              )}
            </div>
            <div style={{ fontWeight: 700 }}>{v.title}</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{v.description}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
