// app/video/[id]/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container" style={{ color: '#ffb4b4', display: 'grid', gap: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 20 }}>Xatolik yuz berdi</div>
      <div>{error?.message || "Noma'lum xatolik"}</div>
      <button className="btn" onClick={() => reset?.()}>Qayta urinish</button>
    </div>
  )
}