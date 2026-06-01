const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const PROD_DB = 'postgresql://neondb_owner:npg_Y0dW8tAwaJDU@ep-curly-darkness-ap026pn3-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
const pool = new Pool({ connectionString: PROD_DB })

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, 'migrate_goals_budgets.sql'), 'utf8')
  console.log('🔄 Running goals & budgets migration...')
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
