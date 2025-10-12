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

  // load data
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
      setAmount('')
      setGiveTo('')
      alert('Tangalari yangilandi')
    } catch (e: any) {
      alert(String(e?.message || e))
    }
  }

  // validate before create
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
    if (!val.ok) {
      alert(val.msg)
      return
    }
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
      const text = await r.text()
      let j: any = {}
      try { j = JSON.parse(text) } catch { /* keep raw text */ }
      if (!r.ok || !j?.ok) {
        const serverMsg = j?.error || text || 'Video qo‘shilmadi'
        throw new Error(serverMsg)
      }
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

  return (
    <div className="container" style={{ display: 'grid', gap: 16, paddingBottom: 32, overflowX: 'hidden' }}>
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
            <input type="number" placeholder="Miqdor" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            * Musbat son → qo‘shiladi. Manfiy son → ayriladi. Masalan, -5 foydalanuvchidan 5 tanga ayiradi.
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

        {/* Videos list (READ-ONLY by default) */}
        <div style={{ display: 'grid', gap: 12 }}>
          {videos.map((v) => (
            <VideoRow key={v.id} v={v} onUpdated={refreshVideos} />
          ))}
        </div>
      </div>
    </div>
  )
}

function VideoRow({ v, onUpdated }: { v: Video; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false)
  const [edit, setEdit] = useState<Video>({ ...v })

  useEffect(() => setEdit({ ...v }), [v.id]) // sync if list refreshes

  async function save() {
    try {
      if (!edit.title.trim()) throw new Error('Sarlavha majburiy')
      if (!edit.url.trim()) throw new Error('Video URL yoki file_id majburiy')
      if (!edit.isFree && (!Number.isFinite(edit.price) || edit.price <= 0)) {
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
        price: edit.isFree ? 0 : Number(edit.price || 0),
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
    // READ-ONLY ROW
    return (
      <div className="section" style={{ display: 'grid', gap: 8 }}>
        <div style={{ fontWeight: 700 }}>
          {v.title} {v.code ? <span style={{ opacity: 0.7, fontWeight: 400 }}>• Kod: {v.code}</span> : null}
        </div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          {(v.category || '—')} {v.isFree ? ' • Bepul' : ` • ${v.price} tanga`}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => setEditing(true)}>Tahrirlash</button>
          <button className="btn" onClick={remove}>O‘chirish</button>
        </div>
      </div>
    )
  }

  // EDIT MODE (only after user clicks "Tahrirlash")
  return (
    <div className="section" style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontWeight: 700 }}>Tahrirlash: {edit.title}</div>
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
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn" onClick={save}>Saqlash</button>
        <button className="btn" onClick={() => { setEditing(false); setEdit({ ...v }) }}>Bekor qilish</button>
      </div>
    </div>
  )
}