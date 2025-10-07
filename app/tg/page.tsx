// app/tg/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    Telegram?: any
  }
}

export default function TgWebAppLogin() {
  const [status, setStatus] = useState<'init' | 'checking' | 'ok' | 'err'>('init')
  const [err, setErr] = useState<string>('')

  async function tryAuth() {
    try {
      const wa = window.Telegram?.WebApp
      if (!wa) { setErr('Telegram WebApp ichida ochilmadi'); setStatus('err'); return }
      try { wa.ready?.() } catch {}
      const initData = wa.initData || ''
      if (!initData) { setErr('initData topilmadi'); setStatus('err'); return }
      const res = await fetch('/api/auth/telegram/webapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData }) })
      const j = await res.json()
      if (!res.ok || !j.ok) { setErr(j.error || 'Kirishda xatolik'); setStatus('err'); return }
      setStatus('ok'); window.location.href = '/'
    } catch (e: any) { setErr(String(e?.message || e)); setStatus('err') }
  }

  useEffect(() => {
    setStatus('checking')
    if (window.Telegram?.WebApp) { tryAuth(); return }
    const t = setTimeout(() => { tryAuth() }, 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <h1 style={{ fontWeight: 800, fontSize: 22, marginBottom: 12 }}>Telegram orqali kirish</h1>
      {status === 'init' || status === 'checking' ? <div>Tekshirilmoqda…</div> : null}
      {status === 'ok' ? <div>Kirdingiz. Yo‘naltirilmoqda…</div> : null}
      {status === 'err' ? (
        <div style={{ color: '#ff6f6f', marginTop: 8 }}>
          <div style={{ marginBottom: 8 }}>Xatolik: {err}</div>
          <div style={{ opacity: 0.8 }}>
            Iltimos, ushbu sahifani <b>Telegram ilovasida</b> oching:
            <ol style={{ marginTop: 8 }}>
              <li>Telegram mobil ilovasida botingizga kiring.</li>
              <li>Yuqoridagi <b>“Open”</b> tugmasini bosing yoki <code>/start</code> yozib, <b>“Open uzvideohub”</b> ni bosing.</li>
            </ol>
          </div>
        </div>
      ) : null}
    </div>
  )
}
