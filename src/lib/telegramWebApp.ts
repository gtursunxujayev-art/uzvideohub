// src/lib/telegramWebApp.ts
import crypto from 'crypto'
import querystring from 'querystring'

/**
 * Verify Telegram WebApp initData string.
 * Docs: https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
 */
export function verifyInitData(initData: string): { ok: boolean; data?: Record<string, any> } {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token || !initData) return { ok: false }

  // parse initData (querystring-like)
  const parsed = querystring.parse(initData) as Record<string, string>

  // Extract hash provided by Telegram
  const providedHash = parsed['hash'] as string
  if (!providedHash) return { ok: false }

  // Build data-check-string from all keys except 'hash', sorted by key
  const pairs: string[] = []
  for (const [key, value] of Object.entries(parsed)) {
    if (key === 'hash') continue
    if (value === undefined || value === null) continue
    pairs.push(`${key}=${value}`)
  }
  pairs.sort()
  const dataCheckString = pairs.join('\n')

  // secret key = HMAC_SHA256 of bot token with key "WebAppData"
  const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest()
  const computed = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex')

  if (computed !== providedHash) return { ok: false }

  // Decode nested user payload if present
  const result: Record<string, any> = {}
  for (const [k, v] of Object.entries(parsed)) {
    try {
      result[k] = typeof v === 'string' && (v.startsWith('{') || v.startsWith('[')) ? JSON.parse(v) : v
    } catch {
      result[k] = v
    }
  }

  return { ok: true, data: result }
}
