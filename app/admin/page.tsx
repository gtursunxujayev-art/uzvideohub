// app/admin/page.tsx
'use client'
import { useEffect, useState } from 'react'

type User = { id: number; name: string | null; username: string | null; coins: number; isAdmin: boolean }
type Video = {
  id: number; title: string; description: string; url: string; isFree: boolean; price: number;
  thumbUrl?: string | null; category?: string | null; tags?: string[];
}
type Txn = { id: number; userId: number; adminId?: number | null; delta: number; reason?: string | null; createdAt: string; user?: any; admin?: any }

type NewForm = { title: string; description: string; url: string; price: number; isFree: boolean; thumbUrl: string; category: string; tags: string }
type EditForm = { title?: string; description?: string; url?: string; price?: number; isFree?: boolean; thumbUrl?: string; category?: string; tags?: string }

function isYandexLink(u?: string | null) {
  const s = u || ''
  return s.includes('disk.yandex') || s.includes('yadi.sk')
}
function extractFileId(val?: string | null): string | null {
  if (!val) return null
  let s = val.trim()
  if (s.startsWith('file_id:')) s = s.slice('file_id:'.length)
  if (!s.includes('://') && s.length > 30) return s
  return null
}
async function resolveYandexPublic(link: string): Promise<string> {
  try {
    const r = await fetch(`/api/yandex/resolve?url=${encodeURIComponent(link)}`)
    const j = await r.json()
    if (j?.ok && j?.href) return j.href as string
  } catch {}
  return link
}
async function resolveThumb(input?: string | null): Promise<string> {
  if (!input) return ''
  const fid = extractFileId(input)
  if (fid) return `/api/telegram/file?file_id=${encodeURIComponent(fid)}`
  if (isYandexLink(input)) return resolveYandexPublic(input)
  return input
}

