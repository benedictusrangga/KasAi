import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'

// URL production yang stabil
const PRODUCTION_URL = 'https://ai-accounting-mvp.vercel.app'

const baseURL =
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_ENV === 'production'
    ? PRODUCTION_URL
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')

export const auth = betterAuth({
  database: pool,
  baseURL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: [
    PRODUCTION_URL,
    'http://localhost:3000',
    'http://localhost:3001',
    // Terima semua subdomain Vercel untuk preview deployments
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 hari
    updateAge: 60 * 60 * 24,      // refresh setiap 1 hari
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // cache 5 menit di client
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    },
  },
})
