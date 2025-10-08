// app/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import '../globals.css'

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
    } finally { setLoading(false) }
  }

  const save = async (id: number) => {
    setLoading(true)
    try {
      const payload: any = { ...edit }
      if (typeof payload.tags === 'string') {
        payload.tags = payload.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
      }
      await fetch(`/api/admin/videos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      setEdit({})
      await load()
    } finally { setLoading(false) }
  }

  const remove = async (id: number) => {
    if (!confirm('O‘chirishni tasdiqlaysizmi?')) return
    setLoading(true)
    try {
      await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' })
      await load()
    } finally { setLoading(false) }
  }

  return (
    <div className="container" style={{ display: 'grid', gap: 14 }}>
      <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>Admin</h1>

      {/* Create */}
      <div className="section form-grid">
        <div style={{ fontWeight: 700 }}>Yangi video qo‘shish</div>
        <input placeholder="Kod (masalan: 013)" value={newV.code || ''} onChange={e => setNewV({ ...newV, code: e.target.value })} />
        <input placeholder="Sarlavha" value={newV.title || ''} onChange={e => setNewV({ ...newV, title: e.target.value })} />
        <textarea placeholder="Tavsif" value={newV.description || ''} onChange={e => setNewV({ ...newV, description: e.target.value })} />
        <input placeholder="Poster URL yoki file_id:..." value={newV.thumbUrl || ''} onChange={e => setNewV({ ...newV, thumbUrl: e.target.value })} />
        <input placeholder="Kategoriya (ixtiyoriy)" value={newV.category || ''} onChange={e => setNewV({ ...newV, category: e.target.value })} />
        <input placeholder="Teglar (vergul bilan)" value={(new