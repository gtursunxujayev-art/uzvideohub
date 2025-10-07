// app/admin/page.tsx
'use client'
import { useEffect, useState } from 'react'

type User = { id: number; name: string | null; username: string | null; coins: number; isAdmin: boolean }
type Video = {
  id: number; title: string; description: string; url: string; isFree: boolean; price: number;
  thumbUrl?: string | null; category?: string | null; tags?: string[];
}
type Txn = { id: number; userId: number; adminId?: number | null; delta: number; reason?: string | null; createdAt: string; user?: any; admin?: any }

// For the "add new" form
type NewForm = {
  title: string; description: string; url: string; price: number; isFree: boolean;
  thumbUrl: string; category: string; tags: string; // tags as comma-separated string
}

// For the edit form: keep tags as string for the input; convert before sending
type EditForm = {
  title?: string
  description?: string
  url?: string
  price?: number
  isFree?: boolean
  thumbUrl?: string
  category?: string
  tags?: string // comma-separated for the input
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [history, setHistory] = useState<Txn[]>([])
  const [selectedUser, setSelectedUser] = useState<number | ''>('')
  const [delta, setDelta] = useState<number>(0)
  const [reason, setReason] = useState<string>('')

  const [form, setForm] = useState<NewForm>({
    title: '', description: '', url: '', price: 0, isFree: false, thumbUrl: '', category: '', tags: ''
  })

  const [editId, setEditId] = useState<number | null>(null)
  const [edit, setEdit] = useState<EditForm>({})

  async function load() {
    const u = await fetch('/api/admin/users').then(r => r.ok ? r.json() : [])
    const v = await fetch('/api/videos').then(r => r.ok ? r.json() : [])
    const h = await fetch('/api/admin/coins/history').then(r => r.ok ? r.json() : [])
    setUsers(u || []); setVideos(v || []); setHistory(h || [])
  }
  useEffect(() => { load() }, [])

  async function addVideo(e: React.FormEvent) {
    e.preventDefault()
    const payload = { ...form } // server splits comma-separated tags
    const res = await fetch('/api/videos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      setForm({ title: '', description: '', url: '', price: 0, isFree: false, thumbUrl: '', category: '', tags: '' })
      load()
    } else {
      alert('Failed to add video')
    }
  }

  async function saveCoins() {
    if (!selectedUser) return alert('Select a user')
    const res = await fetch('/api/admin/coins', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: Number(selectedUser), delta: Number(delta), reason }),
    })
    if (res.ok) { setDelta(0); setReason(''); load() } else alert('Failed')
  }

  function beginEdit(v: Video) {
    setEditId(v.id)
    setEdit({
      title: v.title,
      description: v.description,
      url: v.url,
      price: v.price,
      isFree: v.isFree,
      thumbUrl: v.thumbUrl || '',
      category: v.category || '',
      tags: (v.tags && v.tags.length ? v.tags.join(', ') : ''),
    })
  }

  async function saveEdit() {
    if (!editId) return
    // Convert tags string → array (server also accepts string, but this keeps it clean)
    const payload: any = {
      ...edit,
      tags: typeof edit.tags === 'string'
        ? edit.tags.split(',').map(t => t.trim()).filter(Boolean)
        : edit.tags,
    }
    const res = await fetch(`/api/admin/videos/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) { setEditId(null); setEdit({}); load() } else alert('Failed to update')
  }

  async function delVideo(id: number) {
    if (!confirm('Delete this video?')) return
    const res = await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' })
    if (res.ok) load(); else alert('Failed to delete')
  }

  return (
    <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr 1fr' }}>
      {/* Add Video */}
      <section style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 12 }}>Add Video (link)</h2>
        <form onSubmit={addVideo} style={{ display: 'grid', gap: 8 }}>
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <input placeholder="Direct video URL (Yandex Disk public link)" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
          <input placeholder="Thumbnail URL (optional)" value={form.thumbUrl} onChange={e => setForm({ ...form, thumbUrl: e.target.value })} />
          <div style={{ display: 'flex', gap: 12 }}>
            <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
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

      {/* Coins Manager */}
      <section style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 12 }}>Coins (add/remove)</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Select user…</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {(u.name || u.username || `tg_${u.id}`)} — {u.coins} coins
              </option>
            ))}
          </select>
          <input type="number" placeholder="Delta (e.g., 10 or -5)" value={delta} onChange={e => setDelta(Number(e.target.value))} />
          <input placeholder="Reason (optional)" value={reason} onChange={e => setReason(e.target.value)} />
          <button onClick={saveCoins}>Apply</button>
        </div>
      </section>

      {/* Users quick list */}
      <section style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 12 }}>Users</h2>
        <div style={{ display: 'grid', gap: 8, maxHeight: 420, overflow: 'auto' }}>
          {users.map(u => (
            <div key={u.id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{u.name || u.username || `tg_${u.id}`}</div>
                <div style={{ opacity: 0.7, fontSize: 12 }}>Coins: {u.coins} · {u.isAdmin ? 'Admin' : 'User'}</div>
              </div>
              <input type="number" defaultValue={u.coins} id={`coins-${u.id}`} style={{ width: 100 }} />
              <button onClick={async () => {
                const val = Number((document.getElementById(`coins-${u.id}`) as HTMLInputElement).value)
                const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: u.id, coins: val }) })
                if (res.ok) load(); else alert('Failed')
              }}>Set</button>
            </div>
          ))}
        </div>
      </section>

      {/* Videos manage (edit/delete) */}
      <section style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 12 }}>Videos</h2>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {videos.map(v => (
            <div key={v.id} style={{ background: 'rgba(0,0,0,0.35)', padding: 12, borderRadius: 12 }}>
              <div style={{
                height: 140, borderRadius: 8, marginBottom: 8,
                background: 'rgba(255,255,255,0.06)',
                backgroundImage: v.thumbUrl ? `url(${v.thumbUrl})` : undefined,
                backgroundSize: 'cover', backgroundPosition: 'center'
              }} />
              {editId === v.id ? (
                <div style={{ display: 'grid', gap: 6 }}>
                  <input placeholder="Title" defaultValue={v.title} onChange={e => setEdit({ ...edit, title: e.target.value })} />
                  <input placeholder="Thumb URL" defaultValue={v.thumbUrl || ''} onChange={e => setEdit({ ...edit, thumbUrl: e.target.value })} />
                  <input placeholder="Category" defaultValue={v.category || ''} onChange={e => setEdit({ ...edit, category: e.target.value })} />
                  <input placeholder="Tags (comma separated)" defaultValue={v.tags?.join(', ') || ''} onChange={e => setEdit({ ...edit, tags: e.target.value })} />
                  <input placeholder="URL" defaultValue={v.url} onChange={e => setEdit({ ...edit, url: e.target.value })} />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="checkbox" defaultChecked={v.isFree} onChange={e => setEdit({ ...edit, isFree: e.target.checked })} /> Free
                    </label>
                    <input type="number" defaultValue={v.price} onChange={e => setEdit({ ...edit, price: Number(e.target.value) })} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveEdit}>Save</button>
                    <button onClick={() => { setEditId(null); setEdit({}) }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontWeight: 700 }}>{v.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.7, margin: '4px 0' }}>
                    {(v.category ? `${v.category} · ` : '') + (v.tags?.length ? v.tags.join(', ') : '')}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>{v.isFree ? 'Free' : `Price: ${v.price}`}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => beginEdit(v)}>Edit</button>
                    <button onClick={() => delVideo(v.id)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Coins History */}
      <section style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 12 }}>Coins History (latest)</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', opacity: 0.8 }}>
                <th style={{ padding: 8 }}>Time</th>
                <th style={{ padding: 8 }}>User</th>
                <th style={{ padding: 8 }}>Delta</th>
                <th style={{ padding: 8 }}>Reason</th>
                <th style={{ padding: 8 }}>Admin</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                  <td style={{ padding: 8 }}>{new Date(h.createdAt).toLocaleString()}</td>
                  <td style={{ padding: 8 }}>{h.user?.name || h.user?.username || `#${h.userId}`}</td>
                  <td style={{ padding: 8, color: h.delta >= 0 ? '#6fff8b' : '#ff6f6f' }}>{h.delta > 0 ? `+${h.delta}` : h.delta}</td>
                  <td style={{ padding: 8 }}>{h.reason || ''}</td>
                  <td style={{ padding: 8 }}>{h.admin?.name || h.admin?.username || (h.adminId ? `#${h.adminId}` : '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
