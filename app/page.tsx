// app/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'

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

type SortKey = 'newest' | 'title' | 'price_asc' | 'price_desc'

export default function Home() {
  const [all, setAll] = useState<Video[]>([])
  const [error, setError] = useState<string>('')

  // Filters
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')

  // Load once
  useEffect(() => {
    ;(async () => {
      try {
        setError('')
        const res = await fetch('/api/videos', { cache: 'no-store' })
        const j = await res.json()
        if (!res.ok || !j?.ok || !Array.isArray(j.items)) throw new Error(j?.error || 'Server xatosi')
        const safe: Video[] = j.items.filter((v: any) => v && Number.isFinite(v.id))
        setAll(safe)
      } catch (e: any) {
        setError(String(e?.message || e))
      }
    })()
  }, [])

  // Derive categories from data
  const categories = useMemo(
    () => Array.from(new Set(all.map(v => v.category).filter(Boolean))) as string[],
    [all]
  )

  // Client-side filter + sort
  const list = useMemo(() => {
    let out = all
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      out = out.filter(v =>
        (v.title || '').toLowerCase().includes(s) ||
        (v.description || '').toLowerCase().includes(s) ||
        (v.category || '').toLowerCase().includes(s) ||
        (v.code || '').toLowerCase().includes(s)
      )
    }
    if (category.trim()) {
      const c = category.trim().toLowerCase()
      out = out.filter(v => (v.category || '').toLowerCase() === c)
    }
    if (sort === 'title') out = [...out].sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    else if (sort === 'price_asc') out = [...out].sort((a, b) => (a.price || 0) - (b.price || 0))
    else if (sort === 'price_desc') out = [...out].sort((a, b) => (b.price || 0) - (a.price || 0))
    // 'newest' keeps server order (already newest first)
    return out
  }, [all, q, category, sort])

  return (
    <div className="container" style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>So‘nggi videolar</h1>

      {/* Filters */}
      <div className="section" style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr' }}>
          <input
            placeholder="Qidirish (nom, kod, tavsif)..."
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{
              width: '100%', padding: 10, borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff'
            }}
          />
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                padding: 10, borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff'
              }}
            >
              <option value="">Kategoriya: barchasi</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              style={{
                padding: 10, borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#fff'
              }}
            >
              <option value="newest">Saralash: Yangi</option>
              <option value="title">Nom bo‘yicha</option>
              <option value="price_asc">Narx: arzon → qimmat</option>
              <option value="price_desc">Narx: qimmat → arzon</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="section" style={{ color: '#ffb4b4' }}>
          Xatolik: {error}
        </div>
      )}

      {!error && list.length === 0 && (
        <div className="section">Mos video topilmadi.</div>
      )}

      {/* One card per row */}
      {!error && list.length > 0 && (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr' }}>
          {list.map(v => (
            <a
              key={v.id}
              href={`/video/${v.id}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '160px 1fr',
                gap: 12,
                alignItems: 'stretch',
                borderRadius: 12,
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.06)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              {/* Thumb (left) */}
              {v.thumbUrl ? (
                <img
                  src={v.thumbUrl}
                  alt={v.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', aspectRatio: '16/9' }}
                />
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.08)', aspectRatio: '16/9' }} />
              )}

              {/* Content (right) */}
              <div style={{ padding: 10, display: 'grid', gap: 6 }}>
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