export default function AdminPage() {
  const [me, setMe] = useState<{ user: { isAdmin: boolean } | null } | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [thumbs, setThumbs] = useState<Record<number, string>>({})
  const [history, setHistory] = useState<Txn[]>([])
  const [selectedUser, setSelectedUser] = useState<number | ''>('')
  const [delta, setDelta] = useState<number>(0)
  const [reason, setReason] = useState<string>('')

  const [form, setForm] = useState<NewForm>({ title: '', description: '', url: '', price: 0, isFree: false, thumbUrl: '', category: '', tags: '' })
  const [editId, setEditId] = useState<number | null>(null)
  const [edit, setEdit] = useState<EditForm>({})

  async function loadAll() {
    const meRes = await fetch('/api/me').then(r => r.json()).catch(() => null)
    setMe(meRes)
    if (!meRes?.user?.isAdmin) return
    const u = await fetch('/api/admin/users').then(r => r.ok ? r.json() : [])
    const v: Video[] = await fetch('/api/videos').then(r => r.ok ? r.json() : [])
    const h = await fetch('/api/admin/coins/history').then(r => r.ok ? r.json() : [])
    setUsers(u || []); setVideos(v || []); setHistory(h || [])
    // resolve thumbs for preview
    const out: Record<number, string> = {}
    await Promise.all(v.map(async (vv) => { out[vv.id] = await resolveThumb(vv.thumbUrl || '') }))
    setThumbs(out)
  }
  useEffect(() => { loadAll() }, [])

  if (me && !me.user?.isAdmin) {
    return <div style={{ padding: 16 }}>Kirish taqiqlangan. Bu sahifa faqat adminlar uchun.</div>
  }
  if (!me) return <div>Yuklanmoqda...</div>

  async function addVideo(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/videos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) { setForm({ title: '', description: '', url: '', price: 0, isFree: false, thumbUrl: '', category: '', tags: '' }); loadAll() }
    else alert('Video qo‘shishda xatolik')
  }
  async function saveCoins() {
    if (!selectedUser) return alert('Foydalanuvchini tanlang')
    const res = await fetch('/api/admin/coins', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: Number(selectedUser), delta: Number(delta), reason }),
    })
    if (res.ok) { setDelta(0); setReason(''); loadAll() } else alert('Saqlashda xatolik')
  }
  function beginEdit(v: Video) {
    setEditId(v.id)
    setEdit({ title: v.title, description: v.description, url: v.url, price: v.price, isFree: v.isFree, thumbUrl: v.thumbUrl || '', category: v.category || '', tags: (v.tags?.join(', ') || '') })
  }
  async function saveEdit() {
    if (!editId) return
    const payload: any = { ...edit, tags: typeof edit.tags === 'string' ? edit.tags.split(',').map(t => t.trim()).filter(Boolean) : edit.tags }
    const res = await fetch(`/api/admin/videos/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) { setEditId(null); setEdit({}); loadAll() } else alert('Yangilashda xatolik')
  }
  async function delVideo(id: number) {
    if (!confirm('Videoni o‘chirishni tasdiqlaysizmi?')) return
    const res = await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' })
    if (res.ok) loadAll(); else alert('O‘chirishda xatolik')
  }

  return (
    <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr 1fr' }}>
      <section style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 12 }}>Video qo‘shish (havola yoki file_id)</h2>
        <form onSubmit={addVideo} style={{ display: 'grid', gap: 8 }}>
          <input placeholder="Sarlavha" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <textarea placeholder="Tavsif" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <input placeholder="Video URL yoki file_id:XXXX" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
          <input placeholder="Poster/thumbnail URL yoki file_id:XXXX" value={form.thumbUrl} onChange={e => setForm({ ...form, thumbUrl: e.target.value })} />
          <div style={{ display: 'flex', gap: 12 }}>
            <input placeholder="Kategoriya" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            <input placeholder="Teglar (vergul bilan)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="checkbox" checked={form.isFree} onChange={e => setForm({ ...form, isFree: e.target.checked })} />
              Bepul
            </label>
            <input type="number" placeholder="Narx (tanga)" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
          </div>
          <button type="submit">Qo‘shish</button>
        </form>
      </section>

      <section style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 12 }}>Tanga boshqaruvi</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Foydalanuvchini tanlang…</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {(u.name || u.username || `tg_${u.id}`)} — {u.coins} tanga
              </option>
            ))}
          </select>
          <input type="number" placeholder="O‘zgarish (masalan 10 yoki -5)" value={delta} onChange={e => setDelta(Number(e.target.value))} />
          <input placeholder="Sabab (ixtiyoriy)" value={reason} onChange={e => setReason(e.target.value)} />
          <button onClick={saveCoins}>Qo‘llash</button>
        </div>
      </section>

      <section style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 12 }}>Videolar</h2>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {videos.map(v => (
            <div key={v.id} style={{ background: 'rgba(0,0,0,0.35)', padding: 12, borderRadius: 12 }}>
              <div style={{
                height: 140, borderRadius: 8, marginBottom: 8,
                background: 'rgba(255,255,255,0.06)',
                backgroundImage: thumbs[v.id] ? `url(${thumbs[v.id]})` : undefined,
                backgroundSize: 'cover', backgroundPosition: 'center'
              }} />
              {editId === v.id ? (
                <div style={{ display: 'grid', gap: 6 }}>
                  <input placeholder="Sarlavha" defaultValue={v.title} onChange={e => setEdit({ ...edit, title: e.target.value })} />
                  <input placeholder="Poster URL yoki file_id:XXXX" defaultValue={v.thumbUrl || ''} onChange={e => setEdit({ ...edit, thumbUrl: e.target.value })} />
                  <input placeholder="Kategoriya" defaultValue={v.category || ''} onChange={e => setEdit({ ...edit, category: e.target.value })} />
                  <input placeholder="Teglar (vergul bilan)" defaultValue={v.tags?.join(', ') || ''} onChange={e => setEdit({ ...edit, tags: e.target.value })} />
                  <input placeholder="Video URL yoki file_id:XXXX" defaultValue={v.url} onChange={e => setEdit({ ...edit, url: e.target.value })} />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="checkbox" defaultChecked={v.isFree} onChange={e => setEdit({ ...edit, isFree: e.target.checked })} /> Bepul
                    </label>
                    <input type="number" defaultValue={v.price} onChange={e => setEdit({ ...edit, price: Number(e.target.value) })} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={saveEdit}>Saqlash</button>
                    <button onClick={() => { setEditId(null); setEdit({}) }}>Bekor qilish</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontWeight: 700 }}>{v.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.7, margin: '4px 0' }}>
                    {(v.category ? `${v.category} · ` : '') + (v.tags?.length ? v.tags.join(', ') : '')}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>{v.isFree ? 'Bepul' : `Narx: ${v.price} tanga`}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => beginEdit(v)}>Tahrirlash</button>
                    <button onClick={() => delVideo(v.id)}>O‘chirish</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 12 }}>Tanga tarix (so‘nggi)</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', opacity: 0.8 }}>
                <th style={{ padding: 8 }}>Vaqt</th>
                <th style={{ padding: 8 }}>Foydalanuvchi</th>
                <th style={{ padding: 8 }}>O‘zgarish</th>
                <th style={{ padding: 8 }}>Sabab</th>
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
