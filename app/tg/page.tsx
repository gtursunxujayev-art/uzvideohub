// app/tg/page.tsx
'use client'
import { useEffect, useState } from 'react'

declare global {
  interface Window {
    Telegram?: any
  }
}

export default function TgWebAppLogin() {
  const [status, setStatus] = useState<'idle' | 'ready' | 'ok' | 'err'>('idle')
  const [err, setErr] = useState<string>('')

  useEffect(() => {
    try {
      const wa = window.Telegram?.WebApp
      if (!wa) {
        setErr('Not opened inside Telegram WebApp')
        setStatus('err')
        return
      }
      wa.ready()
      setStatus('ready')

      const initData = wa.initData || ''
      if (!initData) {
        setErr('Missing initData')
        setStatus('err')
        return
      }

      ;(async () => {
        const res = await fetch('/api/auth/telegram/webapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        })
        const j = await res.json()
        if (j.ok) {
          setStatus('ok')
          // Option 1: close WebApp and open your site in default browser
          // wa.close(); window.location.href = '/'
          // Option 2: navigate inside the WebApp to your home
          window.location.href = '/'
        } else {
          setErr(j.error || 'Login failed')
          setStatus('err')
        }
      })()
    } catch (e: any) {
      setErr(String(e?.message || e))
      setStatus('err')
    }
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontWeight: 800, fontSize: 22, marginBottom: 12 }}>Telegram WebApp Login</h1>
      {status === 'idle' && <div>Initializing…</div>}
      {status === 'ready' && <div>Verifying…</div>}
      {status === 'ok' && <div>Logged in. Redirecting…</div>}
      {status === 'err' && <div style={{ color: '#ff6f6f' }}>Error: {err}</div>}
    </div>
  )
}
