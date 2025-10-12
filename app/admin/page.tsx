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

  // Give coins
  const [giveTo, setGiveTo] = useState<number | ''>('')
  const [amount, setAmount] = useState<string>('')

  // New video
  const [vCode, setVCode] = useState('')
  const [vTitle, setVTitle] = useState('')
  const [vDesc, setVDesc] = useState('')
  const [vThumb, setVThumb] = useState('')
  const [vCat, setVCat] = useState('')
  const [vTags, setVTags] = useState('')
  const [vUrl, setVUrl] = useState('')
  const [vFree, setVFree] = useState(false)
  const [vPrice, setVPrice] = useState('0')

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
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const canUse = useMemo(() => Boolean(me?.isAdmin), [me])

  async function refreshVideos() {
    const r = await fetch('/api/videos', { cache: 'no-store' })
    const j = await r.json().catch(() => ({}))
    if (r.ok && j?.ok) setVideos(j.items as Video[])
  }

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
      setAmount(''); setGiveTo('')
      alert('Tangalari yangilandi')
    } catch (e: any) {
      alert(String(e?.message || e))
    }
  }

  function validateCreate(): { ok: boolean; msg?: string } {
    if (!vTitle.trim()) return { ok: false, msg: 'Sarlavha majburiy' }
    if (!vUrl.trim()) return { ok: false, msg: 'Video URL yoki file_id majburiy' }
    if (!vFree) {
      const p = Number(vPrice)
      if (!Number.isFinite(p) || p <= 0) return { ok: false, msg: 'Pullik video uchun narx > 0 bo‘lishi kerak' }
    }
    return { ok: true }
  }

  async function createVideo() {
    const val = validateCreate()
    if (!val.ok) { alert(val.msg); return }
    try {
      const body = {
        code: vCode || undefined,
        title: vTitle.trim(),
        description: vDesc.trim(),
        thumbUrl: vThumb.trim() || undefined,
        category: vCat.trim() || undefined,
        tags: vTags ? vTags.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        url: vUrl.trim(),
        isFree: vFree,
        price: vFree ? 0 : Number(vPrice || 0),
      }
      const r = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const txt = await r.text()
      let j: any = {}
      try { j = JSON.parse(txt) } catch {}
      if (!r.ok || !j?.ok) throw new Error(j?.error || txt || 'Video qo‘shilmadi')
      // reset
      setVCode(''); setVTitle(''); setVDesc(''); setVThumb(''); setVCat(''); setVTags(''); setVUrl(''); setVFree(false); setVPrice('0')
      await refreshVideos()
      alert('Video qo‘shildi')
    } catch (e: any) {
      alert(String(e?.message || e))
    }
  }

  if (loading) return <div className="container">Yuklanmoqda…</div>
  if (!canUse) return <div className="container">Kirish taqiqlangan</div>

  // explicit orange button style (no CSS var needed)
  const btn: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: 14,
    fontWeight: 700,
    borderRadius: 10,
    background: '#ffa31a',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#000',
    cursor: 'pointer'
  }

  return (
    <div className="container" style={{ display: 'grid', gap: 16, paddingBottom: 32, overflowX: 'hidden' }}>
      <div style={{ width: 'min(780px, 100%)', margin: '0 auto', display: 'grid', gap: 16 }}>
        <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>Admin</h1>

        {/* Give coins */}
        <section className="section" style={{ display: 'grid', gap: 10 }}>
          <div style={{ fontWeight: 700 }}>Tangalerni berish</div>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
            <select value={giveTo} onChange={e => setGiveTo(Number(e.target.value))}>
              <option value="">Foydalanuvchini tanlang</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.username ? `@${u.username}` : (u.name || 'No name')} • {u.coins} tanga
                </option>
              ))}
            </select>
            <input type="number" placeholder="Miqdor" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            * Musbat son → qo‘shiladi. Manfiy son → ayriladi.
          </div>
          <button style={btn} onClick={giveCoins}>Berish</button>
        </section>

        {/* New video */}
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

          <button style={btn} onClick={createVideo}>Qo‘shish</button>
        </section>

        {/* Videos list – read-only rows (no default edit mode) */}
        <div style={{ display: 'grid', gap: 12 }}>
          {videos.map((v) => (
            <VideoRow key={v.id} v={v} onUpdated={refreshVideos} btnStyle={btn} />
          ))}
        </div>
      </div>
    </div>
  )
}

function VideoRow({ v, onUpdated, btnStyle }: { v: Video; onUpdated: () => void; btnStyle: React.CSSProperties }) {
  const [editing, setEditing] = useState(false)
  const [edit, setEdit] = useState<Video>({ ...v })

  useEffect(() => setEdit({ ...v }), [v.id])

  async function save() {
    try {
      if (!edit.title.trim()) throw new Error('Sarlavha majburiy')
      if (!edit.url.trim()) throw new Error('Video URL yoki file_id majburiy')
      const price = edit.isFree ? 0 : Number(edit.price || 0)
      if (!edit.isFree && (!Number.isFinite(price) || price <= 0)) {
        throw new Error('Pullik video uchun narx > 0 bo‘lishi kerak')
      }
      const body = {
        ...edit,
        title: edit.title.trim(),
        description: (edit.description || '').trim(),
        thumbUrl: (edit.thumbUrl || '').trim() || undefined,
        category: (edit.category || '').trim() || undefined,
        tags: (edit.tags || []).map(s => String(s).trim()).filter(Boolean),
        url: edit.url.trim(),
        price,
      }
      const r = await fetch(`/api/admin/videos/${edit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const txt = await r.text()
      let j: any = {}
      try { j = JSON.parse(txt) } catch {}
      if (!r.ok || !j?.ok) throw new Error(j?.error || txt || 'Yangilab bo‘lmadi')
      setEditing(false)
      await onUpdated()
    } catch (e: any) {
      alert(String(e?.message || e))
    }
  }

  async function remove() {
    if (!confirm('O‘chirishni tasdiqlang')) return
    try {
      const r = await fetch(`/api/admin/videos/${edit.id}`, { method: 'DELETE' })
      const txt = await r.text()
      let j: any = {}
      try { j = JSON.parse(txt) } catch {}
      if (!r.ok || !j?.ok) throw new Error(j?.error || txt || 'O‘chirishda xatolik')
      await onUpdated()
    } catch (e: any) {
      alert(String(e?.message || e))
    }
  }

  if (!editing) {
    return (
      <div className="section" style={{ display: 'grid', gap: 6 }}>
        <div style={{ fontWeight: 700 }}>
          {v.title} {v.code ? <span style={{ opacity: 0.7, fontWeight: 400 }}>• Kod: {v.code}</span>