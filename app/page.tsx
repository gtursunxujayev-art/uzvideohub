// app/page.tsx
'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Video = {
  id: number; title: string; description: string; url: string;
  isFree: boolean; price: number; thumbUrl?: string | null; category?: string | null; tags?: string[];
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([])
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')

  const categories = useMemo(() => {
    const set = new Set<string>()
    videos.forEach(v => v.category && set.add(v.category))
    return Array.from(set).sort()
  }, [videos])

  async function load() {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (category.trim()) params.set('category', category.trim())
    const res = await fetch('/api/videos' + (params.toString() ? `?${params.toString()}` : ''))
    setVideos(res.ok ? await res.json() : [])
  }

  useEffect(() => { load() }, []) // initial
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t) }, [q, category])

  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: 24, marginBottom: 12 }}>Latest Videos</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          placeholder="Search by title, description, or tag…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {videos.map(v => (
          <Link key={v.id} href={`/video/${v.id}`} style={{ background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 12, display: 'block' }}>
            <div
              style={{
                height: 140,
                borderRadius: 8,
                marginBottom: 8,
                background: 'rgba(0,0,0,0.35)',
                backgroundImage: v.thumbUrl ? `url(${v.thumbUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              {v.isFree || v.price === 0 ? (
                <span style={{ fontSize: 12, opacity: 0.85 }}>Free</span>
              ) : (
                <span style={{ fontSize: 12, color: '#ff9900', border: '1px solid #ff9900', borderRadius: 6, padding: '2px 6px' }}>
                  Paid · {v.price} coins
                </span>
              )}
              {v.category ? (
                <span style={{ fontSize: 11, opacity: 0.75, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '2px 6px' }}>
                  {v.category}
                </span>
              ) : null}
            </div>
            <div style={{ fontWeight: 700 }}>{v.title}</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{v.description}</div>
            {v.tags?.length ? (
              <div style={{ fontSize: 11, opacity: 0.65, marginTop: 6 }}>#{v.tags.join(' #')}</div>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  )
}
