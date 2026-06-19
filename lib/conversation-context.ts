/**
 * Conversation Context Manager — Enterprise Grade
 * 
 * Maintains conversation history untuk enable contextual operations:
 * - Edit recent entries ("ubah yang tadi jadi 9.5 juta")
 * - Delete recent entries ("hapus transaksi terakhir")
 * - Reference previous items ("tambah lagi yang sama")
 * - Undo operations ("batal", "undo")
 */

import { nanoid } from 'nanoid'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConversationEntry {
  id: string
  userId: string
  businessId: string
  timestamp: number
  actionType: string
  operation: 'create' | 'update' | 'delete'
  entityType: 'transaction' | 'goal' | 'payable' | 'receivable' | 'inventory_item' | 'inventory_adjustment'
  entityId: string
  entityData: Record<string, any>
  userMessage: string
  aiResponse: string
}

export interface ConversationContext {
  entries: ConversationEntry[]
  lastUpdated: number
}

// ─── In-Memory Store (Replace with Redis for production) ─────────────────────

const conversationStore = new Map<string, ConversationContext>()

// Auto-cleanup old contexts every 30 minutes
setInterval(() => {
  const now = Date.now()
  const thirtyMinutes = 30 * 60 * 1000
  
  for (const [key, context] of conversationStore.entries()) {
    if (now - context.lastUpdated > thirtyMinutes) {
      conversationStore.delete(key)
    }
  }
}, 30 * 60 * 1000)

// ─── Core Functions ───────────────────────────────────────────────────────────

export function getContextKey(userId: string, businessId: string, source: 'telegram' | 'ai_chat' = 'telegram'): string {
  return `${source}:${userId}:${businessId}`
}

export function getConversationContext(key: string): ConversationContext {
  const existing = conversationStore.get(key)
  if (existing) return existing
  
  const newContext: ConversationContext = {
    entries: [],
    lastUpdated: Date.now(),
  }
  conversationStore.set(key, newContext)
  return newContext
}

export function addConversationEntry(
  key: string,
  entry: Omit<ConversationEntry, 'id' | 'timestamp'>
): ConversationEntry {
  const context = getConversationContext(key)
  
  const newEntry: ConversationEntry = {
    ...entry,
    id: nanoid(),
    timestamp: Date.now(),
  }
  
  // Keep only last 10 entries untuk hemat memory
  context.entries.push(newEntry)
  if (context.entries.length > 10) {
    context.entries.shift() // Remove oldest
  }
  
  context.lastUpdated = Date.now()
  conversationStore.set(key, context)
  
  return newEntry
}

export function getRecentEntries(
  key: string,
  limit: number = 5,
  entityType?: ConversationEntry['entityType']
): ConversationEntry[] {
  const context = getConversationContext(key)
  
  let entries = [...context.entries].reverse() // Most recent first
  
  if (entityType) {
    entries = entries.filter(e => e.entityType === entityType)
  }
  
  return entries.slice(0, limit)
}

export function getLastEntry(
  key: string,
  entityType?: ConversationEntry['entityType']
): ConversationEntry | null {
  const entries = getRecentEntries(key, 1, entityType)
  return entries[0] || null
}

export function findEntryById(key: string, entryId: string): ConversationEntry | null {
  const context = getConversationContext(key)
  return context.entries.find(e => e.id === entryId) || null
}

export function findEntryByEntityId(key: string, entityId: string): ConversationEntry | null {
  const context = getConversationContext(key)
  return context.entries.find(e => e.entityId === entityId) || null
}

export function clearContext(key: string): void {
  conversationStore.delete(key)
}

// ─── Context-Aware Intent Detection ──────────────────────────────────────────

export interface ContextualIntent {
  type: 'edit_last' | 'delete_last' | 'repeat_last' | 'undo' | 'reference' | 'new'
  targetEntry?: ConversationEntry
  modifications?: Record<string, any>
  confidence: number
}

/**
 * Detect kalau user mau edit/delete/reference data yang baru dibuat
 */
