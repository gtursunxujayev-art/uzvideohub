// src/components/Nav.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Me = { user: { isAdmin?: boolean } | null }

export default function Nav() {
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch('/api/me', { cache: 'no-store' })
        const j: Me = await r.json()
        if (!cancelled) setIsAdmin(!!j?.user?.isAdmin)
      } catch {
        if (!cancelled) setIsAdmin(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <nav style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
      <Link href="/">Bosh sahifa</Link>
      <Link href="/library">Kutubxona</Link>
      {/* Only admins see these two links */}
      {isAdmin && <Link href="/admin">Admin</Link>}
      {isAdmin && <Link href="/tg">Telegram</Link>}
      <Link href="/profile">Profil</Link>
    </nav>
  )
}
