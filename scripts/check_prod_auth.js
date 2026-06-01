const { Pool } = require('pg')

// Production DB
const PROD_DB = 'postgresql://neondb_owner:npg_Y0dW8tAwaJDU@ep-curly-darkness-ap026pn3-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'

const pool = new Pool({ connectionString: PROD_DB })

async function check() {
  try {
    const users = await pool.query(`
      SELECT u.id, u.email, u.name, u."emailVerified", u."accountType",
             a.provider, a."providerId",
             CASE WHEN a.password IS NOT NULL THEN 'HAS_PASSWORD' ELSE 'NO_PASSWORD' END as pwd_status,
             LEFT(a.password, 20) as pwd_preview
      FROM "user" u
      LEFT JOIN account a ON a."userId" = u.id
      ORDER BY u."createdAt" DESC
      LIMIT 10
    `)
    console.log('\n👤 Users & Accounts:')
    users.rows.forEach(r => console.log(JSON.stringify(r)))

    // Cek apakah ada user tanpa password
    const noPwd = users.rows.filter(r => r.pwd_status === 'NO_PASSWORD')
    if (noPwd.length > 0) {
      console.log('\n⚠️  Users WITHOUT password:', noPwd.map(r => r.email))
    }

    // Cek format password (Better Auth pakai scrypt format)
    const withPwd = users.rows.filter(r => r.pwd_status === 'HAS_PASSWORD')
    console.log('\n✅ Users WITH password:', withPwd.map(r => `${r.email} (${r.pwd_preview}...)`))

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await pool.end()
  }
}

check()
