#!/usr/bin/env node
const { readFileSync } = require('fs')
const { Client } = require('pg')
const path = require('path')

const sqlPath = path.resolve(__dirname, '..', 'create_schema.sql')
const sql = readFileSync(sqlPath, 'utf8')

// If DATABASE_URL is not set in the environment, try loading from .env.local
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
    // ignore if file not found
  }
}

const envLocalPath = require('path').resolve(__dirname, '..', '.env.local')
loadDotEnv(envLocalPath)

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable is not set.\nEither set it in your shell or add it to .env.local in the project root.')
  process.exit(1)
}

async function run() {
  const client = new Client({ connectionString })
  try {
    await client.connect()
    console.log('Connected to database, applying schema...')
    await client.query(sql)
    console.log('Schema applied successfully.')
  } catch (err) {
    console.error('Error applying schema:', err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

run()
