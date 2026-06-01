const { Pool } = require('pg')
const crypto = require('crypto')

const PROD_DB = 'postgresql://neondb_owner:npg_Y0dW8tAwaJDU@ep-curly-darkness-ap026pn3-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
const pool = new Pool({ connectionString: PROD_DB })

// Better Auth uses scrypt with this format: salt:hash (both hex)
// Node crypto scrypt: scrypt(password, salt, keylen)
async function verifyBetterAuthPassword(password, storedHash) {
  try {
    // Better Auth format: "salt:hash" where both are hex
    const [salt, hash] = storedHash.split(':')
    if (!salt || !hash) {
      console.log('  Format tidak dikenal:', storedHash.substring(0, 30))
      return false
    }
    const saltBuf = Buffer.from(salt, 'hex')
    const hashBuf = Buffer.from(hash, 'hex')
    const keylen = hashBuf.length

    return new Promise((resolve) => {
      crypto.scrypt(password, saltBuf, keylen, (err, derived) => {
        if (err) { resolve(false); return }
        resolve(crypto.timingSafeEqual(derived, hashBuf))
      })
    })
  } catch (e) {
    console.log('  Error verifying:', e.message)
    return false
  }
}

async function main() {
  const password = 'Saputro@12'

  const res = await pool.query(`
    SELECT u.email, a.password, a.provider
    FROM "user" u
    JOIN account a ON a."userId" = u.id
    WHERE u.email IN ('benedictus.rangga@gmail.com', 'benedictus.rangga9@gmail.com')
  `)

  for (const row of res.rows) {
    console.log(`\nEmail: ${row.email}`)
    console.log(`Provider: ${row.provider}`)
    console.log(`Hash preview: ${row.password?.substring(0, 40)}...`)
    console.log(`Hash length: ${row.password?.length}`)

    if (row.password) {
      const match = await verifyBetterAuthPassword(password, row.password)
      console.log(`Password "${password}" match: ${match ? '✅ COCOK' : '❌ TIDAK COCOK'}`)
    }
  }

  await pool.end()
}

main().catch(console.error)
