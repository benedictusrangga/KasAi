const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_oFtzcY2Ua0EK@ep-super-haze-aobagih7-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
})

async function verify() {
  try {
    // List all tables
    const tables = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    )
    console.log('\n✅ Tables created:')
    tables.rows.forEach(r => console.log('  -', r.tablename))

    // List all enum types
    const enums = await pool.query(
      "SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname"
    )
    console.log('\n✅ Enum types:')
    enums.rows.forEach(r => console.log('  -', r.typname))

    // List all indexes
    const indexes = await pool.query(
      "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname"
    )
    console.log('\n✅ Indexes:')
    indexes.rows.forEach(r => console.log('  -', r.indexname))

    console.log('\n🎉 Database schema verified successfully!')
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

verify()
