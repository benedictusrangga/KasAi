'use server'

import { db } from '@/lib/db'
import { aiChat, business, transaction, user, goal, budget, payable, receivable, inventoryItem } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { chatWithAI, extractExpensesFromText, extractExpensesFromImage } from '@/lib/gemini'
import { getFeatureConfig } from './features'
import {
  getOrCreateSession,
  addRecentOperation,
  getLastOperation,
} from '@/lib/conversation-store'
import { parseUserIntent, generateSuccessMessage } from '@/lib/ai-actions'
import { executeAIAction } from '@/lib/ai-action-executor'
import { parseEditIntent, executeEdit, executeUndo, formatEditSuccessMessage } from '@/lib/ai-edit-handler'
import { getSessionUserId } from '@/lib/session'
import { buildSpendingByCategory } from '@/lib/category-utils'

const getUserId = getSessionUserId

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function createAiChat(businessId: string) {
  const userId = await getUserId()
  const id = nanoid()
  await db.insert(aiChat).values({ id, businessId, userId, messages: JSON.parse('[]') })
  return { id }
}

export async function getAiChat(chatId: string) {
  const userId = await getUserId()
  const chat = await db.query.aiChat.findFirst({
    where: and(eq(aiChat.id, chatId), eq(aiChat.userId, userId)),
  })
  if (!chat) throw new Error('Chat not found')
  return chat
}

