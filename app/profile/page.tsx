// app/profile/page.tsx
'use client'

import { useEffect, useState } from 'react'

type MeRes = {
  user: {
    id: number
    username?: string | null
    name?: string | null
    displayName?: string | null
    coins: number
    isAdmin?: boolean
    referralCode?: string | null
  } | null
}

export default function ProfilePage() {
  const [me, setMe] = useState<MeRes | null>(null)
  const [refCode, setRefCode] = useState<string>('')
  const [refLink, setRefLink] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      try {
        // Load current user
        const m: MeRes = await fetch('/api/me', { cache: 'no-store' }).then(r => r.json())
        setMe(m || { user: null })

        if (m?.user) {
          // If user has no code yet, ask server to ensure/generate one
          const r = await fetch('/api/profile/refcode', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ code: '' }))
          const code = r?.code || ''
          setRefCode(code)

          const botUser = process.env.NEXT_PUBLIC_TG_BOT_USERNAME
          if (botUser) {
            setRefLink(`https://t.me/${botUser}?start=ref_${code}`)
          } else {
            // fallback to web deep link
            setRefLink(`${location.origin}/tg?ref=${code}`)
          }
        }
      } catch {
        setMe({ user: null })
      }
    })()
  }, [])

  if (!me?.user) return <div>Profilga kirish talab etiladi.</div>

  const display = me.user.displayName || me.user.username || me.user.name || `#${me.user.id}`

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24 }}>Profil</h1>

      <div style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12, display: 'grid', gap: 8 }}>
        <div><b>Foydalanuvchi:</b> {display}</div>
        <div><b>Tangalar:</b> {me.user.coins}</div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12, display: 'grid', gap: 8 }}>
        <div style={{ fontWeight: 700 }}>Do‘stlarni taklif etish (referal)</div>
        <div style={{ fontSize: 14, opacity: 0.85 }}>
          Havolangiz orqali kelgan yangi foydalanuvchi ro‘yxatdan o‘tsa — sizga <b>bonus tangalar</b> beriladi.
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <div><b>Kod:</b> {refCode}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input readOnly value={refLink} style={{ flex: 1 }} />
            <button onClick={() => navigator.clipboard.writeText(refLink)}>Nusxalash</button>
          </div>
          <small style={{ opacity: 0.7 }}>Ulashish: Telegram, Instagram va boshqalar.</small>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.06)', padding: 16, borderRadius: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Tangalarni to‘ldirish</div>
        <a href="https://t.me/videohubtolovbot" target="_blank" rel="noreferrer">
          <button>Sotib olish (Telegram)</button>
        </a>
      </div>
    </div>
  )
}
