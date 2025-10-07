// src/lib/telegram.ts
import crypto from 'crypto'

export function verifyTelegramAuth(data: Record<string, string>) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return false

  const secret = crypto.createHash('sha256').update(token).digest()

  const pairs = Object.keys(data)
    .filter((k) => k !== 'hash' && data[k] !== undefined && data[k] !== null)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join('\n')

  const hmac = crypto.createHmac('sha256', secret).update(pairs).digest('hex')
  return hmac === data.hash
}
