// app/admin/page.tsx
'use client'
import { useEffect, useState } from 'react'

type User = { id: number; name: string | null; username: string | null; coins: number; isAdmin: boolean }
type Video = {
  id: number; title: string; description: string; url: string; isFree: boolean; price: number;
  thumbUrl?: string | null; category?: string | null; tags?: string[];
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [form, setForm] = useState({
    title: '', description: '', url: '', price: 0, isFree: false,
    thumbUrl: '', category: '', tags: '' // tags as comma-separated
  })

  async function load() {
    const u = await fetch('/api/admin/users').then(r => r.ok ? r.json() : [])
    const v = await fetch('/api/videos').then(r => r.ok ? r.json() : [])
    setUsers(u || []); setVideos(v || [])
  }
  useEffect(() => { load() }, [])

  async function addVideo(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      tags: form.tags, // server splits commas
    }
    const res = await fetch('/api/videos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setForm({ title: '', description: '', url: '', price: 0, isFree: false, thumbUrl: '', category: '', tags: '' })
      load()
    } else { alert('Failed to add video') }
  }

  async function saveCoins(userId: number, value: number) {
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, coins: value }),
    })
    if (res.ok) load(); else alert('Failed to save')
  }

  return (
    <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr 1fr' }}>
      <section style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 12 }}>Add Video (link)</h2>
        <form onSubmit={addVideo} style={{ display: 'grid', gap: 8 }}>
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <input placeholder="Direct video URL (Yandex Disk public link)" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
          <input placeholder="Thumbnail URL (optional)" value={form.thumbUrl} onChange={e => setForm({ ...form, thumbUrl: e.target.value })} />
          <div style={{ display: 'flex', gap: 12 }}>
            <input placeholder="Category (e.g., Coaching, Sales)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            <input placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={form.isFree} onChange={e => setForm({ ...form, isFree: e.target.checked })} />
              Free
            </label>
            <input type="number" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
          </div>
          <button type="submit">Add Video</button>
        </form>
      </section>

      <section style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 12 }}>Users (give coins)</h2>
        <div style={{ display: 'grid', gap: 8, maxHeight: 500, overflow: 'auto' }}>
          {users.map(u => (
            <div key={u.id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{u.name || u.username || `tg_${u.id}`}</div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>Coins: {u.coins} · {u.isAdmin ? 'Admin' : 'User'}</div>
              </div>
              <input type="number" defaultValue={u.coins} id={`coins-${u.id}`} style={{ width: 100 }} />
              <button onClick={() => {
                const val = Number((document.getElementById(`coins-${u.id}`) as HTMLInputElement).value)
                saveCoins(u.id, val)
              }}>Save</button>
            </div>
          ))}
        </div>
      </section>

      <section style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 12 }}>Videos</h2>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {videos.map(v => (
            <div key={v.id} style={{ background: 'rgba(0,0,0,0.35)', padding: 12, borderRadius: 12 }}>
              <div style={{
                background: 'rgba(255,255,255,0.06)',
                height: 140,
                borderRadius: 8,
                marginBottom: 8,
                backgroundImage: v.thumbUrl ? `url(${v.thumbUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }} />
              <div style={{ fontWeight: 700 }}>{v.title}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {(v.category ? `${v.category} · ` : '') + (v.tags?.length ? v.tags.join(', ') : '')}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{v.isFree ? 'Free' : `Price: ${v.price}`}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
