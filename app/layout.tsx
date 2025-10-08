// app/layout.tsx
import './globals.css'
import Nav from '@/src/components/Nav'

export const metadata = {
  title: 'UzvideoHub',
  description: 'Video content hub',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <div className="container" style={{ display: 'grid', gap: 14 }}>
          <Nav />
          {children}
        </div>
      </body>
    </html>
  )
}