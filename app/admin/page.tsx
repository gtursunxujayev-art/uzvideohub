// app/admin/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import '../globals.css'

type Me = { id: number; isAdmin?: boolean | null }
type User = { id: number; username?: string | null; name?: string | null; coins: number }
type Video = {
  id: number
  code?: string | null
  title: string
  description: string
  url: string
  thumbUrl?: string | null
  category?: string | null
  tags?: string[] | null
  isFree: boolean
  price: number
}

export default function AdminPage() {
  const [me, setMe] = useState<Me | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  // Give coins state
  const [giveTo, setGiveTo] = useState<number | ''>('')
  const [amount, setAmount] = useState<string>('')

  // New video form state
  const [vCode, setVCode] = useState('')
  const [vTitle, setVTitle] = useState('')
  const [vDesc, setVDesc] = useState('')
  const [vThumb, setVThumb] = useState('')
  const [vCat, setVCat] = useState('')
  const [vTags, setVTags] = useState('')
  const [vUrl, setVUrl] = useState('')
  const [vFree, setVFree] = useState(false)
  const [vPrice, setVPrice] = useState('0')

  // On mount: load me, users, videos
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const [meR, usersR, vidsR] = await Promise.all([
          fetch('/api/me', { cache: 'no-store' }),
          fetch('/api/admin/users', { cache: 'no-store' }),
          fetch('/api/videos', { cache: 'no-store' }),
        ])
        const meJ = await meR.json().catch(() => ({}))
        const usJ = await usersR.json().catch(() => ({}))
        const vdJ = await vidsR.json().catch(() => ({}))
        if (meR.ok && meJ?.ok) setMe(meJ.user as Me)
        if (usersR.ok && usJ?.ok) setUsers(usJ.items as User[])
        if (vidsR.ok && vdJ?.ok) setVideos(vdJ.items as Video[])
        setErr('')
      } catch (e: any) {
        setErr(String(e?.message || e))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Helpers
  const canUse = useMemo(() => Boolean(me?.isAdmin), [me])

  async function refreshVideos() {
    const r = await fetch('/api/videos', { cache: 'no-store' })
    const j = await r.json().catch(() => ({}))
    if (r.ok && j?.ok) setVideos(j.items as Video[])
  }

  // Actions
  async function giveCoins() {
    if (!giveTo || !amount) return
    try {
      const r = await fetch('/api/admin/coins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: Number(giveTo), amount: Number(amount) }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'Tangalarni berib bo‘lmadi')
      setAmount('')
      setGiveTo('')
      alert('Tangalari yangilandi')
    } catch (e: any) {
      alert(String(e?.message || e))
    }
  }

  async function createVideo() {
    try {
      const body = {
        code: vCode || undefined,
        title: vTitle,
        description: vDesc || '',
        thumbUrl: vThumb || undefined,
        category: vCat || undefined,
        tags: vTags ? vTags.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        url: vUrl,
        isFree: vFree,
        price: Number(vPrice || 0),
      }
      const r = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'Video qo‘shilmadi')
      // reset
      setVCode(''); setVTitle(''); setVDesc(''); setVThumb(''); setVCat(''); setVTags(''); setVUrl(''); setVFree(false); setVPrice('0')
      await refreshVideos()
      alert('Video qo‘shildi')
    } catch (e: any) {
      alert(String(e?.message || e))
    }
  }

  async function updateVideo(v: Video) {
    try {
      const r = await fetch(`/api/admin/videos/${v.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'Yangilab bo‘lmadi')
      await refreshVideos()
      alert('Video yangilandi')
    } catch (e: any) {
      alert(String(e?.message || e))
    }
  }

  async function deleteVideo(id: number) {
    if (!confirm('O‘chirishni tasdiqlang')) return
    try {
      const r = await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'O‘chirishda xatolik')
      await refreshVideos()
    } catch (e: any) {
      alert(String(e?.message || e))
    }
  }

  if (loading) return <div className="container">Yuklanmoqda…</div>
  if (!canUse) return <div className="container">Kirish taqiqlangan</div>

  return (
    <div className="container" style={{ display: 'grid', gap: 16, paddingBottom: 32, overflowX: 'hidden' }}>
      {/* Mobile-first max width wrapper */}
      <div style={{ width: 'min(780px, 100%)', margin: '0 auto', display: 'grid', gap: 16 }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>Admin</h1>

        {/* Give coins */}
        <section className="section" style={{ display: 'grid', gap: 10 }}>
          <div style={{ fontWeight: 700 }}>Tangalerni berish</div>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr', alignItems: 'center' }}>
            <select value={giveTo} onChange={e => setGiveTo(Number(e.target.value))}>
              <option value="">Foydalanuvchini tanlang</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.username ? `@${u.username}` : (u.name || 'No name')} • {u.coins} tanga
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Miqdor"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            * Musbat son berilsa → qo‘shiladi. Manfiy son berilsa → ayriladi. Masalan, -5 foydalanuvchidan 5 tanga ayiradi.
          </div>
          <button className="btn" onClick={giveCoins}>Berish</button>
        </section>

        {/* Add video */}
        <section className="section" style={{ display: 'grid', gap: 10 }}>
          <div style={{ fontWeight: 700 }}>Yangi video qo‘shish</div>

          <input placeholder="Kod (masalan: 013)" value={vCode} onChange={e => setVCode(e.target.value)} />
          <input placeholder="Sarlavha *" value={vTitle} onChange={e => setVTitle(e.target.value)} />
          <textarea placeholder="Tavsif" value={vDesc} onChange={e => setVDesc(e.target.value)} />

          <input placeholder="Poster URL yoki file_id…" value={vThumb} onChange={e => setVThumb(e.target.value)} />
          <input placeholder="Kategoriya (ixtiyoriy)" value={vCat} onChange={e => setVCat(e.target.value)} />
          <input placeholder="Teglar (vergul bilan)" value={vTags} onChange={e => setVTags(e.target.value)} />
          <input placeholder="Video URL yoki file_id:*" value={vUrl} onChange={e => setVUrl(e.target.value)} />

          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={vFree} onChange={e => setVFree(e.target.checked)} />
            Bepul
          </label>
          <input type="number" placeholder="Narx (tanga)" value={vPrice} onChange={e => setVPrice(e.target.value)} />

          <button className="btn" onClick={createVideo}>Qo‘shish</button>
        </section>

        {/* Videos list */}
        <div style={{ display: 'grid', gap: 12 }}>
          {videos.map((v) => (
            <VideoRow key={v.id} v={v} onSave={updateVideo} onDelete={() => deleteVideo(v.id)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function VideoRow({ v, onSave, onDelete }: { v: Video; onSave: (v: Video) => void; onDelete: () => void }) {
  const [edit, setEdit] = useState<Video>({ ...v })

  return (
    <div className="section" style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontWeight: 700, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {edit.title}
        <span style={{ opacity: 0.7, fontWeight: 400 }}>
          {edit.code ? ` • Kod: ${edit.code}` : ''} {edit.isFree ? ' • Bepul' : ` • ${edit.price} tanga`}
        </span>
      </div>

      {/* Compact, mobile-first grid */}
      <div style={{ display: 'grid', gap: 10 }}>
        <input placeholder="Kod" value={edit.code || ''} onChange={e => setEdit({ ...edit, code: e.target.value })} />
        <input placeholder="Sarlavha" value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} />
        <textarea placeholder="Tavsif" value={edit.description} onChange={e => setEdit({ ...edit, description: e.target.value })} />
        <input placeholder="Poster URL yoki file_id" value={edit.thumbUrl || ''} onChange={e => setEdit({ ...edit, thumbUrl: e.target.value })} />
        <input placeholder="Kategoriya" value={edit.category || ''} onChange={e => setEdit({ ...edit, category: e.target.value })} />
        <input
          placeholder="Teglar (vergul bilan)"
          value={(edit.tags || []).join(', ')}
          onChange={e => setEdit({ ...edit, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
        />
        <input placeholder="Video URL yoki file_id" value={edit.url} onChange={e => setEdit({ ...edit, url: e.target.value })} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={edit.isFree} onChange={e => setEdit({ ...edit, isFree: e.target.checked })} />
            Bepul
          </label>
          <input
            type="number"
            placeholder="Narx"
            value={String(edit.price ?? 0)}
            onChange={e => setEdit({ ...edit, price: Number(e.target.value || 0) })}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => onSave(edit)}>Tahrirlash</button>
        <button className="btn" onClick={onDelete}>O‘chirish</button>
      </div>
    </div>
  )
}