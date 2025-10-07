// app/page.tsx
export default function Home() {
  return (
    <div>
      <h1 style={{ fontWeight: 800, fontSize: 24, marginBottom: 12 }}>
        Latest Videos
      </h1>
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        }}
      >
        {/* Videos grid will appear here after we add /api/videos */}
        <div
          style={{
            background: 'rgba(255,255,255,0.06)',
            height: 180,
            borderRadius: 12,
          }}
        />
        <div
          style={{
            background: 'rgba(255,255,255,0.06)',
            height: 180,
            borderRadius: 12,
          }}
        />
        <div
          style={{
            background: 'rgba(255,255,255,0.06)',
            height: 180,
            borderRadius: 12,
          }}
        />
      </div>
    </div>
  )
}
