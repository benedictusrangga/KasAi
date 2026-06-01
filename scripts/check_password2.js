const { Pool } = require('pg')
const crypto = require('crypto')

const PROD_DB = 'postgresql://neondb_owner:npg_Y0dW8tAwaJDU@ep-curly-darkness-ap026pn3-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
const pool = new Pool({ connectionString: PROD_DB })

// Better Auth v1 uses: scrypt with N=16384, r=16, p=1, keylen=64
// salt is random bytes, stored as hex
// format: "hexSalt:hexDerivedKey"
async function tryVerify(password, storedHash, N, r, p, keylen) {
  try {
    const [saltHex, hashHex] = storedHash.split(':')
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    return new Promise((resolve) => {
      crypto.scrypt(password, salt, keylen, { N, r, p }, (err, derived) => {
        if (err) { resolve(false); return }
        try {
          resolve(crypto.timingSafeEqual(derived, expected))
        } catch { resolve(false) }
      })
    })
  } catch { return false }
}

async function main() {
  const password = 'Saputro@12'

  const res = await pool.query(`
    SELECT u.email, a.password FROM "user" u
    JOIN account a ON a."userId" = u.id
    WHERE u.email = 'benedictus.rangga9@gmail.com'
  `)

  const stored = res.rows[0]?.password
  if (!stored) { console.log('No password found'); await pool.end(); return }

  const [saltHex, hashHex] = stored.split(':')
  console.log('Salt length (bytes):', saltHex.length / 2)
  console.log('Hash length (bytes):', hashHex.length / 2)

  // Try different scrypt params that Better Auth might use
  const configs = [
    { N: 16384, r: 16, p: 1, keylen: 64, label: 'Better Auth default' },
    { N: 16384, r: 8,  p: 1, keylen: 64, label: 'scrypt standard' },
    { N: 65536, r: 8,  p: 1, keylen: 64, label: 'high security' },
    { N: 16384, r: 16, p: 1, keylen: 32, label: 'keylen 32' },
    { N: 4096,  r: 8,  p: 1, keylen: 64, label: 'low N' },
  ]

  for (const cfg of configs) {
    const match = await tryVerify(password, stored, cfg.N, cfg.r, cfg.p, cfg.keylen)
    console.log(`${cfg.label} (N=${cfg.N},r=${cfg.r},keylen=${cfg.keylen}): ${match ? '✅ MATCH' : '❌'}`)
  }

  await pool.end()
}

main().catch(console.error)
