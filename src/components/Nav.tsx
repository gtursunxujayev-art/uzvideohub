// src/components/Nav.tsx
'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Me = { id: number; coins: number; isAdmin?: boolean | null } | null

export default function Nav() {
  const [me, setMe] = useState<Me>(null)
  const [open, setOpen] = useState(false)

  // swipe-to-close logic
  const startX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    startX.current = e.touches[0].clientX
  }
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (startX.current == null) return
    const dx = e.touches[0].clientX - startX.current
    if (dx < -40) setOpen(false)
  }
  const onTouchEnd = () => { startX.current = null }

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

  const balance = typeof me?.coins === 'number' ? me!.coins : 0

  return (
    <>
      {/* Top bar */}
      <header
        className="section"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.65), rgba(0,0,0,0.35))',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'grid',
          gridTemplateColumns: '48px 1fr 48px',
          alignItems: 'center',
          position: 'relative',
          height: 56,
          borderRadius: 12,
        }}
      >
        {/* Left: hamburger */}
        <button
          aria-label="Menyu"
          onClick={() => setOpen(true)}
          style={{
            width: 40, height: 40, marginLeft: 4,
            display: 'grid', placeItems: 'center',
            background: 'transparent', border: 'none', cursor: 'pointer',
          }}
        >
          <span style={barStyle} />
          <span style={{ ...barStyle, marginTop: 4 }} />
          <span style={{ ...barStyle, marginTop: 4 }} />
        </button>

        {/* Center: Brand */}
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'grid', placeItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <Link
            href="/"
            style={{
              pointerEvents: 'auto',
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 900,
              fontSize: 18,
              letterSpacing: 0.2,
              padding: '6px 10px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            UzvideoHub
          </Link>
        </div>

        {/* Right: Balance */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 8 }}>
          <div
            title="Hisob"
            style={{
              fontWeight: 800,
              fontSize: 14,
              padding: '8px 12px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            Hisob: {balance}
          </div>
        </div>
      </header>

      {/* Overlay only when open */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(1px)',
            zIndex: 50,
          }}
        />
      )}

      {/* Drawer panel */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'fixed',
          top: 0, bottom: 0, left: 0,
          width: 280,
          background: 'rgba(20,20,20,0.98)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 200ms ease',
          zIndex: 60,
          display: 'grid',
          gridTemplateRows: '56px 1fr',
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 12px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16 }}>Menyu</div>
          <button
            aria-label="Yopish"
            onClick={() => setOpen(false)}
            style={{
              width: 36, height: 36,
              display: 'grid', placeItems: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer', color: '#fff',
              fontSize: 20, lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Drawer items (compact, single row) */}
        <nav style={{ padding: '8px 6px' }}>
          <MenuItem href="/profile" label="Profil" onClick={() => setOpen(false)} />
          <MenuItem href="/library" label="Saqlangan videolar" onClick={() => setOpen(false)} />
          <MenuItem href="/reyting" label="Reyting" onClick={() => setOpen(false)} />
        </nav>
      </div>
    </>
  )
}

function MenuItem({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 48,
        padding: '0 12px',
        margin: '6px 6px',
        borderRadius: 10,
        textDecoration: 'none',
        color: 'inherit',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
        fontWeight: 700,
        fontSize: 15,
      }}
    >
      {label}
    </Link>
  )
}

const barStyle: React.CSSProperties = {
  width: 22,
  height: 2,
  background: '#fff',
  borderRadius: 2,
}