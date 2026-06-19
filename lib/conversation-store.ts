/**
 * Conversation Store — Enterprise Grade
 *
 * Menyimpan konteks percakapan per user/chat:
 * - Riwayat operasi terakhir (untuk edit/undo)
 * - Pending confirmations
 * - Session state
 *
 * Menggunakan in-memory Map dengan TTL cleanup.
 * Untuk production: ganti dengan Redis (lihat komentar REDIS_UPGRADE).
 */

import type { AIAction } from './ai-actions'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecentOperation {
  id: string           // nanoid
  actionType: string   // e.g. 'create_transaction', 'create_goal'
  entityId: string     // ID record di database
  entityType: 'transaction' | 'goal' | 'payable' | 'receivable' | 'inventory_item' | 'inventory_log'
  snapshot: Record<string, any>  // Data sebelum operasi (untuk undo)
  executedData: Record<string, any>  // Data yang disimpan
  canEdit: boolean
  canUndo: boolean
  timestamp: number
  description: string  // Human-readable: "Pemasukan Rp 10.000.000 - Penjualan"
}

export interface ConversationSession {
  userId: string
  businessId: string
  pendingAction: AIAction | null
  pendingActionTimestamp: number | null
  recentOperations: RecentOperation[]   // max 10 operasi terakhir
  lastActivity: number
}

// ─── Store ────────────────────────────────────────────────────────────────────

// Key format: "telegram:{chatId}" atau "webchat:{userId}:{businessId}"
const store = new Map<string, ConversationSession>()

// TTL: 30 menit tidak aktif → hapus session
const SESSION_TTL = 30 * 60 * 1000
// Max recent operations per session
const MAX_RECENT_OPS = 10
// Pending action expire: 5 menit
const PENDING_TTL = 5 * 60 * 1000

// Cleanup setiap 5 menit
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, session] of store.entries()) {
      if (now - session.lastActivity > SESSION_TTL) {
        store.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

// ─── Session Management ───────────────────────────────────────────────────────

export function getOrCreateSession(key: string, defaults: Partial<ConversationSession> = {}): ConversationSession {
  const existing = store.get(key)
  if (existing) {
    existing.lastActivity = Date.now()
    return existing
  }

  const session: ConversationSession = {
    userId: defaults.userId || '',
    businessId: defaults.businessId || '',
    pendingAction: null,
    pendingActionTimestamp: null,
    recentOperations: [],
    lastActivity: Date.now(),
    ...defaults,
  }
  store.set(key, session)
  return session
}

export function getSession(key: string): ConversationSession | null {
  const session = store.get(key)
  if (!session) return null
  session.lastActivity = Date.now()
  return session
}

export function deleteSession(key: string) {
  store.delete(key)
}

// ─── Pending Action ───────────────────────────────────────────────────────────

export function setPendingAction(key: string, action: AIAction) {
  const session = getOrCreateSession(key)
  session.pendingAction = action
  session.pendingActionTimestamp = Date.now()
}

export function getPendingAction(key: string): AIAction | null {
  const session = store.get(key)
  if (!session?.pendingAction) return null
  // Check TTL
  if (Date.now() - (session.pendingActionTimestamp || 0) > PENDING_TTL) {
    session.pendingAction = null
    session.pendingActionTimestamp = null
    return null
  }
  return session.pendingAction
}

export function clearPendingAction(key: string) {
  const session = store.get(key)
  if (session) {
    session.pendingAction = null
    session.pendingActionTimestamp = null
  }
}

// ─── Recent Operations ────────────────────────────────────────────────────────

export function addRecentOperation(key: string, op: Omit<RecentOperation, 'id' | 'timestamp'>) {
  const session = getOrCreateSession(key)
  const { nanoid } = require('nanoid')
  
  const operation: RecentOperation = {
    ...op,
    id: nanoid(),
    timestamp: Date.now(),
  }

  // Prepend (terbaru di depan)
  session.recentOperations.unshift(operation)

  // Trim ke max
  if (session.recentOperations.length > MAX_RECENT_OPS) {
    session.recentOperations = session.recentOperations.slice(0, MAX_RECENT_OPS)
  }

  return operation
}

export function getRecentOperations(key: string): RecentOperation[] {
  return store.get(key)?.recentOperations || []
}

export function getLastOperation(key: string): RecentOperation | null {
  const ops = store.get(key)?.recentOperations || []
  return ops[0] || null
}

export function getOperationById(key: string, opId: string): RecentOperation | null {
  const ops = store.get(key)?.recentOperations || []
  return ops.find(op => op.id === opId) || null
}

export function removeOperation(key: string, opId: string) {
  const session = store.get(key)
  if (session) {
    session.recentOperations = session.recentOperations.filter(op => op.id !== opId)
  }
}

// ─── REDIS_UPGRADE ────────────────────────────────────────────────────────────
/*
Untuk production scale, ganti implementasi di atas dengan Redis:

import { Redis } from '@upstash/redis'
const redis = new Redis({ url: process.env.UPSTASH_REDIS_URL!, token: process.env.UPSTASH_REDIS_TOKEN! })

export async function setPendingAction(key: string, action: AIAction) {
  await redis.set(`pending:${key}`, JSON.stringify(action), { ex: 300 })
}

export async function getPendingAction(key: string): Promise<AIAction | null> {
  const data = await redis.get(`pending:${key}`)
  return data ? JSON.parse(data as string) : null
}

export async function addRecentOperation(key: string, op: ...) {
  const existing = await redis.get(`ops:${key}`) as string | null
  const ops = existing ? JSON.parse(existing) : []
  ops.unshift({ ...op, id: nanoid(), timestamp: Date.now() })
  await redis.set(`ops:${key}`, JSON.stringify(ops.slice(0, 10)), { ex: 1800 })
}
*/
