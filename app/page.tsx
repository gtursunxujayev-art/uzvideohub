// app/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

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

type ApiRes = {
  ok: boolean
  total: number
  page: number
  limit: number
  items: Video[]
}

export default function Home() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [tag, setTag] = useState('')
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc' | 'title'>('newest')

  const [data, setData] = useState<ApiRes>({ ok: true, total: 0, page: 1, limit: 24, items: [] })

  const params = useMemo(() => {
    const u = new URLSearchParams()
    if (q) u.set('q', q)
    if (category) u.set('category', category)
    if (tag) u.set('tag', tag)
    if (sort) u.set('sort', sort)
    return u.toString()
  }, [q, category, tag, sort])

  const load = async () => {
    const r = await fetch('/api/videos?' + params, { cache: 'no-store' })
    const j = await r.json()
    setData(j)
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [params])

  // Collect categories from current data for quick filter chips
  const categories = Array.from(new Set(data.items.map(v => v.category).filter(Boolean))) as string[]

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24 }}>So‘nggi videolar</h1>

      {/* Filters */}
      <div style={{ display: 'grid', gap: 8, background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 12 }}>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
          <input placeholder="Qidirish..." value={q} onChange={e => setQ(e.target.value)} />
          <input placeholder="Kategoriya (masalan: Sport)" value={category} onChange={e => setCategory(e.target.value)} />
          <input placeholder="Teg (masalan: kulgu)" value={tag} onChange={e => setTag(e.target.value)} />
          <select value={sort} onChange={e => setSort(e.target.value as any)}>
            <option value="newest">Saralash: Yangi</option>
            <option value="price_asc">Narx: arzon → qimmat</option>
            <option value="price_desc">Narx: qimmat → arzon</option>
            <option value="title">Alifbo bo‘yicha</option>
          </select>
        </div>

        {/* Quick category chips */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c || '')}
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: category === c ? 'rgba(255,153,0,0.2)' : 'transparent'
                }}
              >
                {c}
              </button>
            ))}
            {category && <button onClick={() => setCategory('')}>Tozalash</button>}
          </div>
        )}
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        }}
      >
        {data.items.map(v => (
          <Link key={v.id} href={`/video/${v.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ position: 'relative', aspectRatio: '16 / 9', background: 'rgba(255,255,255,0.04)' }}>
                {v.thumbUrl ? (
                  v.thumbUrl.startsWith('file_id:')
                    ? <div style={{ fontSize: 12, opacity: 0.7, padding: 8 }}>Telegram file_id poster</div>
                    : <img src={v.thumbUrl} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : null}
                {/* Code badge */}
                {v.code ? (
                  <div style={{
                    position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', padding: '4px 8px',
                    borderRadius: 6, fontSize: 12, letterSpacing: 1
                  }}>
                    #{v.code}
                  </div>
                ) : null}
                {/* Price badge */}
                <div style={{
                  position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', padding: '4px 8px',
                  borderRadius: 6, fontSize: 12
                }}>
                  {v.isFree ? 'Bepul' : `${v.price} tanga`}
                </div>
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 4, lineHeight: 1.2 }}>{v.title}</div>
                <div style={{ opacity: 0.8, fontSize: 13 }}>
                  {(v.category || '')} {v.tags?.length ? `• ${v.tags.slice(0, 3).join(', ')}` : ''}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
