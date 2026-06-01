'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { aiChat, business, user } from '@/lib/db/schema'
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
  await db.insert(aiChat).values({
    id,
    businessId,
    userId,
    messages: JSON.parse('[]'),
  })

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

export async function sendMessage(
  chatId: string,
  businessId: string,
  message: string
) {
  const userId = await getUserId()

  // Get or create chat
  let chat = await db.query.aiChat.findFirst({
    where: and(eq(aiChat.id, chatId), eq(aiChat.userId, userId)),
  })

  if (!chat) {
    throw new Error('Chat not found')
  }

  const messages = (chat.messages as ChatMessage[]) || []

  // Add user message
  const userMessage: ChatMessage = {
    role: 'user',
    content: message,
  }

  messages.push(userMessage)

  const businessInfo = await db.query.business.findFirst({
    where: and(eq(business.id, businessId), eq(business.userId, userId)),
  })

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  })

  // Get AI response
  let aiResponse = ''
  try {
    aiResponse = await chatWithAI(messages, {
      accountType: currentUser?.accountType || 'personal',
      phoneNumber: currentUser?.phoneNumber || undefined,
      businessType: businessInfo?.type || 'other',
      businessName: businessInfo?.name || 'Your business',
    })
  } catch (error) {
    aiResponse =
      'Sorry, I encountered an error processing your message. Please try again.'
  }

  // Add assistant message
  const assistantMessage: ChatMessage = {
    role: 'assistant',
    content: aiResponse,
  }

  messages.push(assistantMessage)

  // Update chat
  await db
    .update(aiChat)
    .set({
      messages,
      updatedAt: new Date(),
    })
    .where(and(eq(aiChat.id, chatId), eq(aiChat.userId, userId)))

  revalidatePath(`/dashboard/${businessId}/ai-chat`)

  return {
    userMessage,
    assistantMessage,
  }
}

export async function extractFromMessage(
  message: string
): Promise<Array<{ amount: number; description: string; category: string }>> {
  try {
    const expenses = await extractExpensesFromText(message)
    return expenses.map((exp) => ({
      amount: exp.amount,
      description: exp.description,
      category: exp.category,
    }))
  } catch (error) {
    console.error('Error extracting expenses:', error)
    return []
  }
}

export async function extractFromImage(
  imageData: string
): Promise<Array<{ amount: number; description: string; category: string }>> {
  try {
    const expenses = await extractExpensesFromImage(imageData)
    return expenses.map((exp) => ({
      amount: exp.amount,
      description: exp.description,
      category: exp.category,
    }))
  } catch (error) {
    console.error('Error extracting expenses from image:', error)
    return []
  }
}
