// app/tg/page.tsx
'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    Telegram?: any
  }
}

function getRef(): string {
  try {
    const u = new URL(window.location.href)
    const fromUrl = u.searchParams.get('ref')
    if (fromUrl) {
      localStorage.setItem('uzvh_ref', fromUrl)
      return fromUrl
    }
    return localStorage.getItem('uzvh_ref') || ''
  } catch {
    return ''
  }
}

export default function TgGate() {
  useEffect(() => {
    ;(async () => {
      try {
        const ref = getRef()

        // If opened inside Telegram WebApp — authenticate then go to home
        const wu = window.Telegram?.WebApp?.initDataUnsafe?.user
        if (wu?.id) {
          const tgId = String(wu.id)
          const username = wu.username || null
          const displayName = [wu.first_name, wu.last_name].filter(Boolean).join(' ') || null

          await fetch('/api/auth/telegram/webapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tgId, username, displayName, ref }),
          }).catch(() => {})

          // Always go to main page after auth
          window.location.replace('/')
          return
        }

        // If NOT inside Telegram (opened in normal browser), just go home
        window.location.replace('/')
      } catch {
        // Even on error, push to home so user sees videos
        window.location.replace('/')
      }
    })()
  }, [])

  // Nothing is rendered; this page immediately redirects.
  return null
}
