import { NextRequest, NextResponse } from 'next/server'
import { handleTelegramUpdate } from '@/app/actions/telegram'

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook is ready' })
}

export async function POST(request: NextRequest) {
  // ── Validasi secret token dari Telegram ──────────────────────────────────
  // Telegram mengirim secret via header X-Telegram-Bot-Api-Secret-Token
  // jika TELEGRAM_WEBHOOK_SECRET disetel saat registerWebhook.
  // Jika env var tidak diset, kita skip validasi (untuk dev lokal).
  if (WEBHOOK_SECRET) {
    const incomingSecret = request.headers.get('x-telegram-bot-api-secret-token')
    if (incomingSecret !== WEBHOOK_SECRET) {
      console.warn('[Telegram] Unauthorized webhook request — secret mismatch')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    await handleTelegramUpdate(body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
