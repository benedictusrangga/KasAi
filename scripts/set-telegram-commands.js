/**
 * Script untuk mendaftarkan Bot Commands ke Telegram
 * Jalankan sekali: node scripts/set-telegram-commands.js
 *
 * Setelah dijalankan, user yang ketik "/" di chat bot akan
 * langsung melihat autocomplete semua command yang tersedia.
 */

const fs = require('fs')
const path = require('path')

// Baca .env.local manual tanpa dotenv
function loadEnv(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) return
      const key = trimmed.slice(0, eqIdx).trim()
      // Strip surrounding quotes jika ada
      let val = trimmed.slice(eqIdx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    })
  } catch {
    // file tidak ada, skip
  }
}

loadEnv(path.join(__dirname, '../.env.local'))
loadEnv(path.join(__dirname, '../.env'))

// Bisa juga pass token langsung sebagai argument: node set-telegram-commands.js <TOKEN>
if (process.argv[2]) {
  process.env.TELEGRAM_BOT_TOKEN = process.argv[2]
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!BOT_TOKEN || BOT_TOKEN === 'REPLACE_WITH_YOUR_BOT_TOKEN') {
  console.error('❌ TELEGRAM_BOT_TOKEN tidak ditemukan di .env.local')
  process.exit(1)
}

const commands = [
  { command: 'start',         description: '👋 Mulai & info cara pakai bot' },
  { command: 'help',          description: '📖 Panduan lengkap penggunaan' },
  { command: 'status',        description: '✅ Cek status akun yang terhubung' },
  { command: 'laporan',       description: '📊 Ringkasan laporan keuangan bulan ini' },
  { command: 'laporan_minggu',description: '📊 Ringkasan laporan keuangan minggu ini' },
  { command: 'pdf',           description: '📄 Kirim PDF laporan bulan ini' },
  { command: 'pdf_minggu',    description: '📄 Kirim PDF laporan minggu ini' },
  { command: 'pdf_semua',     description: '📄 Kirim PDF semua transaksi' },
  { command: 'budget',        description: '🎯 Cek status budget bulan ini' },
  { command: 'target',        description: '🏆 Cek progress semua target keuangan' },
]

async function setCommands() {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`

  console.log(`🤖 Mendaftarkan ${commands.length} commands ke Telegram...`)

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands }),
  })

  const data = await res.json()

  if (data.ok) {
    console.log('✅ Commands berhasil didaftarkan!\n')
    console.log('Daftar commands yang terdaftar:')
    commands.forEach(c => console.log(`  /${c.command.padEnd(16)} — ${c.description}`))
    console.log('\nSekarang user yang ketik "/" di chat bot akan melihat autocomplete.')
  } else {
    console.error('❌ Gagal mendaftarkan commands:', data)
    process.exit(1)
  }
}

setCommands().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
