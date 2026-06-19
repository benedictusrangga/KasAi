import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema'

const { Pool } = pg

// Pool config optimal untuk produksi:
// - max 20 koneksi (turunkan ke 10 jika DB plan Anda punya limit lebih kecil)
// - idleTimeoutMillis 30s — lepas koneksi idle agar tidak menumpuk
// - connectionTimeoutMillis 5s — gagal cepat daripada hang
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  allowExitOnIdle: true,
})

export const db = drizzle(pool, { schema })
