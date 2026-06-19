const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) { console.error('DATABASE_URL not set'); process.exit(1) }

const sql = fs.readFileSync(path.join(__dirname, 'migrate_add_missing_columns.sql'), 'utf8')

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
})

pool.query(sql)
  .then((r) => {
    console.log('✅ Migration berhasil!')
    if (r.rows) console.log(r.rows)
    pool.end()
    process.exit(0)
  })
  .catch((e) => {
    console.error('❌ Migration gagal:', e.message)
    pool.end()
    process.exit(1)
  })
