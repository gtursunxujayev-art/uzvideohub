// app/video/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'

type Video = { id: number; title: string; description: string; url: string; isFree: boolean; price: number }
type Me = { user: { coins: number } | null }

export default function VideoPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  const [video, setVideo] = useState<Video | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [status, setStatus] = useState<'idle' | 'playing' | 'needbuy' | 'free'>('idle')

  useEffect(() => {
    (async () => {
      const [vlist, meRes] = await Promise.all([
        fetch('/api/videos').then(r => r.json()),
        fetch('/api/me').then(r => r.json()),
      ])
      const v = (vlist as Video[]).find(x => x.id === id) || null
      setVideo(v || null)
      setMe(meRes || null)
      if (v) setStatus(v.isFree || v.price === 0 ? 'free' : 'needbuy')
    })()
  }, [id])

  async function buy() {
    const r = await fetch('/api/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: id }),
    })
    const j = await r.json()
    if (j.ok) setStatus('playing')
    else alert(j.error || 'Failed')
  }

  if (!video) return <div>Loading...</div>

  return (
    <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '2fr 1fr' }}>
      <div>
        <div style={{ aspectRatio: '16 / 9', background: 'rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          {(status === 'playing' || status === 'free') ? (
            <video src={video.url} controls style={{ width: '100%', height: '100%' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', opacity: 0.7 }}>
              Purchase to watch
            </div>
          )}
        </div>
        <h1 style={{ fontWeight: 800, fontSize: 24, marginTop: 12 }}>{video.title}</h1>
        <p style={{ opacity: 0.8, marginTop: 8 }}>{video.description}</p>
      </div>

      <aside style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12, height: 'fit-content' }}>
        {me?.user ? (
          <>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Your coins: {me.user.coins}</div>
            {video.isFree || video.price === 0 ? (
              <button onClick={() => setStatus('playing')}>Play (Free)</button>
            ) : (
              <button onClick={buy}>Buy for {video.price} coins</button>
            )}
          </>
        ) : (
          <div>Please login to purchase</div>
        )}
      </aside>
    </div>
  )
}
