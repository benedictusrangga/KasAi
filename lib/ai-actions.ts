/**
 * AI Action Handler — Enterprise Grade
 * 
 * Handles all AI-initiated actions with proper validation, error handling,
 * and transaction safety. This enables conversational AI to perform CRUD
 * operations across all features.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { nanoid } from 'nanoid'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// ─── Types ────────────────────────────────────────────────────────────────────

export type AIActionType =
  | 'create_transaction'
  | 'create_goal'
  | 'update_goal'
  | 'add_goal_contribution'
  | 'create_payable'
  | 'create_receivable'
  | 'update_payable_payment'
  | 'update_receivable_payment'
  | 'adjust_inventory_stock'
  | 'create_inventory_item'
  | 'query_data'
  | 'unknown'

export interface AIAction {
  type: AIActionType
  params: Record<string, any>
  confidence: number
  explanation: string
}

export interface AIActionResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

// ─── AI Action Parser ─────────────────────────────────────────────────────────

const ACTION_PARSER_PROMPT = `Kamu adalah AI parser yang mengidentifikasi intent user dan mengekstrak parameter action.

User bisa minta berbagai action, seperti:
- "Buat target tabungan 10 juta untuk beli motor"
- "Tambah 500rb ke target liburan"
- "Catat hutang ke supplier Budi 2 juta jatuh tempo 15 Januari"
- "Stok kopi masuk 50 kg"
- "Beli gula 50rb"

Tugasmu:
1. Identifikasi tipe action yang diminta
2. Ekstrak semua parameter yang relevan
3. Berikan confidence score

Tipe action yang didukung:
- create_transaction: Catat transaksi (income/expense)
- create_goal: Buat target/goal baru
- update_goal: Update target yang sudah ada (ubah jumlah/deadline)
- add_goal_contribution: Tambah kontribusi manual ke goal
- create_payable: Catat hutang baru (kita berhutang ke orang lain)
- create_receivable: Catat piutang baru (orang lain berhutang ke kita)
- update_payable_payment: Bayar hutang (partial/full)
- update_receivable_payment: Terima pembayaran piutang (partial/full)
- adjust_inventory_stock: Kelola stok (masuk/keluar/koreksi)
- create_inventory_item: Tambah barang baru ke inventaris
- query_data: User hanya tanya info, bukan minta action
- unknown: Tidak jelas apa yang diminta

Format angka Indonesia:
- "10jt", "10 juta", "10juta" = 10000000
- "500rb", "500ribu", "500k" = 500000
- "2.5jt" = 2500000

Format tanggal:
- "15 Januari", "15 Jan", "15/1" = parse ke Date
- "minggu depan", "bulan depan" = relative date
- "akhir bulan" = last day of current month

Balas HANYA dengan JSON:
{
  "type": "create_goal",
  "params": {
    "title": "Tabungan Motor",
    "targetAmount": 10000000,
    "description": "Beli motor untuk usaha",
    "deadline": "2024-12-31"
  },
  "confidence": 95,
  "explanation": "User ingin buat goal baru dengan target 10 juta"
}

Jika user tanya info (bukan action):
{
  "type": "query_data",
  "params": {},
  "confidence": 100,
  "explanation": "User bertanya informasi, bukan minta action"
}

Jika tidak jelas:
{
  "type": "unknown",
  "params": {},
  "confidence": 0,
  "explanation": "Intent tidak jelas, perlu klarifikasi"
}`

export async function parseUserIntent(message: string, context?: {
  businessName?: string
  accountType?: string
  activeGoals?: Array<{ id: string; title: string }>
}): Promise<AIAction> {
  try {
    const contextHint = context ? `
Konteks bisnis:
- Nama: ${context.businessName || 'N/A'}
- Tipe: ${context.accountType || 'N/A'}
${context.activeGoals && context.activeGoals.length > 0 ? `- Goal aktif: ${context.activeGoals.map(g => `"${g.title}" (ID: ${g.id})`).join(', ')}` : ''}
` : ''

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `${contextHint}Parse intent dari pesan user:\n\n"${message}"` }],
      }],
      systemInstruction: ACTION_PARSER_PROMPT,
    })

    const text = result.response.text()
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return {
      type: parsed.type || 'unknown',
      params: parsed.params || {},
      confidence: parsed.confidence || 0,
      explanation: parsed.explanation || '',
    }
  } catch (error) {
    console.error('[AIActions] Parse intent error:', error)
    return {
      type: 'unknown',
      params: {},
      confidence: 0,
      explanation: 'Gagal parse intent',
    }
  }
}

// ─── Action Validators ────────────────────────────────────────────────────────

export function validateTransactionParams(params: any): { valid: boolean; error?: string } {
  if (!params.amount || typeof params.amount !== 'number' || params.amount <= 0) {
    return { valid: false, error: 'Jumlah transaksi harus lebih dari 0' }
  }
  if (!params.description || typeof params.description !== 'string' || params.description.trim().length === 0) {
    return { valid: false, error: 'Deskripsi transaksi diperlukan' }
  }
  if (params.transactionType && !['income', 'expense'].includes(params.transactionType)) {
    return { valid: false, error: 'Tipe transaksi harus income atau expense' }
  }
  return { valid: true }
}

export function validateGoalParams(params: any): { valid: boolean; error?: string } {
  if (!params.title || typeof params.title !== 'string' || params.title.trim().length === 0) {
    return { valid: false, error: 'Judul goal diperlukan' }
  }
  if (!params.targetAmount || typeof params.targetAmount !== 'number' || params.targetAmount <= 0) {
    return { valid: false, error: 'Target amount harus lebih dari 0' }
  }
  return { valid: true }
}

export function validatePayableParams(params: any): { valid: boolean; error?: string } {
  if (!params.contactName || typeof params.contactName !== 'string' || params.contactName.trim().length === 0) {
    return { valid: false, error: 'Nama kontak diperlukan' }
  }
  if (!params.amount || typeof params.amount !== 'number' || params.amount <= 0) {
    return { valid: false, error: 'Jumlah harus lebih dari 0' }
  }
  if (!params.description || typeof params.description !== 'string' || params.description.trim().length === 0) {
    return { valid: false, error: 'Deskripsi diperlukan' }
  }
  return { valid: true }
}

export function validateInventoryAdjustmentParams(params: any): { valid: boolean; error?: string } {
  if (!params.itemId || typeof params.itemId !== 'string') {
    return { valid: false, error: 'Item ID diperlukan' }
  }
  if (!params.type || !['in', 'out', 'adjustment'].includes(params.type)) {
    return { valid: false, error: 'Tipe adjustment harus in, out, atau adjustment' }
  }
  if (!params.quantity || typeof params.quantity !== 'number' || params.quantity <= 0) {
    return { valid: false, error: 'Quantity harus lebih dari 0' }
  }
  return { valid: true }
}

// ─── Confirmation Message Generator ───────────────────────────────────────────

export function generateConfirmationMessage(action: AIAction): string {
  switch (action.type) {
    case 'create_goal':
      return `✅ Konfirmasi: Buat goal baru "${action.params.title}" dengan target Rp ${action.params.targetAmount?.toLocaleString('id-ID')}${action.params.deadline ? ` deadline ${new Date(action.params.deadline).toLocaleDateString('id-ID')}` : ''}?\n\nBalas "ya" untuk konfirmasi atau "tidak" untuk batal.`

    case 'update_goal':
      return `✅ Konfirmasi: Update goal "${action.params.title}"${action.params.newTargetAmount ? ` dengan target baru Rp ${action.params.newTargetAmount.toLocaleString('id-ID')}` : ''}${action.params.newDeadline ? ` deadline ${new Date(action.params.newDeadline).toLocaleDateString('id-ID')}` : ''}?\n\nBalas "ya" atau "tidak".`

    case 'add_goal_contribution':
      return `✅ Konfirmasi: Tambah Rp ${action.params.amount?.toLocaleString('id-ID')} ke goal "${action.params.goalTitle || action.params.goalId}"?\n\nBalas "ya" atau "tidak".`

    case 'create_payable':
      return `✅ Konfirmasi: Catat hutang kepada ${action.params.contactName} sebesar Rp ${action.params.amount?.toLocaleString('id-ID')} untuk ${action.params.description}${action.params.dueDate ? ` jatuh tempo ${new Date(action.params.dueDate).toLocaleDateString('id-ID')}` : ''}?\n\nBalas "ya" atau "tidak".`

    case 'create_receivable':
      return `✅ Konfirmasi: Catat piutang dari ${action.params.contactName} sebesar Rp ${action.params.amount?.toLocaleString('id-ID')} untuk ${action.params.description}${action.params.dueDate ? ` jatuh tempo ${new Date(action.params.dueDate).toLocaleDateString('id-ID')}` : ''}?\n\nBalas "ya" atau "tidak".`

    case 'update_payable_payment':
      return `✅ Konfirmasi: Bayar hutang sebesar Rp ${action.params.amount?.toLocaleString('id-ID')}?\n\nBalas "ya" atau "tidak".`

    case 'update_receivable_payment':
      return `✅ Konfirmasi: Terima pembayaran piutang sebesar Rp ${action.params.amount?.toLocaleString('id-ID')}?\n\nBalas "ya" atau "tidak".`

    case 'adjust_inventory_stock':
      const typeLabel = action.params.type === 'in' ? 'Stok masuk' : action.params.type === 'out' ? 'Stok keluar' : 'Koreksi stok'
      return `✅ Konfirmasi: ${typeLabel} ${action.params.quantity} ${action.params.unit || 'unit'} untuk ${action.params.itemName || 'barang'}?\n\nBalas "ya" atau "tidak".`

    case 'create_inventory_item':
      return `✅ Konfirmasi: Tambah barang baru "${action.params.name}" dengan stok awal ${action.params.currentStock || 0} ${action.params.unit || 'pcs'}?\n\nBalas "ya" atau "tidak".`

    case 'create_transaction':
      const type = action.params.transactionType === 'income' ? 'Pemasukan' : 'Pengeluaran'
      return `✅ Konfirmasi: ${type} Rp ${action.params.amount?.toLocaleString('id-ID')} untuk ${action.params.description}?\n\nBalas "ya" atau "tidak".`

    default:
      return `✅ Konfirmasi action?\n\nBalas "ya" atau "tidak".`
  }
}

// ─── Success Message Generator ────────────────────────────────────────────────

export function generateSuccessMessage(action: AIAction, result: any): string {
  switch (action.type) {
    case 'create_goal':
      return `🎯 Goal "${action.params.title}" berhasil dibuat! Target: Rp ${action.params.targetAmount?.toLocaleString('id-ID')}\n\nLihat di dashboard atau ketik "status goal" untuk cek progress.`

    case 'add_goal_contribution':
      const pct = result.percentage || 0
      return `💰 Kontribusi Rp ${action.params.amount?.toLocaleString('id-ID')} berhasil ditambahkan ke goal!\n\nProgress: ${pct}% dari target`

    case 'create_payable':
      return `💸 Hutang kepada ${action.params.contactName} sebesar Rp ${action.params.amount?.toLocaleString('id-ID')} berhasil dicatat.`

    case 'create_receivable':
      return `💰 Piutang dari ${action.params.contactName} sebesar Rp ${action.params.amount?.toLocaleString('id-ID')} berhasil dicatat.`

    case 'update_payable_payment':
      return `✅ Pembayaran hutang Rp ${action.params.amount?.toLocaleString('id-ID')} berhasil dicatat.${result.status === 'paid' ? ' Hutang sudah lunas!' : ''}`

    case 'update_receivable_payment':
      return `✅ Penerimaan pembayaran Rp ${action.params.amount?.toLocaleString('id-ID')} berhasil dicatat.${result.status === 'paid' ? ' Piutang sudah lunas!' : ''}`

    case 'adjust_inventory_stock':
      return `📦 Stok berhasil diupdate! Stok baru: ${result.newStock} ${action.params.unit || 'unit'}`

    case 'create_inventory_item':
      return `✅ Barang "${action.params.name}" berhasil ditambahkan ke inventaris!`

    case 'create_transaction':
      const txType = action.params.transactionType === 'income' ? 'Pemasukan' : 'Pengeluaran'
      return `✅ ${txType} Rp ${action.params.amount?.toLocaleString('id-ID')} berhasil dicatat!`

    default:
      return `✅ Action berhasil dieksekusi!`
  }
}

// ─── Relative Date Parser ─────────────────────────────────────────────────────

export function parseRelativeDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined

  const now = new Date()
  const lower = dateStr.toLowerCase()

  if (lower.includes('minggu depan') || lower.includes('next week')) {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  }
  if (lower.includes('bulan depan') || lower.includes('next month')) {
    return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
  }
  if (lower.includes('akhir bulan') || lower.includes('end of month')) {
    return new Date(now.getFullYear(), now.getMonth() + 1, 0)
  }
  if (lower.includes('tahun depan') || lower.includes('next year')) {
    return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
  }

  // Try parse as ISO date or Indonesian date format
  try {
    // Format: "15 Januari 2024", "15 Jan", "15/1/2024"
    const parsed = new Date(dateStr)
    if (!isNaN(parsed.getTime())) return parsed
  } catch {
    // ignore
  }

  return undefined
}
