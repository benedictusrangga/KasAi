/**
 * AI Edit Handler — Enterprise Grade
 *
 * Mendeteksi intent "edit" atau "undo" dari pesan user,
 * lalu menjalankan update/delete pada record terakhir yang dibuat.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { db } from '@/lib/db'
import { transaction, goal, payable, receivable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { RecentOperation } from './conversation-store'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditIntent {
  type: 'edit' | 'undo' | 'none'
  field?: string      // field yang mau diedit: 'amount', 'description', 'category', dll
  newValue?: any      // nilai baru
  confidence: number
  reason: string
}

export interface EditResult {
  success: boolean
  message: string
  updatedData?: Record<string, any>
}

// ─── Edit Intent Parser ───────────────────────────────────────────────────────

const EDIT_INTENT_PROMPT = `Kamu adalah parser yang mendeteksi apakah user ingin mengedit atau membatalkan sesuatu yang baru saja dilakukan.

Contoh pesan EDIT:
- "eh salah, yang tadi harusnya 9.5 juta bukan 10 juta"
- "koreksi, deskripsinya bukan gula tapi tepung"
- "ubah yang tadi jadi 500rb"
- "ganti jumlahnya jadi 2 juta"
- "salah input, yang tadi 1.2jt bukan 1jt"
- "edit yang tadi, kategorinya makan bukan belanja"
- "yang barusan harusnya pemasukan bukan pengeluaran"

Contoh pesan UNDO/BATALKAN:
- "batalkan yang tadi"
- "hapus yang baru saja"
- "undo"
- "cancel yang tadi"
- "salah input, hapus saja"
- "jangan jadi"

Contoh pesan BUKAN edit/undo (type: none):
- "beli gula 50rb" (transaksi baru)
- "berapa saldo saya" (query)
- "laporan bulan ini" (query)

Format balasan JSON:
{
  "type": "edit" | "undo" | "none",
  "field": "amount" | "description" | "category" | "transactionType" | "contactName" | "dueDate" | "title" | "targetAmount" | null,
  "newValue": <nilai baru yang diinginkan user, sudah diparse> | null,
  "confidence": 0-100,
  "reason": "penjelasan singkat"
}

Untuk field "amount"/"targetAmount", konversi ke number: "9.5jt" → 9500000, "500rb" → 500000
Untuk field "transactionType", konversi ke: "income" atau "expense"
Balas HANYA JSON.`

export async function parseEditIntent(message: string, lastOp?: RecentOperation | null): Promise<EditIntent> {
  try {
    const context = lastOp
      ? `\nOperasi terakhir: ${lastOp.description} (${lastOp.actionType})`
      : ''

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `${context}\n\nPesan user: "${message}"` }],
      }],
      systemInstruction: EDIT_INTENT_PROMPT,
    })

    const text = result.response.text()
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return {
      type: parsed.type || 'none',
      field: parsed.field || undefined,
      newValue: parsed.newValue ?? undefined,
      confidence: parsed.confidence || 0,
      reason: parsed.reason || '',
    }
  } catch {
    return { type: 'none', confidence: 0, reason: 'Parse failed' }
  }
}

// ─── Execute Edit ─────────────────────────────────────────────────────────────

export async function executeEdit(op: RecentOperation, intent: EditIntent): Promise<EditResult> {
  if (!op.canEdit) {
    return { success: false, message: 'Operasi ini tidak bisa diedit lagi.' }
  }

  try {
    switch (op.entityType) {
      case 'transaction':
        return await editTransaction(op, intent)
      case 'goal':
        return await editGoal(op, intent)
      case 'payable':
        return await editPayable(op, intent)
      case 'receivable':
        return await editReceivable(op, intent)
      default:
        return { success: false, message: 'Tipe entitas tidak didukung untuk edit.' }
    }
  } catch (error) {
    return {
      success: false,
      message: `Gagal mengedit: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

async function editTransaction(op: RecentOperation, intent: EditIntent): Promise<EditResult> {
  const updates: any = { updatedAt: new Date() }

  if (intent.field === 'amount' && intent.newValue !== undefined) {
    if (typeof intent.newValue !== 'number' || intent.newValue <= 0) {
      return { success: false, message: 'Jumlah tidak valid. Harus lebih dari 0.' }
    }
    updates.amount = intent.newValue.toString()
  } else if (intent.field === 'description' && intent.newValue !== undefined) {
    updates.description = String(intent.newValue).trim()
  } else if (intent.field === 'category' && intent.newValue !== undefined) {
    updates.categoryName = String(intent.newValue).trim()
  } else if (intent.field === 'transactionType' && intent.newValue !== undefined) {
    if (!['income', 'expense'].includes(intent.newValue)) {
      return { success: false, message: 'Tipe transaksi harus income atau expense.' }
    }
    updates.transaction_type = intent.newValue
  } else {
    return { success: false, message: `Field "${intent.field}" tidak bisa diedit pada transaksi.` }
  }

  await db.update(transaction).set(updates).where(eq(transaction.id, op.entityId))

  const existing = await db.query.transaction.findFirst({ where: eq(transaction.id, op.entityId) })
  return {
    success: true,
    message: `✅ Transaksi berhasil diperbarui!`,
    updatedData: existing || {},
  }
}

async function editGoal(op: RecentOperation, intent: EditIntent): Promise<EditResult> {
  const updates: any = { updatedAt: new Date() }

  if (intent.field === 'targetAmount' && intent.newValue !== undefined) {
    if (typeof intent.newValue !== 'number' || intent.newValue <= 0) {
      return { success: false, message: 'Target amount tidak valid.' }
    }
    updates.targetAmount = intent.newValue.toString()
  } else if ((intent.field === 'title' || intent.field === 'description') && intent.newValue !== undefined) {
    updates[intent.field] = String(intent.newValue).trim()
  } else if (intent.field === 'dueDate' && intent.newValue !== undefined) {
    try {
      updates.deadline = new Date(intent.newValue)
    } catch {
      return { success: false, message: 'Format tanggal tidak valid.' }
    }
  } else {
    return { success: false, message: `Field "${intent.field}" tidak bisa diedit pada goal.` }
  }

  await db.update(goal).set(updates).where(eq(goal.id, op.entityId))

  const existing = await db.query.goal.findFirst({ where: eq(goal.id, op.entityId) })
  return {
    success: true,
    message: `✅ Goal berhasil diperbarui!`,
    updatedData: existing || {},
  }
}

async function editPayable(op: RecentOperation, intent: EditIntent): Promise<EditResult> {
  const updates: any = { updatedAt: new Date() }

  if (intent.field === 'amount' && intent.newValue !== undefined) {
    if (typeof intent.newValue !== 'number' || intent.newValue <= 0) {
      return { success: false, message: 'Jumlah tidak valid.' }
    }
    updates.amount = intent.newValue.toString()
  } else if (intent.field === 'contactName' && intent.newValue !== undefined) {
    updates.contactName = String(intent.newValue).trim()
  } else if (intent.field === 'description' && intent.newValue !== undefined) {
    updates.description = String(intent.newValue).trim()
  } else if (intent.field === 'dueDate' && intent.newValue !== undefined) {
    try {
      updates.dueDate = new Date(intent.newValue)
    } catch {
      return { success: false, message: 'Format tanggal tidak valid.' }
    }
  } else {
    return { success: false, message: `Field "${intent.field}" tidak bisa diedit pada hutang.` }
  }

  await db.update(payable).set(updates).where(eq(payable.id, op.entityId))
  return { success: true, message: `✅ Data hutang berhasil diperbarui!` }
}

async function editReceivable(op: RecentOperation, intent: EditIntent): Promise<EditResult> {
  const updates: any = { updatedAt: new Date() }

  if (intent.field === 'amount' && intent.newValue !== undefined) {
    if (typeof intent.newValue !== 'number' || intent.newValue <= 0) {
      return { success: false, message: 'Jumlah tidak valid.' }
    }
    updates.amount = intent.newValue.toString()
  } else if (intent.field === 'contactName' && intent.newValue !== undefined) {
    updates.contactName = String(intent.newValue).trim()
  } else if (intent.field === 'description' && intent.newValue !== undefined) {
    updates.description = String(intent.newValue).trim()
  } else if (intent.field === 'dueDate' && intent.newValue !== undefined) {
    try {
      updates.dueDate = new Date(intent.newValue)
    } catch {
      return { success: false, message: 'Format tanggal tidak valid.' }
    }
  } else {
    return { success: false, message: `Field "${intent.field}" tidak bisa diedit pada piutang.` }
  }

  await db.update(receivable).set(updates).where(eq(receivable.id, op.entityId))
  return { success: true, message: `✅ Data piutang berhasil diperbarui!` }
}

// ─── Execute Undo ─────────────────────────────────────────────────────────────

export async function executeUndo(op: RecentOperation): Promise<EditResult> {
  if (!op.canUndo) {
    return { success: false, message: 'Operasi ini tidak bisa dibatalkan.' }
  }

  try {
    switch (op.entityType) {
      case 'transaction':
        await db.delete(transaction).where(eq(transaction.id, op.entityId))
        return { success: true, message: `🗑️ Transaksi "${op.executedData.description}" berhasil dihapus.` }

      case 'goal':
        await db.delete(goal).where(eq(goal.id, op.entityId))
        return { success: true, message: `🗑️ Goal "${op.executedData.title}" berhasil dihapus.` }

      case 'payable':
        await db.delete(payable).where(eq(payable.id, op.entityId))
        return { success: true, message: `🗑️ Hutang kepada "${op.executedData.contactName}" berhasil dihapus.` }

      case 'receivable':
        await db.delete(receivable).where(eq(receivable.id, op.entityId))
        return { success: true, message: `🗑️ Piutang dari "${op.executedData.contactName}" berhasil dihapus.` }

      default:
        return { success: false, message: 'Tidak bisa membatalkan operasi ini.' }
    }
  } catch (error) {
    return {
      success: false,
      message: `Gagal membatalkan: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

// ─── Format Success Message with Diff ────────────────────────────────────────

export function formatEditSuccessMessage(
  op: RecentOperation,
  intent: EditIntent,
  result: EditResult
): string {
  if (!result.success) return `❌ ${result.message}`

  const currency = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

  if (intent.type === 'undo') return result.message

  // Tampilkan before/after untuk edit jumlah
  if (intent.field === 'amount' || intent.field === 'targetAmount') {
    const oldVal = parseFloat(op.executedData.amount || op.executedData.targetAmount || '0')
    const newVal = intent.newValue as number
    return `${result.message}\n\n📝 Perubahan:\n• ${intent.field === 'amount' ? 'Jumlah' : 'Target'}: ${currency(oldVal)} → ${currency(newVal)}`
  }

  if (intent.field === 'description') {
    return `${result.message}\n\n📝 Perubahan:\n• Deskripsi: "${op.executedData.description}" → "${intent.newValue}"`
  }

  if (intent.field === 'transactionType') {
    const oldType = op.executedData.transaction_type === 'income' ? 'Pemasukan' : 'Pengeluaran'
    const newType = intent.newValue === 'income' ? 'Pemasukan' : 'Pengeluaran'
    return `${result.message}\n\n📝 Perubahan:\n• Tipe: ${oldType} → ${newType}`
  }

  return result.message
}