export function detectContextualIntent(
  message: string,
  contextKey: string
): ContextualIntent {
  const lower = message.toLowerCase().trim()
  
  // Keywords untuk edit
  const editKeywords = ['ubah', 'ganti', 'edit', 'update', 'perbaiki', 'koreksi', 'salah']
  const isEdit = editKeywords.some(kw => lower.includes(kw))
  
  // Keywords untuk delete
  const deleteKeywords = ['hapus', 'delete', 'buang', 'batalkan yang', 'remove']
  const isDelete = deleteKeywords.some(kw => lower.includes(kw))
  
  // Keywords untuk undo
  const undoKeywords = ['undo', 'batal', 'cancel', 'batalkan', 'kembalikan']
  const isUndo = undoKeywords.some(kw => lower.includes(kw))
  
  // Keywords untuk reference "yang tadi", "terakhir", "sebelumnya"
  const referenceKeywords = ['yang tadi', 'terakhir', 'sebelumnya', 'barusan', 'td', 'last', 'previous']
  const hasReference = referenceKeywords.some(kw => lower.includes(kw))
  
  // Keywords untuk repeat "lagi yang sama", "sama seperti tadi"
  const repeatKeywords = ['lagi yang sama', 'sama seperti', 'kayak tadi', 'ulang', 'repeat']
  const isRepeat = repeatKeywords.some(kw => lower.includes(kw))
  
  if (isUndo) {
    const lastEntry = getLastEntry(contextKey)
    return {
      type: 'undo',
      targetEntry: lastEntry || undefined,
      confidence: lastEntry ? 95 : 30,
    }
  }
  
  if (isEdit && hasReference) {
    const lastEntry = getLastEntry(contextKey)
    return {
      type: 'edit_last',
      targetEntry: lastEntry || undefined,
      confidence: lastEntry ? 90 : 40,
    }
  }
  
  if (isDelete && hasReference) {
    const lastEntry = getLastEntry(contextKey)
    return {
      type: 'delete_last',
      targetEntry: lastEntry || undefined,
      confidence: lastEntry ? 90 : 40,
    }
  }
  
  if (isRepeat) {
    const lastEntry = getLastEntry(contextKey)
    return {
      type: 'repeat_last',
      targetEntry: lastEntry || undefined,
      confidence: lastEntry ? 85 : 30,
    }
  }
  
  if (hasReference) {
    const lastEntry = getLastEntry(contextKey)
    return {
      type: 'reference',
      targetEntry: lastEntry || undefined,
      confidence: lastEntry ? 70 : 20,
    }
  }
  
  return {
    type: 'new',
    confidence: 100,
  }
}

// ─── Extract Modifications from Message ──────────────────────────────────────

/**
 * Extract apa yang mau diubah dari message
 * Contoh: "ubah jadi 9.5 juta" → { amount: 9500000 }
 */
export function extractModifications(message: string): Record<string, any> {
  const modifications: Record<string, any> = {}
  const lower = message.toLowerCase()
  
  // Extract amount
  const amountPatterns = [
    /jadi\s+(\d+(?:[.,]\d+)?)\s*(juta|jt|rb|ribu|k)/i,
    /ganti\s+(\d+(?:[.,]\d+)?)\s*(juta|jt|rb|ribu|k)/i,
    /ubah\s+(?:jadi\s+)?(\d+(?:[.,]\d+)?)\s*(juta|jt|rb|ribu|k)/i,
    /(\d+(?:[.,]\d+)?)\s*(juta|jt|rb|ribu|k)/i,
  ]
  
  for (const pattern of amountPatterns) {
    const match = message.match(pattern)
    if (match) {
      const num = parseFloat(match[1].replace(',', '.'))
      const unit = match[2].toLowerCase()
      
      let amount = num
      if (unit === 'juta' || unit === 'jt') amount *= 1000000
      else if (unit === 'ribu' || unit === 'rb' || unit === 'k') amount *= 1000
      
      modifications.amount = amount
      break
    }
  }
  
  // Extract description
  const descPatterns = [
    /deskripsi(?:nya)?\s+(?:jadi\s+)?["']?([^"']+)["']?/i,
    /untuk\s+["']?([^"']+)["']?/i,
    /catatan(?:nya)?\s+(?:jadi\s+)?["']?([^"']+)["']?/i,
  ]
  
  for (const pattern of descPatterns) {
    const match = message.match(pattern)
    if (match) {
      modifications.description = match[1].trim()
      break
    }
  }
  
  // Extract date
  const datePatterns = [
    /deadline\s+(?:jadi\s+)?(.+?)(?:\s|$)/i,
    /jatuh\s+tempo\s+(?:jadi\s+)?(.+?)(?:\s|$)/i,
    /tanggal\s+(?:jadi\s+)?(.+?)(?:\s|$)/i,
  ]
  
  for (const pattern of datePatterns) {
    const match = message.match(pattern)
    if (match) {
      modifications.date = match[1].trim()
      break
    }
  }
  
  // Extract contact name
  const contactPatterns = [
    /(?:ke|dari)\s+["']?([^"']+?)["']?\s+(?:jadi|ganti)/i,
    /nama\s+(?:jadi\s+)?["']?([^"']+)["']?/i,
  ]
  
  for (const pattern of contactPatterns) {
    const match = message.match(pattern)
    if (match) {
      modifications.contactName = match[1].trim()
      break
    }
  }
  
  return modifications
}

