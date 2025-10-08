// app/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import './globals.css'

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
type ApiRes = { ok: boolean; total: number; page: number; limit: number; items: Video[] }

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
  useEffect(() => { load() }, [params])

  const categories = Array.from(new Set(data.items.map(v => v.category).filter(Boolean))) as string[]

  return (
    <div className="container" style={{ display: 'grid', gap: 14 }}>
      <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>So‘nggi videolar</h1>

      <div className="section filters">
        <div className="filters-row">
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

        {categories.length > 0 && (
          <div className="pills">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c || '')}
                className={`pill ${category === c ? 'pill-active' : ''}`}
              >
                {c}
              </button>
            ))}
            {category && <button className="pill" onClick={() => setCategory('')}>Tozalash</button>}
          </div>
        )}
      </div>

      <div className="grid-cards">
        {data.items.map(v => (
          <Link key={v.id} href={`/video/${v.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card">
              <div className="thumb">
                {v.thumbUrl ? (
                  v.thumbUrl.startsWith('file_id:')
                    ? <div style={{ fontSize: 12, opacity: 0.7, padding: 8 }}>Telegram poster</div>
                    : <img src={v.thumbUrl} alt={v.title} />
                ) : null}
                {v.code ? <div className="badge badge-top-left">#{v.code}</div> : null}
                <div className="badge badge-bottom-right">{v.isFree ? 'Bepul' : `${v.price} tanga`}</div>
              </div>
              <div className="card-body">
                <div className="card-title">{v.title}</div>
                <div className="card-sub">
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