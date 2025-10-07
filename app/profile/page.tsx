// app/profile/page.tsx
'use client'

import { useEffect, useState } from 'react'

type Me = { user: { id: number; username: string | null; coins: number } | null }

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null)
  const [username, setUsername] = useState('')

  async function load() {
    const j = await fetch('/api/me').then(r => r.json()).catch(() => null)
    setMe(j)
    if (j?.user?.username) setUsername(j.user.username)
  }

  useEffect(() => { load() }, [])

  async function saveUsername() {
    const r = await fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
    if (r.ok) { await load(); alert('Saqlandi') } else { alert('Saqlashda xatolik') }
  }

  if (!me) return <div>Yuklanmoqda…</div>
  if (!me.user) return <div>Iltimos, Telegram orqali tizimga kiring.</div>

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 560 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24 }}>Profil</h1>

      <div style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
        <div style={{ marginBottom: 8 }}><b>Tangalar:</b> {me.user.coins}</div>
        <button onClick={() => { window.location.href = 'https://t.me/videohubtolovbot' }}>
          Tangalarni sotib olish
        </button>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
        <div style={{ marginBottom: 8, fontWeight: 700 }}>Foydalanuvchi nomi</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="foydalanuvchi_nomi" value={username} onChange={e => setUsername(e.target.value)} />
          <button onClick={saveUsername}>Saqlash</button>
        </div>
        <div style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>
          Bu nom videolarda ko‘rsatilishi mumkin.
        </div>
      </div>
    </div>
  )
}
