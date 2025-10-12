// app/page.tsx
import Link from 'next/link'

type Video = {
  id: number
  code?: string | null
  title: string
  description: string
  url: string
  thumbUrl?: string | null
  category?: string | null
  isFree: boolean
  price: number
}

function mediaSrc(value?: string | null) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return `/api/proxy-media?src=${encodeURIComponent(value)}`
  // treat as Telegram file_id
  return `/api/proxy-media?file_id=${encodeURIComponent(value)}`
}

export default async function Home() {
  const r = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/videos`, { cache: 'no-store' }).catch(() => null)
  const j = await r?.json().catch(() => ({} as any))
  const items: Video[] = j?.ok ? j.items : []

  return (
    <div className="container" style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, margin: '8px 0' }}>So‘nggi videolar</h1>

      <div style={{ display: 'grid', gap: 14 }}>
        {items.map(v => (
          <Link key={v.id} href={`/video/${v.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ display: 'grid', gap: 10 }}>
              <div style={{ aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                {v.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaSrc(v.thumbUrl)}
                    alt={v.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%' }} />
                )}
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <div style={{ fontWeight: 700 }}>{v.title} {v.code ? <span style={{ opacity: 0.6, fontWeight: 400 }}>#{v.code}</span> : null}</div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>{v.category || '—'}</div>
                <div style={{ fontSize: 13, color: '#f9b24e' }}>{v.isFree ? 'Bepul' : `${v.price} tanga`}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}