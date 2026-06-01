'use client'

import { useEffect, useRef, useState } from 'react'
import { sendMessage, extractFromMessage } from '@/app/actions/ai-chat'
import { createTransaction } from '@/app/actions/transaction'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ExtractedExpense {
  amount: number
  description: string
  category: string
}

const SUGGESTIONS = [
  'Beli bahan baku kopi 450rb',
  'Terima pembayaran dari pelanggan 1.2jt',
  'Berapa pengeluaran bulan ini?',
  'Bayar listrik 320.000',
]

export function AiChat({
  chatId,
  businessId,
  initialMessages = [],
}: {
  chatId: string
  businessId: string
  initialMessages?: Message[]
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [extractedExpenses, setExtractedExpenses] = useState<ExtractedExpense[]>([])
  const [creatingTransaction, setCreatingTransaction] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return
    setInput('')
    setLoading(true)
    setExtractedExpenses([])

    setMessages((prev) => [...prev, { role: 'user', content: text }])

    try {
      const response = await sendMessage(chatId, businessId, text)
      setMessages((prev) => [...prev, { role: 'assistant', content: response.assistantMessage.content }])

      const expenses = await extractFromMessage(text)
      if (expenses.length > 0) setExtractedExpenses(expenses)
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Maaf, terjadi kesalahan. Silakan coba lagi.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTransaction = async (expense: ExtractedExpense, idx: number) => {
    setCreatingTransaction(true)
    try {
      await createTransaction(businessId, expense.amount, expense.description, undefined, 'manual')
      setSavedIds((prev) => new Set([...prev, idx]))
    } catch (error) {
      console.error('Error creating transaction:', error)
    } finally {
      setCreatingTransaction(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-5xl mb-4">✦</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">AI Financial Assistant</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-8">
              Tanya tentang keuangan bisnis Anda, atau ceritakan transaksi — AI akan langsung mencatatnya.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-border bg-muted/50 hover:bg-accent hover:border-primary/30 transition-colors text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs mr-2 mt-0.5">
                    ✦
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted text-foreground rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs mr-2 mt-0.5">
                  ✦
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Extracted expenses */}
      {extractedExpenses.length > 0 && (
        <div className="mx-4 mb-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-800 mb-3">
            💡 Transaksi terdeteksi — simpan ke catatan?
          </p>
          <div className="space-y-2">
            {extractedExpenses.map((expense, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white rounded-lg border border-amber-100 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Rp {expense.amount.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-muted-foreground">{expense.description}</p>
                </div>
                {savedIds.has(idx) ? (
                  <span className="text-xs text-emerald-600 font-medium">✓ Tersimpan</span>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleCreateTransaction(expense, idx)}
                    disabled={creatingTransaction}
                    className="h-7 text-xs"
                  >
                    Simpan
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(input) }}
          className="flex gap-2"
        >
          <Input
            placeholder="Ketik transaksi atau pertanyaan keuangan..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 h-11"
          />
          <Button type="submit" disabled={loading || !input.trim()} className="h-11 px-5">
            {loading ? '...' : '↑'}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI dapat membuat kesalahan. Selalu verifikasi transaksi penting.
        </p>
      </div>
    </div>
  )
}
