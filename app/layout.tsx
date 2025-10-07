// app/layout.tsx
import './globals.css'
import Link from 'next/link'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'uzvideohub',
  description: 'Video kontent markazi',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              padding: '12px 16px',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <Link href="/" style={{ fontWeight: 900, color: '#ff9900' }}>
              uzvideohub
            </Link>
            <nav style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
              <Link href="/">Bosh sahifa</Link>
              <Link href="/library">Kutubxona</Link>
              <Link href="/admin">Admin</Link>
              <Link href="/tg">Telegram</Link>
              <Link href="/profile">Profil</Link>
            </nav>
          </div>
        </header>
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
