const { Pool } = require('pg')

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_oFtzcY2Ua0EK@ep-super-haze-aobagih7-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
})

async function check() {
  try {
    const users = await pool.query('SELECT id, email, "accountType", "phoneNumber", "telegramId" FROM "user" LIMIT 10')
    console.log('\n👤 Users:')
    users.rows.forEach(r => console.log(' ', JSON.stringify(r)))

    const businesses = await pool.query('SELECT id, "userId", name, type FROM business LIMIT 10')
    console.log('\n🏪 Businesses:')
    businesses.rows.forEach(r => console.log(' ', JSON.stringify(r)))

    const chats = await pool.query('SELECT id, "businessId", "userId" FROM ai_chat LIMIT 10')
    console.log('\n💬 AI Chats:')
    chats.rows.forEach(r => console.log(' ', JSON.stringify(r)))

    const onboarding = await pool.query('SELECT "userId", step, completed FROM onboarding_progress LIMIT 10')
    console.log('\n✅ Onboarding:')
    onboarding.rows.forEach(r => console.log(' ', JSON.stringify(r)))

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await pool.end()
  }
}

check()
