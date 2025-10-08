// src/components/Nav.tsx
'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Me = { id: number; coins: number; isAdmin?: boolean | null } | null

export default function Nav() {
  const [me, setMe] = useState<Me>(null)
  const [open, setOpen] = useState(false)

  // swipe-to-close (simple)
  const startX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    startX.current = e.touches[0].clientX
  }
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (startX.current == null) return
    const dx = e.touches[0].clientX - startX.current
    // if user swipes left on the drawer, close it
    if (dx < -40) setOpen(false)
  }
  const onTouchEnd = () => {
    startX.current = null
  }

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
          // darker/glassy bar (Pornhub-ish strong contrast)
          background: 'linear-gradient(180deg, rgba(0,0,0,0.65), rgba(0,0,0,0.35))',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'grid',
          gridTemplateColumns: '48px 1fr 1fr 48px', // we’ll center brand using absolute container
          alignItems: 'center',
          position: 'relative',
          height: 56,
          borderRadius: 12,
        }}
      >
        {/* Left: hamburger */}
        <button
          aria-label="Menu"
          onClick={() => setOpen(true)}
          style={{
            width: 40, height: 40, marginLeft: 4,
            display: 'grid', placeItems: 'center',
            background: 'transparent', border: 'none', cursor: 'pointer',
          }}
        >
          <div style={{ width: 22, height: 2, background: '#fff', borderRadius: 2, marginBottom: 5 }} />
          <div style={{ width: 22, height: 2, background: '#fff', borderRadius: 2, marginBottom: 5 }} />
          <div style={{ width: 22, height: 2, background: '#fff', borderRadius: 2 }} />
        </button>

        {/* Center: Brand */}
        <div
          style={{
            position: 'absolute',
            left: 0, right: 0, top: 0, bottom: 0,
            display: 'grid',
            placeItems: 'center',
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
              // subtle “hub-like” accent: white text + small pill
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            UzvideoHub
          </Link>
        </div>

        {/* Right: Balance */}
        <div
          style={{
            gridColumn: '3 / 5',
            display: 'flex',
            justifyContent: 'flex-end',
            paddingRight: 10,
          }}
        >
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

      {/* Drawer overlay */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: open ? 'rgba(0,0,0,0.45)' : 'transparent',
          backdropFilter: open ? 'blur(1px)' : 'none',
          transition: 'background 160ms ease',
          pointerEvents: open ? 'auto' : 'none',
          zIndex: 50,
        }}
      />

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
          <div style={{ fontWeight: 900 }}>Menyu</div>
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

        {/* Drawer items */}
        <nav style={{ display: 'grid', gap: 6, padding: 10 }}>
          <Link
            onClick={() => setOpen(false)}
            href="/profile"
            style={itemStyle}
          >
            Profil
          </Link>
          <Link
            onClick={() => setOpen(false)}
            href="/library"
            style={itemStyle}
          >
            Saqlangan videolar
          </Link>
          <Link
            onClick={() => setOpen(false)}
            href="/reyting"
            style={itemStyle}
          >
            Reyting
          </Link>
        </nav>
      </div>
    </>
  )
}

const itemStyle: React.CSSProperties = {
  display: 'block',
  padding: '12px 12px',
  borderRadius: 10,
  textDecoration: 'none',
  color: 'inherit',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  fontWeight: 700,
  fontSize: 15,
}