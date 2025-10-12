// app/video/[id]/page.tsx
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
  return `/api/proxy-media?file_id=${encodeURIComponent(value)}`
}

async function loadVideo(id: string): Promise<Video | null> {
  try {
    const r = await fetch(`/api/videos?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
    const j = await r.json()
    if (!j?.ok) return null
    return j.item as Video
  } catch {
    return null
  }
}

export default async function VideoPage({ params }: { params: { id: string } }) {
  const video = await loadVideo(params.id)
  if (!video) return <div className="container">Topilmadi</div>

  return (
    <div className="container" style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, margin: '8px 0' }}>
        {video.title} {video.code ? <span style={{ opacity: 0.6, fontWeight: 400 }}>#{video.code}</span> : null}
      </h1>

      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ aspectRatio: '16 / 9', background: 'rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          <video
            controls
            poster={video.thumbUrl ? mediaSrc(video.thumbUrl) : undefined}
            style={{ width: '100%', height: '100%', display: 'block' }}
            src={mediaSrc(video.url)}
          />
        </div>

        <div className="card" style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 14 }}>{video.description}</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>{video.category || '—'}</div>
          <div style={{ fontSize: 13, color: '#f9b24e' }}>{video.isFree ? 'Bepul' : `${video.price} tanga`}</div>
        </div>
      </div>
    </div>
  )
}