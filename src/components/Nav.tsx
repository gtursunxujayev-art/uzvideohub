// src/components/Nav.tsx
import Link from 'next/link'
import { cookies } from 'next/headers'
import { verifySession } from '@/src/lib/jwt'
import { prisma } from '@/src/lib/db'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export default async function Nav() {
  const token = cookies().get(COOKIE)?.value || ''
  let isAdmin = false

  if (token) {
    try {
      const s = verifySession<{ userId: number }>(token)
      if (s?.userId) {
        const u = await prisma.user.findUnique({
          where: { id: s.userId },
          select: { isAdmin: true },
        })
        isAdmin = !!u?.isAdmin
      }
    } catch {
      isAdmin = false
    }
  }

  return (
    <nav style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
      <Link href="/">Bosh sahifa</Link>
      <Link href="/library">Kutubxona</Link>
      {isAdmin && <Link href="/admin">Admin</Link>}
      {isAdmin && <Link href="/tg">Telegram</Link>}
      <Link href="/profile">Profil</Link>
    </nav>
  )
}
