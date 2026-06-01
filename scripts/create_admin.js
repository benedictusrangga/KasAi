#!/usr/bin/env node
const { readFileSync } = require('fs')
const path = require('path')
const { Pool } = require('pg')
const crypto = require('crypto')
const { nanoid } = require('nanoid')

function loadDotEnv(envPath) {
  const fs = require('fs')
  try {
    const src = fs.readFileSync(envPath, 'utf8')
    src.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const idx = trimmed.indexOf('=')
      if (idx === -1) return
      const key = trimmed.slice(0, idx).trim()
      let val = trimmed.slice(idx + 1).trim()
      if (val.startsWith("\"") && val.endsWith("\"")) val = val.slice(1, -1)
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
      if (!process.env[key]) process.env[key] = val
    })
  } catch (err) {
    // ignore
  }
}

loadDotEnv(path.resolve(__dirname, '..', '.env.local'))

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not set. Add it to your environment or .env.local')
  process.exit(1)
}

const adminEmail = process.env.ADMIN_EMAIL
const adminPassword = process.env.ADMIN_PASSWORD
if (!adminEmail || !adminPassword) {
  console.error('ERROR: Set ADMIN_EMAIL and ADMIN_PASSWORD in environment or .env.local')
  process.exit(1)
}

// We create a verification token and call the app's `/api/auth/set-password`
// endpoint so the password is hashed and stored using the app's logic.

function noop() {
  return null
}

async function run() {
  const pool = new Pool({ connectionString })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const now = new Date()
    // check if user already exists
    const res = await client.query('SELECT id FROM "user" WHERE email = $1 LIMIT 1', [adminEmail.toLowerCase()])
    if (res.rows && res.rows.length > 0) {
      const existingUserId = res.rows[0].id
      // update account password if account exists, otherwise create account
      const acc = await client.query('SELECT id FROM account WHERE "userId" = $1 LIMIT 1', [existingUserId])
      if (acc.rows && acc.rows.length > 0) {
        await client.query(
          'UPDATE account SET provider = $1, "providerAccountId" = $2, "accountId" = $3, "providerId" = $4, "updatedAt" = $5 WHERE "userId" = $6',
          ['credentials', existingUserId, existingUserId, 'credential', now, existingUserId],
        )
        console.log('Admin user exists, ensured account provider fields for:', adminEmail)
      } else {
        const newAccountId = nanoid()
        await client.query(
          'INSERT INTO account (id, "userId", type, provider, "providerAccountId", "createdAt", "updatedAt", "accountId", "providerId") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
          [newAccountId, existingUserId, 'credentials', 'credentials', existingUserId, now, now, existingUserId, 'credential'],
        )
        console.log('Admin user exists, created account without password for:', adminEmail)
      }

      // create verification token so admin can set password (or we will call set-password)
      const token = nanoid(32)
      const verificationId = nanoid()
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days
      await client.query(
        'INSERT INTO verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6)',
        [verificationId, adminEmail.toLowerCase(), token, expiresAt, now, now],
      )

      const base = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
      const inviteLink = `${base}/set-password?token=${token}`

      // try calling set-password to set the password immediately
      try {
        const res = await fetch(`${base}/api/auth/set-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password: adminPassword }),
        })
        if (res.ok) {
          console.log('Admin password set via /api/auth/set-password')
        } else {
          console.log('Could not call set-password endpoint; invite link:', inviteLink)
        }
      } catch (err) {
        console.log('Failed to call set-password endpoint; invite link:', inviteLink)
      }
      await client.query('COMMIT')
      return
    }

    const userId = nanoid()
    const accountId = nanoid()

    await client.query('INSERT INTO "user" (id, email, name, "emailVerified", "createdAt", "updatedAt", "accountType") VALUES ($1,$2,$3,$4,$5,$6,$7)', [userId, adminEmail.toLowerCase(), 'Admin', true, now, now, 'business'])
    await client.query(
      'INSERT INTO account (id, "userId", type, provider, "providerAccountId", "createdAt", "updatedAt", "accountId", "providerId") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [accountId, userId, 'credentials', 'credentials', userId, now, now, userId, 'credential'],
    )

    // create verification token so admin can set password (or we will call set-password)
    const token = nanoid(32)
    const verificationId = nanoid()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days
    await client.query(
      'INSERT INTO verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6)',
      [verificationId, adminEmail.toLowerCase(), token, expiresAt, now, now],
    )

    const base = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
    const inviteLink = `${base}/set-password?token=${token}`

    try {
      const res = await fetch(`${base}/api/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: adminPassword }),
      })
      if (res.ok) {
        console.log('Admin password set via /api/auth/set-password')
      } else {
        console.log('Could not call set-password endpoint; invite link:', inviteLink)
      }
    } catch (err) {
      console.log('Failed to call set-password endpoint; invite link:', inviteLink)
    }

    console.log('Admin user created:', adminEmail)
    console.log('User ID:', userId)
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Error creating admin:', err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

run()
