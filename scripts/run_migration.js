const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Load env
const envFile = path.join(__dirname, '../.env.local')
let dbUrl = process.env.DATABASE_URL
if (!dbUrl && fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, 'utf8')
  const match = content.match(/DATABASE_URL="?([^"\n]+)"?/)
  if (match) dbUrl = match[1]
}

if (!dbUrl) {
  console.error('DATABASE_URL not found')
  process.exit(1)
}

const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
const sql = fs.readFileSync(path.join(__dirname, 'migrate_plan_column.sql'), 'utf8')

pool.query(sql)
  .then(results => {
    const last = Array.isArray(results) ? results[results.length - 1] : results
    console.log('Migration result:', last.rows)
    pool.end()
  })
  .catch(err => {
    console.error('Migration error:', err.message)
    pool.end()
    process.exit(1)
  })
