import { NextRequest, NextResponse } from 'next/server'
import { handleTelegramUpdate } from '@/app/actions/telegram'

export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook is ready' })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  try {
    await handleTelegramUpdate(body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
