// app/leaderboard/page.tsx
'use client'
import { useEffect, useState } from 'react'

type Entry = { id: number; name: string; count: number; coins: number }
type Invite = { id: number; displayName?: string | null; username?: string | null; coins: number; createdAt: string }

export default function LeaderboardPage() {
  const [data, setData] = useState<{ leaderboard: Entry[]; myInvites: Invite[] } | null>(null)

  useEffect(() => {
    ;(async () => {
      const j = await fetch('/api/referrals', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ leaderboard: [], myInvites: [] }))
      setData(j)
    })()
  }, [])

  if (!data) return <div>Yuklanmoqda...</div>

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <h1 style={{ fontWeight: 800, fontSize: 26 }}>🔝 Takliflar reytingi</h1>

      {/* Promo banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(255,153,0,0.15), rgba(255,153,0,0.05))',
        border: '1px solid rgba(255,153,0,0.35)',
        padding: 14, borderRadius: 12, fontWeight: 700
      }}>
        Har bir taklif qilgan do‘stingiz uchun <b>5 tanga</b> bonus oling.
      </div>

      <div style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 12 }}>Eng faol foydalanuvchilar</h2>
        {data.leaderboard.length === 0 && <div>Hali hech kim taklif qilmagan.</div>}
        <div style={{ display: 'grid', gap: 6 }}>
          {data.leaderboard.map((u, i) => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
              <div>{i + 1}. {u.name}</div>
              <div>{u.count} ta</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 12 }}>Sizning takliflaringiz</h2>
        {data.myInvites.length === 0 && <div>Hozircha hech kim sizning havolangiz orqali ro‘yxatdan o‘tmagan.</div>}
        <div style={{ display: 'grid', gap: 8 }}>
          {data.myInvites.map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <div>{u.displayName || u.username || `#${u.id}`}</div>
              <div style={{ opacity: 0.8 }}>{u.coins} tanga</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
