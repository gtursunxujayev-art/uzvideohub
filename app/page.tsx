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
  createdAt?: string
  updatedAt?: string
}

function mediaSrc(value?: string | null) {
  if (!value) return ''
  // Allow direct HTTPS or Telegram file_id via our proxy
  if (/^https?:\/\//i.test(value)) return `/api/proxy-media?src=${encodeURIComponent(value)}`
  return `/api/proxy-media?file_id=${encodeURIComponent(value)}`
}

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

async function loadVideos(): Promise<{ items: Video[]; error?: string }> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/videos`, { cache: 'no-store' })
    const json = await res.json().catch(() => ({ ok: false, error: 'JSON parse failed' }))
    if (!json?.ok) return { items: [], error: json?.error || 'API error' }
    return { items: json.items as Video[] }
  } catch (e: any) {
    return { items: [], error: String(e?.message || e) }
  }
}

export default async function Home() {
  const { items, error } = await loadVideos()

  return (
    <div className="container" style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, margin: '8px 0' }}>So‘nggi videolar</h1>

      {error ? (
        <div className="card" style={{ padding: 14, fontSize: 14, color: '#ff6b6b' }}>
          Xatolik: {error}
        </div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 14, fontSize: 14, opacity: 0.85 }}>
          Hozircha videolar yo‘q yoki yuklanmadi.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {items.map((v) => (
            <Link
              key={v.id}
              href={`/video/${v.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="card" style={{ display: 'grid', gap: 10 }}>
                <div
                  style={{
                    aspectRatio: '16 / 9',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.06)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {v.thumbUrl ? (
                    <img
                      src={mediaSrc(v.thumbUrl)}
                      alt={v.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%' }} />
                  )}
                </div>

                <div style={{ display: 'grid', gap: 4 }}>
                  <div style={{ fontWeight: 700 }}>
                    {v.title}{' '}
                    {v.code ? (
                      <span style={{ opacity: 0.6, fontWeight: 400 }}>#{v.code}</span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>{v.category || '—'}</div>
                  <div style={{ fontSize: 13, color: '#f9b24e' }}>
                    {v.isFree ? 'Bepul' : `${v.price} tanga`}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}