// ─── Format Context for AI ────────────────────────────────────────────────────

/**
 * Format recent context untuk inject ke AI prompt
 */
export function formatContextForAI(contextKey: string, limit: number = 5): string {
  const entries = getRecentEntries(contextKey, limit)
  
  if (entries.length === 0) {
    return 'Belum ada riwayat percakapan.'
  }
  
  const lines = entries.map((entry, idx) => {
    const timeAgo = formatTimeAgo(Date.now() - entry.timestamp)
    const action = formatAction(entry)
    return `${idx + 1}. ${timeAgo}: ${action}`
  })
  
  return `Riwayat ${entries.length} percakapan terakhir:\n${lines.join('\n')}`
}

function formatAction(entry: ConversationEntry): string {
  const { entityType, operation, entityData } = entry
  
  if (entityType === 'transaction' && operation === 'create') {
    const type = entityData.transaction_type === 'income' ? 'Pemasukan' : 'Pengeluaran'
    return `${type} Rp ${parseFloat(entityData.amount || 0).toLocaleString('id-ID')} - ${entityData.description}`
  }
  
  if (entityType === 'goal' && operation === 'create') {
    return `Buat goal "${entityData.title}" target Rp ${parseFloat(entityData.targetAmount || 0).toLocaleString('id-ID')}`
  }
  
  if (entityType === 'goal' && operation === 'update') {
    return `Update goal "${entityData.title}"`
  }
  
  if (entityType === 'payable' && operation === 'create') {
    return `Catat hutang ke ${entityData.contactName} Rp ${parseFloat(entityData.amount || 0).toLocaleString('id-ID')}`
  }
  
  if (entityType === 'receivable' && operation === 'create') {
    return `Catat piutang dari ${entityData.contactName} Rp ${parseFloat(entityData.amount || 0).toLocaleString('id-ID')}`
  }
  
  if (entityType === 'inventory_adjustment') {
    const typeLabel = entityData.type === 'in' ? 'Stok masuk' : entityData.type === 'out' ? 'Stok keluar' : 'Koreksi stok'
    return `${typeLabel} ${entityData.quantity} ${entityData.unit || 'unit'}`
  }
  
  return `${operation} ${entityType}`
}

function formatTimeAgo(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return 'Baru saja'
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} menit lalu`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  
  const days = Math.floor(hours / 24)
  return `${days} hari lalu`
}

// ─── Helper: Build Context Summary ───────────────────────────────────────────

export function buildContextSummary(contextKey: string): {
  totalEntries: number
  recentTransactions: number
  recentGoals: number
  recentPayables: number
  recentReceivables: number
  lastActivity: string | null
} {
  const context = getConversationContext(contextKey)
  const lastEntry = context.entries[context.entries.length - 1]
  
  return {
    totalEntries: context.entries.length,
    recentTransactions: context.entries.filter(e => e.entityType === 'transaction').length,
    recentGoals: context.entries.filter(e => e.entityType === 'goal').length,
    recentPayables: context.entries.filter(e => e.entityType === 'payable').length,
    recentReceivables: context.entries.filter(e => e.entityType === 'receivable').length,
    lastActivity: lastEntry ? formatTimeAgo(Date.now() - lastEntry.timestamp) : null,
  }
}
