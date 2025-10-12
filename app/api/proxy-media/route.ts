// app/api/proxy-media/route.ts
// Streams images & videos with byte-range support.
// Usage:
//   /api/proxy-media?src=https%3A%2F%2Fapi.telegram.org%2Ffile%2FbotXXXX%2Fvideos%2Ffile_0.mp4
//   /api/proxy-media?file_id=AAE...  (will resolve to Telegram file URL via getFile)

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TG_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.TG_BOT_TOKEN ||
  process.env.BOT_TOKEN;

function bad(message: string, status = 400, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

function isHttpUrl(s?: string | null) {
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function resolveTelegramFileUrl(fileId: string) {
  if (!TG_TOKEN) throw new Error("Missing TELEGRAM_BOT_TOKEN in env");
  const api = `https://api.telegram.org/bot${TG_TOKEN}/getFile?file_id=${encodeURIComponent(
    fileId
  )}`;
  const r = await fetch(api, { cache: "no-store" });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`getFile failed: ${r.status} ${t.slice(0, 200)}`);
  }
  const j = (await r.json()) as any;
  if (!j?.ok || !j?.result?.file_path) {
    throw new Error(`getFile bad response`);
  }
  return `https://api.telegram.org/file/bot${TG_TOKEN}/${j.result.file_path}`;
}

async function proxy(req: NextRequest, targetUrl: string) {
  // Forward Range header for video seeking
  const range = req.headers.get("range") || undefined;

  const resp = await fetch(targetUrl, {
    headers: range ? { Range: range } : undefined,
    cache: "no-store",
  });

  if (!resp.ok && resp.status !== 206) {
    const text = await resp.text().catch(() => "");
    return bad("Upstream fetch failed", resp.status, {
      upstreamStatus: resp.status,
      preview: text.slice(0, 200),
    });
  }

  // Copy important headers through
  const headers = new Headers();
  const ct = resp.headers.get("content-type");
  const cl = resp.headers.get("content-length");
  const cr = resp.headers.get("content-range");
  const ar = resp.headers.get("accept-ranges");

  if (ct) headers.set("Content-Type", ct);
  if (cl) headers.set("Content-Length", cl);
  if (cr) headers.set("Content-Range", cr);
  headers.set("Accept-Ranges", ar || "bytes");
  headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");

  return new Response(resp.body, {
    status: resp.status,
    headers,
  });
}

export async function GET(req: NextRequest) {
  try {
    const fullUrl = req.url.startsWith("http")
      ? req.url
      : `${req.headers.get("x-forwarded-proto") || "https"}://${
          req.headers.get("host") || ""
        }${req.url}`;

    const { searchParams } = new URL(fullUrl);
    const src = searchParams.get("src");
    const fileId = searchParams.get("file_id");

    let target = "";

    if (src) {
      if (!isHttpUrl(src)) return bad("Invalid src URL");
      target = src;
    } else if (fileId) {
      target = await resolveTelegramFileUrl(fileId);
    } else {
      return bad('Provide "src" or "file_id"');
    }

    return await proxy(req, target);
  } catch (e: any) {
    return bad(String(e?.message || e), 500);
  }
}