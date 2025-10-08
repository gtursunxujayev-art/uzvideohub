// app/video/[id]/error.tsx
'use client'

export default function Error({ error }: { error: Error & { digest?: string } }) {
  return (
    <div className="container" style={{ color: '#ffb4b4' }}>
      Xatolik yuz berdi. {error?.message || ''}
    </div>
  )
}
```0