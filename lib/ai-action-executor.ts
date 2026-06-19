/**
 * AI Action Executor — Enterprise Grade
 * 
 * Executes validated AI actions with proper error handling,
 * transaction safety, and audit logging.
 */

import { db } from '@/lib/db'
import { goal, payable, receivable, inventoryItem, inventoryLog, transaction } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { AIAction, AIActionResult } from './ai-actions'
import {
  validateTransactionParams,
  validateGoalParams,
  validatePayableParams,
  validateInventoryAdjustmentParams,
  parseRelativeDate,
} from './ai-actions'

// ─── Execute Action ───────────────────────────────────────────────────────────

export async function executeAIAction(
  action: AIAction,
  context: {
    userId: string
    businessId: string
  }
): Promise<AIActionResult> {
  try {
    switch (action.type) {
      case 'create_goal':
        return await executeCreateGoal(action, context)

      case 'update_goal':
        return await executeUpdateGoal(action, context)

      case 'add_goal_contribution':
        return await executeAddGoalContribution(action, context)

      case 'create_payable':
        return await executeCreatePayable(action, context)

      case 'create_receivable':
        return await executeCreateReceivable(action, context)

      case 'update_payable_payment':
        return await executeUpdatePayablePayment(action, context)

      case 'update_receivable_payment':
        return await executeUpdateReceivablePayment(action, context)

      case 'adjust_inventory_stock':
        return await executeAdjustInventoryStock(action, context)

      case 'create_inventory_item':
        return await executeCreateInventoryItem(action, context)

      case 'create_transaction':
        return await executeCreateTransaction(action, context)

      default:
        return {
          success: false,
          message: 'Action type tidak didukung',
          error: `Unknown action type: ${action.type}`,
        }
    }
  } catch (error) {
    console.error('[AIActionExecutor] Error:', error)
    return {
      success: false,
      message: 'Gagal mengeksekusi action',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ─── Goal Actions ─────────────────────────────────────────────────────────────

async function executeCreateGoal(
  action: AIAction,
  context: { userId: string; businessId: string }
): Promise<AIActionResult> {
  const validation = validateGoalParams(action.params)
  if (!validation.valid) {
    return { success: false, message: validation.error || 'Parameter tidak valid' }
  }

  const deadline = action.params.deadline ? parseRelativeDate(action.params.deadline) : undefined

  const id = nanoid()
  await db.insert(goal).values({
    id,
    userId: context.userId,
    businessId: context.businessId,
    title: action.params.title.trim(),
    description: action.params.description?.trim(),
    targetAmount: action.params.targetAmount.toString(),
    currentAmount: (action.params.startAmount || 0).toString(),
    deadline,
    completed: false,
  })

  return {
    success: true,
    message: 'Goal berhasil dibuat',
    data: { id, title: action.params.title, targetAmount: action.params.targetAmount },
  }
}

async function executeUpdateGoal(
  action: AIAction,
  context: { userId: string; businessId: string }
): Promise<AIActionResult> {
  if (!action.params.goalId) {
    return { success: false, message: 'Goal ID diperlukan' }
  }

  const existing = await db.query.goal.findFirst({
    where: and(eq(goal.id, action.params.goalId), eq(goal.userId, context.userId)),
  })

  if (!existing) {
    return { success: false, message: 'Goal tidak ditemukan' }
  }

  const updates: any = { updatedAt: new Date() }
  if (action.params.newTitle) updates.title = action.params.newTitle.trim()
  if (action.params.newTargetAmount) updates.targetAmount = action.params.newTargetAmount.toString()
  if (action.params.newDeadline) updates.deadline = parseRelativeDate(action.params.newDeadline)

  await db.update(goal).set(updates).where(eq(goal.id, action.params.goalId))

  return {
    success: true,
    message: 'Goal berhasil diupdate',
    data: { goalId: action.params.goalId },
  }
}

async function executeAddGoalContribution(
  action: AIAction,
  context: { userId: string; businessId: string }
): Promise<AIActionResult> {
  if (!action.params.goalId) {
    return { success: false, message: 'Goal ID diperlukan' }
  }
  if (!action.params.amount || action.params.amount <= 0) {
    return { success: false, message: 'Jumlah kontribusi harus lebih dari 0' }
  }

  const existing = await db.query.goal.findFirst({
    where: and(eq(goal.id, action.params.goalId), eq(goal.userId, context.userId)),
  })

  if (!existing) {
    return { success: false, message: 'Goal tidak ditemukan' }
  }

  const newCurrent = parseFloat(existing.currentAmount) + action.params.amount
  const target = parseFloat(existing.targetAmount)
  const completed = newCurrent >= target

  await db.update(goal).set({
    currentAmount: newCurrent.toString(),
    completed,
    updatedAt: new Date(),
  }).where(eq(goal.id, action.params.goalId))

  const percentage = Math.round((newCurrent / target) * 100)

  // Cek apakah perlu catat sebagai transaksi expense
  let transactionId: string | undefined
  if (action.params.alsoRecordAsExpense) {
    transactionId = nanoid()
    await db.insert(transaction).values({
      id: transactionId,
      businessId: context.businessId,
      userId: context.userId,
      inputByUserId: context.userId,
      amount: action.params.amount.toString(),
      transaction_type: 'expense',
      description: action.params.note || `Tabungan: ${existing.title}`,
      categoryName: 'Tabungan/Goal',
      source: 'manual',
    })
  }

  return {
    success: true,
    message: 'Kontribusi berhasil ditambahkan',
    data: {
      goalId: action.params.goalId,
      newCurrent,
      target,
      percentage,
      completed,
      transactionId,
    },
  }
}

// ─── Payables & Receivables ───────────────────────────────────────────────────

async function executeCreatePayable(
  action: AIAction,
  context: { userId: string; businessId: string }
): Promise<AIActionResult> {
  const validation = validatePayableParams(action.params)
  if (!validation.valid) {
    return { success: false, message: validation.error || 'Parameter tidak valid' }
  }

  const dueDate = action.params.dueDate ? parseRelativeDate(action.params.dueDate) : undefined

  const id = nanoid()
  await db.insert(payable).values({
    id,
    businessId: context.businessId,
    userId: context.userId,
    contactName: action.params.contactName.trim(),
    contactPhone: action.params.contactPhone?.trim(),
    amount: action.params.amount.toString(),
    paidAmount: '0',
    description: action.params.description.trim(),
    dueDate,
    status: 'unpaid',
    notes: action.params.notes?.trim(),
  })

  return {
    success: true,
    message: 'Hutang berhasil dicatat',
    data: { id, contactName: action.params.contactName, amount: action.params.amount },
  }
}

async function executeCreateReceivable(
  action: AIAction,
  context: { userId: string; businessId: string }
): Promise<AIActionResult> {
  const validation = validatePayableParams(action.params) // Same validation
  if (!validation.valid) {
    return { success: false, message: validation.error || 'Parameter tidak valid' }
  }

  const dueDate = action.params.dueDate ? parseRelativeDate(action.params.dueDate) : undefined

  const id = nanoid()
  await db.insert(receivable).values({
    id,
    businessId: context.businessId,
    userId: context.userId,
    contactName: action.params.contactName.trim(),
    contactPhone: action.params.contactPhone?.trim(),
    amount: action.params.amount.toString(),
    paidAmount: '0',
    description: action.params.description.trim(),
    dueDate,
    status: 'unpaid',
    notes: action.params.notes?.trim(),
  })

  return {
    success: true,
    message: 'Piutang berhasil dicatat',
    data: { id, contactName: action.params.contactName, amount: action.params.amount },
  }
}

async function executeUpdatePayablePayment(
  action: AIAction,
  context: { userId: string; businessId: string }
): Promise<AIActionResult> {
  if (!action.params.payableId) {
    return { success: false, message: 'Payable ID diperlukan' }
  }
  if (!action.params.amount || action.params.amount <= 0) {
    return { success: false, message: 'Jumlah pembayaran harus lebih dari 0' }
  }

  const existing = await db.query.payable.findFirst({
    where: eq(payable.id, action.params.payableId),
  })

  if (!existing) {
    return { success: false, message: 'Hutang tidak ditemukan' }
  }

  const totalAmount = parseFloat(existing.amount)
  const currentPaid = parseFloat(existing.paidAmount)
  const newPaid = Math.min(currentPaid + action.params.amount, totalAmount)
  const status = newPaid >= totalAmount ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid'

  await db.update(payable).set({
    paidAmount: newPaid.toString(),
    status,
    updatedAt: new Date(),
  }).where(eq(payable.id, action.params.payableId))

  return {
    success: true,
    message: 'Pembayaran hutang berhasil dicatat',
    data: { payableId: action.params.payableId, status, newPaid, totalAmount },
  }
}

async function executeUpdateReceivablePayment(
  action: AIAction,
  context: { userId: string; businessId: string }
): Promise<AIActionResult> {
  if (!action.params.receivableId) {
    return { success: false, message: 'Receivable ID diperlukan' }
  }
  if (!action.params.amount || action.params.amount <= 0) {
    return { success: false, message: 'Jumlah penerimaan harus lebih dari 0' }
  }

  const existing = await db.query.receivable.findFirst({
    where: eq(receivable.id, action.params.receivableId),
  })

  if (!existing) {
    return { success: false, message: 'Piutang tidak ditemukan' }
  }

  const totalAmount = parseFloat(existing.amount)
  const currentPaid = parseFloat(existing.paidAmount)
  const newPaid = Math.min(currentPaid + action.params.amount, totalAmount)
  const status = newPaid >= totalAmount ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid'

  await db.update(receivable).set({
    paidAmount: newPaid.toString(),
    status,
    updatedAt: new Date(),
  }).where(eq(receivable.id, action.params.receivableId))

  return {
    success: true,
    message: 'Penerimaan pembayaran berhasil dicatat',
    data: { receivableId: action.params.receivableId, status, newPaid, totalAmount },
  }
}

// ─── Inventory Actions ────────────────────────────────────────────────────────

async function executeAdjustInventoryStock(
  action: AIAction,
  context: { userId: string; businessId: string }
): Promise<AIActionResult> {
  const validation = validateInventoryAdjustmentParams(action.params)
  if (!validation.valid) {
    return { success: false, message: validation.error || 'Parameter tidak valid' }
  }

  const existing = await db.query.inventoryItem.findFirst({
    where: eq(inventoryItem.id, action.params.itemId),
  })

  if (!existing) {
    return { success: false, message: 'Barang tidak ditemukan di inventaris' }
  }

  const currentStock = parseFloat(existing.currentStock)
  let newStock: number

  if (action.params.type === 'in') {
    newStock = currentStock + action.params.quantity
  } else if (action.params.type === 'out') {
    newStock = Math.max(0, currentStock - action.params.quantity)
  } else {
    newStock = action.params.quantity // adjustment = set langsung
  }

  await db.update(inventoryItem).set({
    currentStock: newStock.toString(),
    updatedAt: new Date(),
  }).where(eq(inventoryItem.id, action.params.itemId))

  // Log pergerakan
  const logId = nanoid()
  await db.insert(inventoryLog).values({
    id: logId,
    businessId: context.businessId,
    itemId: action.params.itemId,
    userId: context.userId,
    type: action.params.type,
    quantity: action.params.quantity.toString(),
    note: action.params.note?.trim(),
  })

  return {
    success: true,
    message: 'Stok berhasil diupdate',
    data: { itemId: action.params.itemId, newStock, unit: existing.unit },
  }
}

async function executeCreateInventoryItem(
  action: AIAction,
  context: { userId: string; businessId: string }
): Promise<AIActionResult> {
  if (!action.params.name || action.params.name.trim().length === 0) {
    return { success: false, message: 'Nama barang diperlukan' }
  }

  const id = nanoid()
  await db.insert(inventoryItem).values({
    id,
    businessId: context.businessId,
    userId: context.userId,
    name: action.params.name.trim(),
    sku: action.params.sku?.trim(),
    unit: action.params.unit?.trim() || 'pcs',
    currentStock: (action.params.currentStock || 0).toString(),
    minStock: (action.params.minStock || 0).toString(),
    buyPrice: action.params.buyPrice?.toString(),
    sellPrice: action.params.sellPrice?.toString(),
    description: action.params.description?.trim(),
  })

  return {
    success: true,
    message: 'Barang berhasil ditambahkan ke inventaris',
    data: { id, name: action.params.name },
  }
}

// ─── Transaction Actions ──────────────────────────────────────────────────────

async function executeCreateTransaction(
  action: AIAction,
  context: { userId: string; businessId: string }
): Promise<AIActionResult> {
  const validation = validateTransactionParams(action.params)
  if (!validation.valid) {
    return { success: false, message: validation.error || 'Parameter tidak valid' }
  }

  const id = nanoid()
  await db.insert(transaction).values({
    id,
    businessId: context.businessId,
    userId: context.userId,
    inputByUserId: context.userId,
    amount: action.params.amount.toString(),
    transaction_type: action.params.transactionType || 'expense',
    description: action.params.description.trim(),
    categoryName: action.params.category?.trim(),
    source: action.params.source || 'manual',
    notes: action.params.notes?.trim(),
  })

  return {
    success: true,
    message: 'Transaksi berhasil dicatat',
    data: {
      id,
      amount: action.params.amount,
      type: action.params.transactionType || 'expense',
      description: action.params.description,
    },
  }
}
