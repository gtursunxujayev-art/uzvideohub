'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Video = {
  id: number;
  code?: string | null;
  title: string;
  description: string;
  url: string;
  thumbUrl?: string | null;
  category?: string | null;
  isFree: boolean;
  price: number;
};

type Me = {
  id: number;
  coins: number;
  isAdmin?: boolean;
  name?: string | null;
  username?: string | null;
};

function proxyUrl(value?: string | null) {
  if (!value) return '';
  const isHttp = /^https?:\/\//i.test(value);
  const key = isHttp ? 'src' : 'file_id';
  return `/api/proxy-media?${key}=${encodeURIComponent(value)}`;
}

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const vidId = useMemo(() => Number(id), [id]);
  const router = useRouter();

  const [video, setVideo] = useState<Video | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Load video + me + whether purchased
  useEffect(() => {
    let cancel = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // 1) video
        const vRes = await fetch(`/api/videos?id=${encodeURIComponent(String(vidId))}`, { cache: 'no-store' });
        const vText = await vRes.text();
        const vJson = JSON.parse(vText);
        if (!vJson?.ok || !vJson?.item) throw new Error(vJson?.error || 'Video topilmadi');

        // 2) me
        const meRes = await fetch('/api/me', { cache: 'no-store' });
        const meJson = await meRes.json().catch(() => ({ ok: false }));
        const meData: Me | null = meJson?.ok ? meJson.user : null;

        // 3) purchased?
        let purchased = false;
        if (vJson.item?.isFree) {
          purchased = true;
        } else {
          const pRes = await fetch(`/api/my/purchases?videoId=${encodeURIComponent(String(vidId))}`, {
            cache: 'no-store',
          }).catch(() => null);
          const pJson = await pRes?.json().catch(() => null as any);
          purchased = Boolean(pJson?.ok && (pJson.has || pJson.items?.some?.((x: any) => x.videoId === vidId)));
        }

        if (!cancel) {
          setVideo(vJson.item as Video);
          setMe(meData);
          setHasAccess(purchased);
        }
      } catch (e: any) {
        if (!cancel) setError(String(e?.message || e));
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    if (vidId) load();
    return () => {
      cancel = true;
    };
  }, [vidId]);

  async function buy() {
    if (!video) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ videoId: video.id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) {
        throw new Error(j?.error || `Xarid amalga oshmadi (kod: ${res.status})`);
      }
      // success: update local state
      setHasAccess(true);
      if (me) setMe({ ...me, coins: typeof j?.coins === 'number' ? j.coins : Math.max(0, me.coins - (video.price || 0)) });
      setNotice('Xarid muvaffaqiyatli! ✅');
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }

  // UI states
  if (loading) {
    return (
      <div className="container" style={{ display: 'grid', gap: 16 }}>
        <div className="card" style={{ padding: 14, fontSize: 14, opacity: 0.85 }}>Yuklanmoqda…</div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="container" style={{ display: 'grid', gap: 16 }}>
        <div className="card" style={{ padding: 14, fontSize: 14, color: '#ff6b6b', whiteSpace: 'pre-wrap' }}>
          {error || 'Topilmadi'}
        </div>
        <button
          onClick={() => router.back()}
          className="btn"
          style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: '#f9b24e', color: '#111' }}
        >
          Orqaga
        </button>
      </div>
    );
  }

  const balance = me?.coins ?? 0;

  return (
    <div className="container" style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ fontWeight: 800, fontSize: 24, margin: '8px 0' }}>
        {video.title} {video.code ? <span style={{ opacity: 0.6, fontWeight: 400 }}>#{video.code}</span> : null}
      </h1>

      <div style={{ display: 'grid', gap: 16 }}>
        {/* Player or Locked Card */}
        <div
          style={{
            aspectRatio: '16 / 9',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.06)',
            position: 'relative',
          }}
        >
          {hasAccess ? (
            <video
              controls
              preload="metadata"
              poster={video.thumbUrl ? proxyUrl(video.thumbUrl) : undefined}
              style={{ width: '100%', height: '100%', display: 'block', background: 'black' }}
              src={proxyUrl(video.url)}
            />
          ) : (
            <>
              {/* Poster */}
              {video.thumbUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={proxyUrl(video.thumbUrl)}
                  alt={video.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'blur(1px)' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%' }} />
              )}

              {/* Lock overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(0,0,0,0.45)',
                  padding: 16,
                }}
              >
                <div
                  className="card"
                  style={{
                    width: 'min(520px, 95%)',
                    textAlign: 'center',
                    display: 'grid',
                    gap: 10,
                    padding: 16,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 16 }}>To‘lov talab qilinadi</div>
                  <div style={{ fontSize: 14, opacity: 0.9 }}>
                    Narx: <b style={{ color: '#f9b24e' }}>{video.price} tanga</b>. Balansingiz: {balance} tanga.
                  </div>
                  {notice ? (
                    <div style={{ fontSize: 13, color: '#6ee7b7' }}>{notice}</div>
                  ) : error ? (
                    <div style={{ fontSize: 13, color: '#ff6b6b' }}>{error}</div>
                  ) : null}
                  <button
                    disabled={busy}
                    onClick={buy}
                    style={{
                      marginTop: 2,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: 'none',
                      background: '#f9b24e',
                      color: '#111',
                      fontWeight: 700,
                    }}
                  >
                    {busy ? 'Amalga oshirilmoqda…' : 'Tomosha qilish (sotib olish)'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Details */}
        <div className="card" style={{ display: 'grid', gap: 8, padding: 14 }}>
          <div style={{ fontSize: 15, opacity: 0.9 }}>{video.description || '—'}</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            {video.category ? `Kategoriya: ${video.category}` : 'Kategoriya: —'}
          </div>
          <div style={{ fontSize: 13, color: '#f9b24e' }}>
            {video.isFree ? 'Bepul' : `${video.price} tanga`}
          </div>
        </div>
      </div>
    </div>
  );
}