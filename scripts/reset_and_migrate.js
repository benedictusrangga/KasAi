const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const DB_URL = 'postgresql://neondb_owner:npg_oFtzcY2Ua0EK@ep-super-haze-aobagih7-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

const pool = new Pool({ connectionString: DB_URL })

async function run() {
  const sqlFile = path.join(__dirname, 'reset_and_migrate.sql')
  const sql = fs.readFileSync(sqlFile, 'utf8')

  console.log('🔄 Menjalankan reset & migrate...')
  try {
    const result = await pool.query(sql)
    const last = Array.isArray(result) ? result[result.length - 1] : result
    console.log('✅', last.rows[0]?.status || 'Done')
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

run()
