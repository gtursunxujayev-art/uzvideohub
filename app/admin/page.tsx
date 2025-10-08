// app/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'

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

export default function AdminPage() {
  const [list, setList] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)

  const [newV, setNewV] = useState<Partial<Video>>({ isFree: false, price: 0 })
  const [edit, setEdit] = useState<Partial<Video> & { id?: number }>({})

  const load = async () => {
    const r = await fetch('/api/videos?limit=200', { cache: 'no-store' })
    const j = await r.json()
    setList(j.items || [])
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video: newV })
      })
      await r.json()
      setNewV({ isFree: false, price: 0 })
      await load()
    } finally {
      setLoading(false)
    }
  }

  const save = async (id: number) => {
    setLoading(true)
    try {
      const payload: any = { ...edit }
      if (typeof payload.tags === 'string') {
        payload.tags = payload.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
      }
      const r = await fetch(`/api/admin/videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      await r.json()
      setEdit({})
      await load()
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: number) => {
    if (!confirm('O‘chirishni tasdiqlaysizmi?')) return
    setLoading(true)
    try {
      await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' })
      await load()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24 }}>Admin</h1>

      {/* Create */}
      <div style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12, display: 'grid', gap: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Yangi video qo‘shish</div>
        <input placeholder="Kod (masalan: 013)" value={newV.code || ''} onChange={e => setNewV({ ...newV, code: e.target.value })} />
        <input placeholder="Sarlavha" value={newV.title || ''} onChange={e => setNewV({ ...newV, title: e.target.value })} />
        <textarea placeholder="Tavsif" value={newV.description || ''} onChange={e => setNewV({ ...newV, description: e.target.value })} />
        <input placeholder="Poster URL yoki file_id:..." value={newV.thumbUrl || ''} onChange={e => setNewV({ ...newV, thumbUrl: e.target.value })} />
        <input placeholder="Kategoriya (ixtiyoriy)" value={newV.category || ''} onChange={e => setNewV({ ...newV, category: e.target.value })} />
        <input placeholder="Teglar (vergul bilan)" value={(newV.tags as any) || ''} onChange={e => setNewV({ ...newV, tags: e.target.value as any })} />
        <input placeholder="Video URL yoki file_id:..." value={newV.url || ''} onChange={e => setNewV({ ...newV, url: e.target.value })} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label><input type="checkbox" checked={!!newV.isFree} onChange={e => setNewV({ ...newV, isFree: e.target.checked })} /> Bepul</label>
          <input type="number" placeholder="Narx (tanga)" value={newV.price || 0} onChange={e => setNewV({ ...newV, price: parseInt(e.target.value || '0', 10) })} />
        </div>
        <button disabled={loading} onClick={create}>Qo‘shish</button>
      </div>

      {/* List */}
      <div style={{ display: 'grid', gap: 12 }}>
        {list.map(v => {
          const isEditing = edit.id === v.id
          return (
            <div key={v.id} style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12, display: 'grid', gap: 8 }}>
              {!isEditing ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{v.title}</div>
                      <div style={{ opacity: 0.8, fontSize: 13 }}>
                        {v.code ? `Kod: ${v.code} • ` : ''}{v.category || 'Kategoriya yo‘q'} • {v.isFree ? 'Bepul' : `${v.price} tanga`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setEdit(v)}>Tahrirlash</button>
                      <button onClick={() => remove(v.id)}>O‘chirish</button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <input placeholder="Kod (masalan: 013)" defaultValue={v.code || ''} onChange={e => setEdit({ ...edit, code: e.target.value })} />
                  <input placeholder="Sarlavha" defaultValue={v.title} onChange={e => setEdit({ ...edit, title: e.target.value })} />
                  <textarea placeholder="Tavsif" defaultValue={v.description} onChange={e => setEdit({ ...edit, description: e.target.value })} />
                  <input placeholder="Poster URL yoki file_id:..." defaultValue={v.thumbUrl || ''} onChange={e => setEdit({ ...edit, thumbUrl: e.target.value })} />
                  <input placeholder="Kategoriya (ixtiyoriy)" defaultValue={v.category || ''} onChange={e => setEdit({ ...edit, category: e.target.value })} />
                  <input placeholder="Teglar (vergul bilan)" defaultValue={v.tags?.join(', ') || ''} onChange={e => setEdit({ ...edit, tags: e.target.value as any })} />
                  <input placeholder="Video URL yoki file_id:..." defaultValue={v.url} onChange={e => setEdit({ ...edit, url: e.target.value })} />
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <label><input type="checkbox" defaultChecked={v.isFree} onChange={e => setEdit({ ...edit, isFree: e.target.checked })} /> Bepul</label>
                    <input type="number" placeholder="Narx (tanga)" defaultValue={v.price} onChange={e => setEdit({ ...edit, price: parseInt(e.target.value || '0', 10) })} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button disabled={loading} onClick={() => save(v.id)}>Saqlash</button>
                    <button onClick={() => setEdit({})}>Bekor qilish</button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
