// app/login/page.tsx
'use client'
import { useEffect } from 'react'

export default function LoginPage() {
  useEffect(() => {
    // @ts-ignore
    window.TelegramLoginWidget = {
      dataOnauth: async function (user: any) {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        })
        const j = await res.json()
        if (j.ok) window.location.href = '/'
        else alert(j.error || 'Login failed')
      },
    }
  }, [])

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h1 style={{ fontWeight: 800, fontSize: 22, marginBottom: 12 }}>
        Login with Telegram
      </h1>

      <script
        async
        src="https://telegram.org/js/telegram-widget.js?22"
        data-telegram-login={process.env.NEXT_PUBLIC_TG_LOGIN || ''}
        data-size="large"
        data-userpic="false"
        data-onauth="TelegramLoginWidget.dataOnauth(user)"
        data-request-access="write"
      />

      <p style={{ opacity: 0.7, marginTop: 12 }}>
        After login, you’ll be redirected automatically.
      </p>
    </div>
  )
}
