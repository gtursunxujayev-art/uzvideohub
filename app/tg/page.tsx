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

  // Helper: try to authenticate using Telegram WebApp initData
  async function tryAuth() {
    try {
      const wa = window.Telegram?.WebApp
      if (!wa) {
        setErr('Not opened inside Telegram WebApp')
        setStatus('err')
        return
      }

      // Make sure the WebApp is ready
      try { wa.ready?.() } catch { /* ignore */ }

      const initData = wa.initData || ''
      if (!initData) {
        setErr('Missing initData from Telegram')
        setStatus('err')
        return
      }

      // POST to our auth endpoint
      const res = await fetch('/api/auth/telegram/webapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      })
      const j = await res.json()
      if (!res.ok || !j.ok) {
        setErr(j.error || 'Login failed')
        setStatus('err')
        return
      }

      setStatus('ok')
      // Navigate to home (still inside the WebApp)
      window.location.href = '/'
    } catch (e: any) {
      setErr(String(e?.message || e))
      setStatus('err')
    }
  }

  useEffect(() => {
    setStatus('checking')

    // If Telegram object already present, authenticate right away
    if (window.Telegram?.WebApp) {
      tryAuth()
      return
    }

    // Otherwise, wait a short moment for the script to load in Telegram WebView
    const t = setTimeout(() => {
      tryAuth()
    }, 300)

    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ padding: 24 }}>
      {/* Load official Telegram WebApp SDK for better compatibility/testing.
         In Telegram WebView, the object is injected anyway; this helps timing. */}
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />

      <h1 style={{ fontWeight: 800, fontSize: 22, marginBottom: 12 }}>Telegram WebApp Login</h1>

      {status === 'init' || status === 'checking' ? <div>Checking Telegram environment…</div> : null}
      {status === 'ok' ? <div>Logged in. Redirecting…</div> : null}

      {status === 'err' ? (
        <div style={{ color: '#ff6f6f', marginTop: 8 }}>
          <div style={{ marginBottom: 8 }}>Error: {err}</div>
          <div style={{ opacity: 0.8 }}>
            To use this page, open it <b>inside Telegram</b>:
            <ol style={{ marginTop: 8 }}>
              <li>Open your bot in the Telegram mobile app (Android/iOS).</li>
              <li>Tap the <b>corner “Open”</b> button or type <code>/start</code> and tap <b>Open uzvideohub</b>.</li>
            </ol>
            Tip: Desktop Telegram may not support WebApps depending on version.
          </div>
        </div>
      ) : null}
    </div>
  )
}
