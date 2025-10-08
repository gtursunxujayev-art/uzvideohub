// app/tg/page.tsx
'use client'

import { useEffect, useState } from 'react'

/**
 * This page is opened as Telegram WebApp (or normal web).
 * If ?ref=<code> is present, we keep it and send it along during webapp auth.
 * Your Telegram webapp init code on the client can POST to /api/auth/telegram/webapp
 * with tgId/username/displayName and the stored ref code.
 */

export default function TgGate() {
  const [msg, setMsg] = useState('Yuklanmoqda...')
  const [ok, setOk] = useState<boolean>(false)

  useEffect(() => {
    try {
      const u = new URL(window.location.href)
      const ref = u.searchParams.get('ref')
      if (ref) localStorage.setItem('uzvh_ref', ref)
      setOk(true)
      setMsg('Telegram ilovasi ishga tushdi.')
    } catch {
      setMsg('Xatolik.')
    }
  }, [])

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h1 style={{ fontWeight: 800, fontSize: 22 }}>Telegram</h1>
      <div>{msg}</div>
      <a href="/" style={{ color: '#ff9900' }}>Bosh sahifaga qaytish</a>
      {ok ? <small style={{ opacity: 0.7 }}>Agar siz havola orqali kelgan bo‘lsangiz, referral kodi saqlandi.</small> : null}
    </div>
  )
}
