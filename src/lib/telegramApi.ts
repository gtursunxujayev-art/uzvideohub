// src/lib/telegramApi.ts
const TOKEN = process.env.TELEGRAM_BOT_TOKEN as string
if (!TOKEN) {
  console.warn('Missing TELEGRAM_BOT_TOKEN')
}

const API = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : ''

async function call<T = any>(method: string, payload: any): Promise<T> {
  if (!TOKEN) throw new Error('No TELEGRAM_BOT_TOKEN')
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!json.ok) {
    console.error('Telegram API error', method, json)
    throw new Error(json.description || 'Telegram API error')
  }
  return json.result as T
}

export async function sendMessage(chat_id: number | string, text: string, opts: any = {}) {
  return call('sendMessage', { chat_id, text, ...opts })
}

export async function setWebhook(url: string, secret_token?: string) {
  return call('setWebhook', { url, secret_token })
}

export async function deleteWebhook() {
  return call('deleteWebhook', { drop_pending_updates: false })
}
