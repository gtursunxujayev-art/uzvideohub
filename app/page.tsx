async function loadVideos(): Promise<{ items: Video[]; error?: string }> {
  try {
    // Use absolute URL when on server (Next.js server components)
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'

    const res = await fetch(`${baseUrl}/api/videos`, { cache: 'no-store' })
    const json = await res.json().catch(() => ({ ok: false, error: 'JSON parse failed' }))
    if (!json?.ok) return { items: [], error: json?.error || 'API error' }

    return { items: json.items as Video[] }
  } catch (e: any) {
    return { items: [], error: String(e?.message || e) }
  }
}