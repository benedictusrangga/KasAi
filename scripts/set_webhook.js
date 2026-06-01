/**
 * Set Telegram webhook URL
 * Usage: node scripts/set_webhook.js https://your-domain.com
 *
 * Untuk development lokal, gunakan ngrok:
 *   1. Install ngrok: https://ngrok.com/download
 *   2. Jalankan: ngrok http 3000
 *   3. Copy URL ngrok (contoh: https://abc123.ngrok.io)
 *   4. Jalankan: node scripts/set_webhook.js https://abc123.ngrok.io
 */

const BOT_TOKEN = '8615578445:AAE-W-X0wjEYUlf4OLdP5ih2SnOkV5Aljao'

async function main() {
  const baseUrl = process.argv[2]

  if (!baseUrl) {
    console.log('Usage: node scripts/set_webhook.js <BASE_URL>')
    console.log('Example: node scripts/set_webhook.js https://abc123.ngrok.io')
    console.log('Example: node scripts/set_webhook.js https://kasai.vercel.app')
    process.exit(1)
  }

  const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/telegram`

  console.log(`Setting webhook to: ${webhookUrl}`)

  // Set webhook
  const setRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'edited_message'],
        drop_pending_updates: true,
      }),
    }
  )
  const setData = await setRes.json()
  console.log('Set webhook result:', JSON.stringify(setData, null, 2))

  // Verify
  const infoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)
  const infoData = await infoRes.json()
  console.log('\nWebhook info:', JSON.stringify(infoData.result, null, 2))

  if (infoData.result?.url === webhookUrl) {
    console.log('\n✅ Webhook berhasil di-set!')
    console.log(`Bot @Aiaccountingsbot siap menerima pesan.`)
  } else {
    console.log('\n❌ Webhook gagal di-set.')
  }
}

main().catch(console.error)
