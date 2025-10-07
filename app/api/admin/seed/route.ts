// app/api/admin/seed/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db'
import { verifySession } from '@/src/lib/jwt'

const COOKIE = process.env.SESSION_COOKIE || 'uzvideohub_session'

export async function POST(req: Request) {
  // @ts-ignore - Next injects cookies on Request
  const token = req.cookies?.get?.(COOKIE)?.value || ''
  const s = verifySession<{ isAdmin: boolean }>(token)
  if (!s?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Demo videos (replace URLs with your Yandex Disk direct links)
  const demos = [
    {
      title: 'Charisma Basics — Eye Contact',
      description: 'Quick intro lesson on practical eye contact for leaders.',
      url: 'https://example.com/video1.mp4',
      thumbUrl: 'https://images.unsplash.com/photo-1520975922284-8b456906c813?q=80&w=1200',
      category: 'Coaching',
      tags: ['charisma', 'leadership', 'intro'],
      isFree: true,
      price: 0,
    },
    {
      title: 'Public Speaking: Open Strong',
      description: '3 opening patterns for high-stakes presentations.',
      url: 'https://example.com/video2.mp4',
      thumbUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200',
      category: 'Speaking',
      tags: ['speech', 'openers', 'ceo'],
      isFree: false,
      price: 15,
    },
    {
      title: 'Negotiation Tactics for CEOs',
      description: 'Anchoring, mirroring, and silence — fast overview.',
      url: 'https://example.com/video3.mp4',
      thumbUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200',
      category: 'Negotiation',
      tags: ['sales', 'negotiation', 'ceo'],
      isFree: false,
      price: 20,
    },
    {
      title: 'Camera Confidence in 10 Minutes',
      description: 'On-camera posture, framing, and tone for social media.',
      url: 'https://example.com/video4.mp4',
      thumbUrl: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1200',
      category: 'Branding',
      tags: ['camera', 'confidence', 'social'],
      isFree: true,
      price: 0,
    },
  ]

  // upsert by (title) for idempotency
  const results = []
  for (const v of demos) {
    const existing = await prisma.video.findFirst({ where: { title: v.title } })
    if (existing) {
      const upd = await prisma.video.update({
        where: { id: existing.id },
        data: {
          description: v.description,
          url: v.url,
          thumbUrl: v.thumbUrl,
          category: v.category,
          tags: v.tags,
          isFree: v.isFree,
          price: v.price,
        },
      })
      results.push({ id: upd.id, title: upd.title, updated: true })
    } else {
      const created = await prisma.video.create({ data: v })
      results.push({ id: created.id, title: created.title, created: true })
    }
  }

  return NextResponse.json({ ok: true, results })
}
