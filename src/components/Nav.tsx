// src/components/Nav.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Me = { id: number; coins: number; isAdmin?: boolean | null } | null

export default function Nav() {
  const [me, setMe] = useState<Me>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('/api/me', { cache: 'no-store' })
        const j = await r.json().catch(() => ({}))
        setMe(r.ok && j?.ok ? (j.user as Me) : null)
      } catch {
        setMe(null)
      }
    })()
  }, [])

  return (
    <header
      className="section"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {/* Left: balance */}
      <div style={{ fontWeight: 700 }}>
        Hisob: {typeof me?.coins === 'number' ? me!.coins : 0}
      </div>

      {/* Right: brand + links if needed */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 800 }}>
          UzvideoHub
        </Link>
      </div>
    </header>
  )
}
```0