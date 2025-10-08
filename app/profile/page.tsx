// app/profile/page.tsx
'use client'

import { useEffect, useState } from 'react'
import '../globals.css'

declare global {
  interface Window { Telegram?: any }
}

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

async function createStarsInvoice(bundle: string) {
  const r = await fetch('/api/payments/stars/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bundle }),
  }).then(r => r.json())
  return r as { ok: boolean; link?: string; error?: string; open?: string }
}

export default function ProfilePage() {
  const [me, setMe] = useState<MeRes | null>(null)
  const [refCode, setRefCode] = useState<string>('')
  const [refLink, setRefLink] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      try {
        const m: MeRes = await fetch('/api/me', { cache: 'no-store' }).then(r => r.json())
        setMe(m || { user: null })
        if (m?.user) {
          const r = await fetch('/api/profile/refcode', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ code: '' }))
          const code = r?.code || ''
          setRefCode(code)
          const botUser = process.env.NEXT_PUBLIC_TG_BOT_USERNAME
          if (botUser) setRefLink(`https://t.me/${botUser}?start=ref_${code}`)
          else setRefLink(`${location.origin}/tg?ref=${code}`)
        }
      } catch { setMe({ user: null }) }
    })()
  }, [])

  if (!me?.user) return <div className="container">Profilga kirish talab etiladi.</div>

  const display = me.user.displayName || me.user.username || me.user.name || `#${me.user.id}`

  const openInvoice = async (bundle: string) => {
    const j = await createStarsInvoice(bundle)
    if (!j.ok) { if (j.open) window.location.href = j.open; return }
    const link = j.link!
    const wa = window.Telegram?.WebApp
    if (wa?.openInvoice) {
      wa.openInvoice(link, (status: string) => { if (status === 'paid') window.location.reload() })
    } else {
      window.open(link, '_blank')
    }
  }

  return (
    <div className="container" style={{ display: 'grid', gap: 14 }}>
      <h1 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>Profil</h1>

      <div className="section form-grid">
        <div><b>Foydalanuvchi:</b> {display}</div>
        <div><b>Tangalar:</b> {me.user.coins}</div>
      </div>

      <div className="section form-grid">
        <div style={{ fontWeight: 700, fontSize: 18 }}>Do‘stlarni taklif etish (referal)</div>
        <div style={{
          background: 'linear-gradient(90deg, rgba(255,153,0,0.15), rgba(255,153,0,0.05))',
          border: '1px solid rgba(255,153,0,0.35)',
          padding: 10, borderRadius: 10, fontWeight: 700
        }}>
          Har bir taklif qilgan do‘stingiz uchun <b>5 tanga</b> bonus oling.
        </div>
        <div style={{ opacity: 0.85, fontSize: 14 }}>
          Havolangiz orqali kelgan yangi foydalanuvchi ro‘yxatdan o‘tsa — sizga bonus tangalar beriladi.
        </div>
        <div className="form-inline">
          <span><b>Kod:</b> {refCode}</span>
          <input readOnly value={refLink} />
          <button className="btn" onClick={() => navigator.clipboard.writeText(refLink)}>Nusxalash</button>
        </div>
      </div>

      <div className="section form-grid">
        <div style={{ fontWeight: 700, fontSize: 18 }}>Tangalarni sotib olish (Telegram Stars)</div>
        <div className="actions">
          <button className="btn" onClick={() => openInvoice('s10')}>10 tanga — 10⭐</button>
          <button className="btn" onClick={() => openInvoice('s50')}>50 tanga — 50⭐</button>
          <button className="btn" onClick={() => openInvoice('s100')}>100 tanga — 100⭐</button>
        </div>
        <small style={{ opacity: 0.75 }}>To‘lov Telegram Stars orqali amalga oshiriladi — xavfsiz va tez.</small>
      </div>
    </div>
  )
}