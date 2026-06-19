/**
 * Shared session utility — menggantikan getUserId() yang di-copy paste di semua action file.
 * Gunakan getSessionUserId() di semua server actions.
 */

import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'

/**
 * Ambil userId dari session aktif.
 * Throw 'Unauthorized' jika tidak ada session.
 */
export async function getSessionUserId(): Promise<string> {
  const h = await headers()
  const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

/**
 * Ambil full session object (user + session data).
 * Throw 'Unauthorized' jika tidak ada session.
 */
export async function getSession() {
  const h = await headers()
  const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session?.user) throw new Error('Unauthorized')
  return session
}
