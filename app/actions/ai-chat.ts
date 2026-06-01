'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { aiChat, business, transaction, user } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { headers, cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { chatWithAI, extractExpensesFromText, extractExpensesFromImage } from '@/lib/gemini'

async function getUserId() {
  const h = await headers()
  const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

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
  const allTxns = await db.query.transaction.findMany({
    where: and(eq(transaction.businessId, businessId), eq(transaction.userId, userId)),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })

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

  return { totalIncome, totalExpense, netProfit: totalIncome - totalExpense, txCount: allTxns.length, monthIncome, monthExpense, topExpenses, recentTx }
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

  const [businessInfo, currentUser, financialSummary] = await Promise.all([
    db.query.business.findFirst({ where: and(eq(business.id, businessId), eq(business.userId, userId)) }),
    db.query.user.findFirst({ where: eq(user.id, userId) }),
    buildFinancialSummary(businessId, userId),
  ])

  let aiResponse = ''
  try {
    aiResponse = await chatWithAI(messages, {
      accountType: currentUser?.accountType || 'personal',
      phoneNumber: currentUser?.phoneNumber || undefined,
      businessType: businessInfo?.type || 'other',
      businessName: businessInfo?.name || 'Bisnis Anda',
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
