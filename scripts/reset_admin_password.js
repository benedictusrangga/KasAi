#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')
const { nanoid } = require('nanoid')

function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) return
  const src = fs.readFileSync(envPath, 'utf8')
  src.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const idx = trimmed.indexOf('=')
    if (idx === -1) return
    const key = trimmed.slice(0, idx).trim()
    let val = trimmed.slice(idx + 1).trim()
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
    process.env[key] = val
  })
}

loadDotEnv(path.resolve(__dirname, '..', '.env.local'))

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL not found in .env.local')
  process.exit(1)
}

const email = process.env.ADMIN_EMAIL || 'benedictus.rangga@gmail.com'
const newPassword = process.env.ADMIN_PASSWORD || 'Saputro@12'
const base = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'

async function main() {
  const pool = new Pool({ connectionString })
  const client = await pool.connect()
  try {
    const userRes = await client.query('SELECT id FROM "user" WHERE email = $1 LIMIT 1', [email.toLowerCase()])
    if (!userRes.rows || userRes.rows.length === 0) {
      console.error('User not found for email', email)
      return
    }
    const userId = userRes.rows[0].id

    const token = nanoid(32)
    const verificationId = nanoid()
    const now = new Date()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days

    await client.query(
      'INSERT INTO verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6)',
      [verificationId, `reset-password:${token}`, userId, expiresAt, now, now],
    )

    console.log('Inserted verification token. Calling reset endpoint...')

    const res = await fetch(`${base}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('Reset endpoint failed:', res.status, text)
      return
    }

    const json = await res.json()
    console.log('Reset response:', json)
    console.log('Password reset complete. Try signing in at http://localhost:3000/sign-in')
  } catch (err) {
    console.error('Error:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