async function buildFinancialSummary(businessId: string, userId: string) {
  // Get feature config untuk tahu fitur apa yang aktif
  const featureConfig = await getFeatureConfig(businessId).catch(() => ({
    enableInventory: false,
    enablePayables: false,
    enableReceivables: false,
    enableBudget: true,
    enableGoals: true,
    enableTelegram: true,
    enableTeam: false,
  }))

  const [allTxns, goals, budgets, payables, receivables, inventory] = await Promise.all([
    db.query.transaction.findMany({
      where: and(eq(transaction.businessId, businessId), eq(transaction.userId, userId)),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    }),
    featureConfig.enableGoals ? db.query.goal.findMany({
      where: and(eq(goal.businessId, businessId), eq(goal.userId, userId)),
    }) : Promise.resolve([]),
    featureConfig.enableBudget ? db.query.budget.findMany({
      where: and(eq(budget.businessId, businessId), eq(budget.userId, userId)),
    }) : Promise.resolve([]),
    featureConfig.enablePayables ? db.query.payable.findMany({
      where: eq(payable.businessId, businessId),
    }) : Promise.resolve([]),
    featureConfig.enableReceivables ? db.query.receivable.findMany({
      where: eq(receivable.businessId, businessId),
    }) : Promise.resolve([]),
    featureConfig.enableInventory ? db.query.inventoryItem.findMany({
      where: eq(inventoryItem.businessId, businessId),
    }) : Promise.resolve([]),
  ])

  const now = new Date()
  const thisMonth = allTxns.filter((t) => {
    const d = new Date(t.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const totalIncome = allTxns.filter((t) => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
  const totalExpense = allTxns.filter((t) => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
  const monthIncome = thisMonth.filter((t) => t.transaction_type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
  const monthExpense = thisMonth.filter((t) => t.transaction_type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)

  const topExpenses = allTxns
    .filter((t) => t.transaction_type === 'expense')
    .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
    .slice(0, 3)
    .map((t) => ({ desc: t.description, amount: parseFloat(t.amount) }))

  const recentTx = allTxns.slice(0, 5).map((t) => ({
    type: t.transaction_type,
    desc: t.description,
    amount: parseFloat(t.amount),
    date: new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
  }))

  // Budget status bulan ini — gunakan shared util untuk normalisasi category key
  const spendingByCategory = buildSpendingByCategory(
    thisMonth
      .filter((t) => t.transaction_type === 'expense')
      .map((t) => ({ categoryName: t.categoryName, categoryId: t.categoryId, amount: t.amount }))
  )

  const budgetStatus = budgets.map((b) => ({
    category: b.category,
    budget: parseFloat(b.amount),
    spent: spendingByCategory[b.category] || 0,
    percentage: Math.round(((spendingByCategory[b.category] || 0) / parseFloat(b.amount)) * 100),
  }))

  const activeGoals = goals.filter((g) => !g.completed).map((g) => ({
    title: g.title,
    target: parseFloat(g.targetAmount),
    current: parseFloat(g.currentAmount),
    percentage: Math.round((parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100),
    deadline: g.deadline ? new Date(g.deadline).toLocaleDateString('id-ID') : null,
  }))

  // Hutang & Piutang summary
  const payablesSummary = payables.length > 0 ? {
    totalUnpaid: payables.filter(p => p.status !== 'paid').length,
    totalAmount: payables.reduce((s, p) => s + (parseFloat(p.amount) - parseFloat(p.paidAmount)), 0),
    overdue: payables.filter(p => p.dueDate && new Date(p.dueDate) < now && p.status !== 'paid').length,
  } : null

  const receivablesSummary = receivables.length > 0 ? {
    totalUnpaid: receivables.filter(r => r.status !== 'paid').length,
    totalAmount: receivables.reduce((s, r) => s + (parseFloat(r.amount) - parseFloat(r.paidAmount)), 0),
    overdue: receivables.filter(r => r.dueDate && new Date(r.dueDate) < now && r.status !== 'paid').length,
  } : null

  // Inventory summary
  const inventorySummary = inventory.length > 0 ? {
    totalItems: inventory.length,
    lowStock: inventory.filter(i => {
      const min = parseFloat(i.minStock || '0')
      return min > 0 && parseFloat(i.currentStock) <= min
    }).length,
    totalValue: inventory.reduce((s, i) => {
      const price = parseFloat(i.sellPrice || '0')
      const stock = parseFloat(i.currentStock)
      return s + (price * stock)
    }, 0),
  } : null

  return {
    totalIncome, totalExpense, netProfit: totalIncome - totalExpense,
    txCount: allTxns.length, monthIncome, monthExpense,
    topExpenses, recentTx, budgetStatus, activeGoals,
    payablesSummary, receivablesSummary, inventorySummary,
    featureConfig, // Pass feature config ke AI
  }
}

export async function sendMessage(chatId: string, businessId: string, message: string) {
  const userId = await getUserId()

  const chat = await db.query.aiChat.findFirst({
    where: and(eq(aiChat.id, chatId), eq(aiChat.userId, userId)),
  })
  if (!chat) throw new Error('Chat not found')

  const messages = (chat.messages as ChatMessage[]) || []
  const userMessage: ChatMessage = { role: 'user', content: message }
  messages.push(userMessage)

  const sessionKey = `webchat:${userId}:${businessId}`
  getOrCreateSession(sessionKey, { userId, businessId })

  // ── 1. Cek intent edit/undo dari konteks percakapan ───────────────────────
  const lastOp = getLastOperation(sessionKey)
  if (lastOp) {
    const editIntent = await parseEditIntent(message, lastOp)

    if (editIntent.type !== 'none' && editIntent.confidence >= 70) {
      let aiText: string

      if (editIntent.type === 'undo') {
        if (lastOp.canUndo) {
          const result = await executeUndo(lastOp)
          if (result.success) {
            const session = getOrCreateSession(sessionKey)
            session.recentOperations = session.recentOperations.filter(op => op.id !== lastOp.id)
          }
          aiText = result.message
        } else {
          aiText = `❌ Operasi "${lastOp.description}" tidak bisa dibatalkan lagi.`
        }
      } else if (editIntent.type === 'edit') {
        if (lastOp.canEdit) {
          const result = await executeEdit(lastOp, editIntent)
          if (result.success && result.updatedData) {
            lastOp.executedData = { ...lastOp.executedData, ...result.updatedData }
          }
          aiText = formatEditSuccessMessage(lastOp, editIntent, result)
        } else {
          aiText = `❌ Operasi "${lastOp.description}" tidak bisa diedit lagi.`
        }
      } else {
        aiText = 'Intent tidak dikenali.'
      }

      const assistantMessage: ChatMessage = { role: 'assistant', content: aiText }
      messages.push(assistantMessage)
      await db.update(aiChat).set({ messages, updatedAt: new Date() })
        .where(and(eq(aiChat.id, chatId), eq(aiChat.userId, userId)))
      revalidatePath(`/dashboard/${businessId}/ai-chat`)
      return { userMessage, assistantMessage }
    }
  }

  // ── 2. Cek apakah ini action intent (goals, hutang, inventaris, dll) ───────
  const [businessInfo, currentUser, financialSummary] = await Promise.all([
    db.query.business.findFirst({ where: and(eq(business.id, businessId), eq(business.userId, userId)) }),
    db.query.user.findFirst({ where: eq(user.id, userId) }),
    buildFinancialSummary(businessId, userId),
  ])

  const activeGoals = await db.query.goal.findMany({
    where: and(eq(goal.businessId, businessId), eq(goal.userId, userId), eq(goal.completed, false)),
  })

  const action = await parseUserIntent(message, {
    businessName: businessInfo?.name,
    accountType: currentUser?.accountType || 'personal',
    activeGoals: activeGoals.map(g => ({ id: g.id, title: g.title })),
  })

  const isActionable =
    action.type !== 'unknown' &&
    action.type !== 'query_data' &&
    action.confidence >= 80

  if (isActionable) {
    // Execute langsung (di web chat tidak perlu konfirmasi terpisah karena ada UI)
    const result = await executeAIAction(action, { userId, businessId })

    let aiText: string
    if (result.success) {
      // Simpan ke recent ops
      const entityTypeMap: Record<string, any> = {
        create_transaction: 'transaction',
        create_goal: 'goal',
        update_goal: 'goal',
        create_payable: 'payable',
        create_receivable: 'receivable',
        create_inventory_item: 'inventory_item',
        adjust_inventory_stock: 'inventory_log',
      }
      const entityType = entityTypeMap[action.type]
      if (entityType && result.data?.id) {
        const p = action.params
        const currency = (n: number) => `Rp ${n?.toLocaleString('id-ID') || '0'}`
        const descMap: Record<string, string> = {
          create_transaction: `${p.transactionType === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${currency(p.amount)} - ${p.description}`,
          create_goal: `Goal "${p.title}" target ${currency(p.targetAmount)}`,
          add_goal_contribution: `Kontribusi ${currency(p.amount)} ke goal`,
          create_payable: `Hutang ke ${p.contactName} ${currency(p.amount)}`,
          create_receivable: `Piutang dari ${p.contactName} ${currency(p.amount)}`,
        }
        addRecentOperation(sessionKey, {
          actionType: action.type,
          entityId: result.data.id,
          entityType,
          snapshot: {},
          executedData: { ...p, ...result.data },
          canEdit: true,
          canUndo: true,
          description: descMap[action.type] || action.type,
        })
      }

      aiText = generateSuccessMessage(action, result.data)
      aiText += '\n\n💡 Ketik _"koreksi, yang tadi harusnya [nilai baru]"_ jika ada yang salah.'
    } else {
      aiText = `❌ ${result.message}`
    }

    const assistantMessage: ChatMessage = { role: 'assistant', content: aiText }
    messages.push(assistantMessage)
    await db.update(aiChat).set({ messages, updatedAt: new Date() })
      .where(and(eq(aiChat.id, chatId), eq(aiChat.userId, userId)))
    revalidatePath(`/dashboard/${businessId}/ai-chat`)
    return { userMessage, assistantMessage }
  }

  // ── 3. Fallback: Conversational AI ───────────────────────────────────────
  let aiResponse = ''
  try {
    aiResponse = await chatWithAI(messages, {
      accountType: currentUser?.accountType || 'personal',
      phoneNumber: currentUser?.phoneNumber || undefined,
      businessType: businessInfo?.type || 'other',
      businessName: businessInfo?.name || 'Bisnis Anda',
      aiPersona: currentUser?.aiPersona || 'professional',
      financialSummary,
    })
  } catch {
    aiResponse = 'Maaf, terjadi kesalahan. Silakan coba lagi.'
  }

  const assistantMessage: ChatMessage = { role: 'assistant', content: aiResponse }
  messages.push(assistantMessage)

  await db.update(aiChat).set({ messages, updatedAt: new Date() })
    .where(and(eq(aiChat.id, chatId), eq(aiChat.userId, userId)))

  revalidatePath(`/dashboard/${businessId}/ai-chat`)
  return { userMessage, assistantMessage }
}

export async function extractFromMessage(
  message: string
): Promise<Array<{ amount: number; description: string; category: string }>> {
  try {
    const expenses = await extractExpensesFromText(message)
    return expenses.map((exp) => ({ amount: exp.amount, description: exp.description, category: exp.category }))
  } catch {
    return []
  }
}

export async function extractFromImage(
  imageData: string
): Promise<Array<{ amount: number; description: string; category: string }>> {
  try {
    const expenses = await extractExpensesFromImage(imageData)
    return expenses.map((exp) => ({ amount: exp.amount, description: exp.description, category: exp.category }))
  } catch {
    return []
  }
}
