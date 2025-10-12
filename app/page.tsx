// app/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import './globals.css'

type Video = {
  id: number
  title: string
  description: string
  url: string
  isFree: boolean
  price: number
  thumbUrl?: string | null
  category?: string | null
  code?: string | null
}

const proxify = (u?: string | null) =>
  u && /^https?:\/\//i.test(u) ? `/api/proxy-media?src=${encodeURIComponent(u)}` : undefined

export default function Home() {
  const [list, setList] = useState<Video[]>([])
  const [err, setErr] = useState<string>('')

  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'new' | 'price'>('new')
  const [cat, setCat] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      try {
        setErr('')
        const r = await fetch('/api/videos', { cache: 'no-store' })
        const j = await r.json().catch(() => ({}))
        if (!r.ok || !j?.ok || !Array.isArray(j.items)) throw new Error(j?.error || 'Yuklab bo‘lmadi')
        setList(j.items as Video[])
      } catch (e: any) {
        setErr(String(e?.message || e))
        setList([])
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    let arr = [...list]
    if (q.trim()) {
      const s = q.trim().toLowerCase()
      arr = arr.filter(v =>
        v.title?.toLowerCase().includes(s) ||
        v.description?.toLowerCase().includes(s) ||
        v.code?.toLowerCase().includes(s)
      )
    }
    if (cat.trim()) {
      const c = cat.trim().toLowerCase()
      arr = arr.filter(v => (v.category || '').toLowerCase().includes(c))
    }
    if (sort === 'price') arr.sort((a, b) => (a.price || 0) - (b.price || 0))
    else arr.sort((a, b) => b.id - a.id)
    return arr
  }, [list, q, cat, sort])

  return (
    <div className="container" style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>So‘nggi videolar</h1>

      <div className="section" style={{ display: 'grid', gap: 10 }}>
        <input placeholder="Qidirish (nom, kod, tavsif)…" value={q} onChange={e => setQ(e.target.value)} />
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
          <select value={cat} onChange={e => setCat(e.target.value)}>
            <option value="">Kategoriya: barchasi</option>
            <option value="sport">Sport</option>
            <option value="kino">Kino</option>
            <option value="musiqa">Musiqa</option>
          </select>
          <select value={sort} onChange={e => setSort(e.target.value as any)}>
            <option value="new">Saralash: Yangi</option>
            <option value="price">Saralash: Narx (kam → ko‘p)</option>
          </select>
        </div>
      </div>

      {err && <div className="section" style={{ color: '#ffb4b4' }}>Xatolik: {err}</div>}

      <div style={{ display: 'grid', gap: 14 }}>
        {filtered.map((v) => {
          const poster = proxify(v.thumbUrl || '')
          return (
            <a
              key={v.id}
              href={`/video/${v.id}`}
              className="card"
              style={{
                display: 'grid',
                gridTemplateColumns: '128px 1fr',
                gap: 12,
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                overflow: 'hidden',
                minHeight: 92,
              }}
            >
              {poster ? (
                <img
                  src={poster}
                  alt={v.title}
                  style={{
                    width: 128,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)',
                  }}
                  onError={(e) => {
                    const el = e.currentTarget
                    el.style.display = 'none'
                    const sib = el.nextElementSibling as HTMLElement | null
                    if (sib) sib.style.display = 'grid'
                  }}
                />
              ) : null}

              <div
                style={{
                  display: poster ? 'none' : 'grid',
                  width: 128, height: 80, placeItems: 'center',
                  borderRadius: 10, background: 'rgba(255,255,255,0.08)',
                  fontSize: 12, opacity: 0.8,
                }}
              >
                Poster yo‘q
              </div>

              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>
                  {v.title} {v.code ? <span style={{ opacity: 0.6, fontSize: 13 }}>· #{v.code}</span> : null}
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{v.category || 'Kategoriya yo‘q'}</div>
                <div style={{ fontSize: 13, color: v.isFree ? '#7fff9e' : '#ffbf69' }}>
                  {v.isFree ? 'Bepul' : `${v.price} tanga`}
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}