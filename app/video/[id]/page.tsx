// app/video/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'

type Video = {
  id: number
  title: string
  description: string
  url: string
  isFree: boolean
  price: number
  thumbUrl?: string | null
  category?: string | null
  tags?: string[]
}

type Me = { user: { coins: number } | null }

export default function VideoPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)

  const [video, setVideo] = useState<Video | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [status, setStatus] = useState<'idle' | 'playing' | 'needbuy' | 'free'>('idle')
  const [error, setError] = useState<string>('')

  async function refreshMe() {
    try {
      const j = await fetch('/api/me').then((r) => r.json())
      setMe(j)
    } catch (e: any) {
      // ignore
    }
  }

  async function checkOwned(videoId: number) {
    try {
      const j = await fetch(`/api/purchase/check?videoId=${videoId}`).then((r) => r.json())
      return !!j?.owned
    } catch {
      return false
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [vlist, meRes] = await Promise.all([
          fetch('/api/videos').then((r) => r.json()),
          fetch('/api/me').then((r) => r.json()),
        ])
        if (cancelled) return
        const v = (vlist as Video[]).find((x) => x.id === id) || null
        setVideo(v || null)
        setMe(meRes || null)
        if (!v) return
        if (v.isFree || v.price === 0) {
          setStatus('free')
        } else {
          const owned = await checkOwned(id)
          if (cancelled) return
          setStatus(owned ? 'playing' : 'needbuy')
        }
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || e))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  async function buy() {
    try {
      const r = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: id }),
      })
      const j = await r.json()
      if (j.ok) {
        setStatus('playing')
        await refreshMe()
      } else {
        alert(j.error || 'Purchase failed')
      }
    } catch (e: any) {
      alert(String(e?.message || e))
    }
  }

  if (!video) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '2fr 1fr' }}>
      <div>
        <div
          style={{
            aspectRatio: '16 / 9',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {status === 'playing' || status === 'free' ? (
            <video src={video.url} controls style={{ width: '100%', height: '100%' }} />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                opacity: 0.7,
              }}
            >
              Purchase to watch
            </div>
          )}
        </div>

        <h1 style={{ fontWeight: 800, fontSize: 24, marginTop: 12 }}>{video.title}</h1>
        <p style={{ opacity: 0.8, marginTop: 8 }}>{video.description}</p>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
          {video.category ? `Category: ${video.category}` : ''}
          {video.tags?.length ? `  ·  Tags: ${video.tags.join(', ')}` : ''}
        </div>
        {error ? (
          <div style={{ color: '#ff6f6f', marginTop: 8 }}>Error: {error}</div>
        ) : null}
      </div>

      <aside
        style={{
          background: 'rgba(255,255,255,0.06)',
          padding: 16,
          borderRadius: 12,
          height: 'fit-content',
        }}
      >
        {me?.user ? (
          <>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Your coins: {me.user.coins}</div>
            {video.isFree || video.price === 0 ? (
              <button onClick={() => setStatus('playing')}>Play (Free)</button>
            ) : status === 'needbuy' ? (
              <button onClick={buy}>Buy for {video.price} coins</button>
            ) : (
              <button onClick={() => setStatus('playing')}>Play</button>
            )}
          </>
        ) : (
          <div>Please login to purchase</div>
        )}
      </aside>
    </div>
  )
}
