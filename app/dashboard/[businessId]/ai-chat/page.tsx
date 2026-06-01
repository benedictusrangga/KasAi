import { auth } from '@/lib/auth'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBusiness } from '@/app/actions/business'
import { createAiChat, getAiChat } from '@/app/actions/ai-chat'
import { AiChat } from '@/components/ai-chat'

export const metadata = { title: 'AI Assistant — KasAI' }
export const dynamic = 'force-dynamic'

export default async function AiChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>
  searchParams: Promise<{ chatId?: string }>
}) {
  const { businessId } = await params
  const { chatId: chatIdParam } = await searchParams

  const h = await headers()
  const c = await cookies()
  const cookieString = c.getAll().map((ck) => `${ck.name}=${ck.value}`).join('; ')
  const reqHeaders = new Headers(h as any)
  if (cookieString) reqHeaders.set('cookie', cookieString)
  const session = await auth.api.getSession({ headers: reqHeaders })
  if (!session?.user) redirect('/sign-in')

  try {
    const business = await getBusiness(businessId)

    let chatId = chatIdParam
    let chat

    if (chatId) {
      try { chat = await getAiChat(chatId) } catch { chatId = undefined }
    }

    if (!chatId) {
      const newChat = await createAiChat(businessId)
      chatId = newChat.id
      chat = { messages: [] }
    }

    const messages = (chat?.messages || []) as Array<{ role: 'user' | 'assistant'; content: string }>

    return (
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-8 py-4 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Financial Assistant</h1>
            <p className="text-sm text-muted-foreground">{business.name} · Powered by Gemini AI</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <AiChat
            chatId={chatId}
            businessId={businessId}
            businessType={business.type}
            initialMessages={messages}
          />
        </div>
      </div>
    )
  } catch (err) {
    console.error('[AiChatPage] error:', err)
    redirect('/dashboard')
  }
}
