'use client'

import { useEffect, useRef, useState } from 'react'
import { sendMessage, extractFromMessage } from '@/app/actions/ai-chat'
import { createTransaction } from '@/app/actions/transaction'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message {
  role: 'user' | 'assistant'
  content: string
  // Pesan khusus: inline PDF card
  pdfCard?: { period: 'week' | 'month' | 'all'; label: string }
}

interface ExtractedExpense {
  amount: number
  description: string
  category: string
}

const SUGGESTIONS_BY_TYPE: Record<string, string[]> = {
  cafe: ['Beli bahan baku kopi 450rb', 'Penjualan hari ini 1.2jt', 'Berapa laba bulan ini?', 'Kirim laporan PDF bulan ini'],
  laundry: ['Beli deterjen 150rb', 'Pendapatan laundry hari ini 800rb', 'Berapa pengeluaran bulan ini?', 'Kirim laporan PDF'],
  florist: ['Beli bunga mawar 300rb', 'Penjualan buket 500rb', 'Berapa laba minggu ini?', 'Kirim laporan PDF'],
  retail: ['Beli stok barang 2jt', 'Penjualan hari ini 1.5jt', 'Pengeluaran terbesar apa?', 'Kirim laporan PDF bulan ini'],
  personal: ['Bayar makan siang 50rb', 'Terima gaji 5jt', 'Berapa pengeluaran bulan ini?', 'Kirim laporan PDF'],
  other: ['Catat pengeluaran 100rb', 'Catat pemasukan 500rb', 'Berapa saldo saya?', 'Kirim laporan PDF bulan ini'],
}

const DEFAULT_SUGGESTIONS = SUGGESTIONS_BY_TYPE.other

// Deteksi apakah pesan user meminta laporan / PDF
function detectPdfIntent(text: string): { isPdf: boolean; period: 'week' | 'month' | 'all'; label: string } {
  const lower = text.toLowerCase()
  const isPdf =
    lower.includes('pdf') ||
    lower.includes('laporan') ||
    lower.includes('report') ||
    lower.includes('export') ||
    lower.includes('unduh') ||
    lower.includes('download') ||
    lower.includes('kirim laporan') ||
    lower.includes('buat laporan') ||
    lower.includes('cetak')

  if (!isPdf) return { isPdf: false, period: 'month', label: '' }

  let period: 'week' | 'month' | 'all' = 'month'
  let label = 'Bulan Ini'

  if (lower.includes('minggu') || lower.includes('week')) {
    period = 'week'
    label = 'Minggu Ini'
  } else if (
    lower.includes('semua') ||
    lower.includes('all') ||
    lower.includes('keseluruhan') ||
    lower.includes('total')
  ) {
    period = 'all'
    label = 'Semua Waktu'
  }

  return { isPdf: true, period, label }
}

// Komponen inline PDF download card
function PdfDownloadCard({
  businessId,
  businessName,
  period,
  label,
}: {
  businessId: string
  businessName: string
  period: 'week' | 'month' | 'all'
  label: string
}) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/report/pdf?businessId=${businessId}&period=${period}&format=json`
      )
      if (!res.ok) throw new Error('Gagal mengambil data laporan')
      const data = await res.json()

      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()

      // Header
      doc.setFillColor(79, 70, 229)
      doc.rect(0, 0, pageW, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('KasAI', 15, 15)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text('Laporan Keuangan', 15, 23)
      doc.setFontSize(9)
      doc.text(`${data.business.name} · ${data.period}`, 15, 30)
      doc.text(
        `Dibuat: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        pageW - 15,
        30,
        { align: 'right' }
      )

      let y = 45

      // Summary cards
      doc.setTextColor(30, 30, 30)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Ringkasan Keuangan', 15, y)
      y += 8

      const cards = [
        {
          label: 'Total Pemasukan',
          value: `Rp ${data.summary.totalIncome.toLocaleString('id-ID')}`,
          color: [16, 185, 129] as [number, number, number],
        },
        {
          label: 'Total Pengeluaran',
          value: `Rp ${data.summary.totalExpense.toLocaleString('id-ID')}`,
          color: [239, 68, 68] as [number, number, number],
        },
        {
          label: data.summary.netProfit >= 0 ? 'Laba Bersih' : 'Kerugian',
          value: `Rp ${Math.abs(data.summary.netProfit).toLocaleString('id-ID')}`,
          color: (data.summary.netProfit >= 0
            ? [79, 70, 229]
            : [239, 68, 68]) as [number, number, number],
        },
        {
          label: 'Total Transaksi',
          value: `${data.summary.txCount}`,
          color: [107, 114, 128] as [number, number, number],
        },
      ]

      const cardW = (pageW - 30 - 9) / 4
      cards.forEach((card, i) => {
        const x = 15 + i * (cardW + 3)
        doc.setFillColor(248, 250, 252)
        doc.roundedRect(x, y, cardW, 20, 2, 2, 'F')
        doc.setDrawColor(...card.color)
        doc.setLineWidth(0.5)
        doc.roundedRect(x, y, cardW, 20, 2, 2, 'S')
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(107, 114, 128)
        doc.text(card.label, x + cardW / 2, y + 7, { align: 'center' })
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...card.color)
        doc.text(card.value, x + cardW / 2, y + 15, { align: 'center' })
      })
      y += 28

      // Budget status
      if (data.budgetStatus && data.budgetStatus.length > 0) {
        doc.setTextColor(30, 30, 30)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Status Budget', 15, y)
        y += 6
        autoTable(doc, {
          startY: y,
          head: [['Kategori', 'Budget', 'Terpakai', 'Sisa', 'Status']],
          body: data.budgetStatus.map((b: any) => [
            b.category,
            `Rp ${b.budget.toLocaleString('id-ID')}`,
            `Rp ${b.spent.toLocaleString('id-ID')}`,
            `Rp ${Math.max(0, b.budget - b.spent).toLocaleString('id-ID')}`,
            b.status,
          ]),
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
          didParseCell: (d: any) => {
            if (d.column.index === 4 && d.section === 'body') {
              const val = d.cell.raw as string
              if (val === 'MELEBIHI') d.cell.styles.textColor = [239, 68, 68]
              else if (val === 'HAMPIR HABIS') d.cell.styles.textColor = [245, 158, 11]
              else d.cell.styles.textColor = [16, 185, 129]
            }
          },
          margin: { left: 15, right: 15 },
        })
        y = (doc as any).lastAutoTable.finalY + 10
      }

      // Goals
      const activeGoals = data.goals?.filter((g: any) => !g.completed) || []
      if (activeGoals.length > 0) {
        doc.setTextColor(30, 30, 30)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Target Keuangan', 15, y)
        y += 6
        autoTable(doc, {
          startY: y,
          head: [['Target', 'Target Jumlah', 'Tercapai', 'Progress', 'Deadline']],
          body: activeGoals.map((g: any) => [
            g.title,
            `Rp ${g.target.toLocaleString('id-ID')}`,
            `Rp ${g.current.toLocaleString('id-ID')}`,
            `${g.percentage}%`,
            g.deadline || '-',
          ]),
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
          margin: { left: 15, right: 15 },
        })
        y = (doc as any).lastAutoTable.finalY + 10
      }

      // Category breakdown
      if (data.byCategory && data.byCategory.length > 0) {
        doc.setTextColor(30, 30, 30)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Pengeluaran per Kategori', 15, y)
        y += 6
        autoTable(doc, {
          startY: y,
          head: [['Kategori', 'Jumlah', '% dari Total']],
          body: data.byCategory.map((c: any) => [
            c.category,
            `Rp ${c.amount.toLocaleString('id-ID')}`,
            `${c.percentage}%`,
          ]),
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
          margin: { left: 15, right: 15 },
        })
        y = (doc as any).lastAutoTable.finalY + 10
      }

      // Transactions
      if (data.transactions && data.transactions.length > 0) {
        doc.setTextColor(30, 30, 30)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Daftar Transaksi', 15, y)
        y += 6
        autoTable(doc, {
          startY: y,
          head: [['Tanggal', 'Deskripsi', 'Kategori', 'Tipe', 'Jumlah']],
          body: data.transactions.slice(0, 50).map((t: any) => [
            t.date,
            t.description,
            t.category,
            t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
            `${t.type === 'income' ? '+' : '-'}Rp ${t.amount.toLocaleString('id-ID')}`,
          ]),
          styles: { fontSize: 7.5, cellPadding: 2.5 },
          headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
          didParseCell: (d: any) => {
            if (d.column.index === 4 && d.section === 'body') {
              const val = d.cell.raw as string
              d.cell.styles.textColor = val.startsWith('+') ? [16, 185, 129] : [239, 68, 68]
              d.cell.styles.fontStyle = 'bold'
            }
          },
          margin: { left: 15, right: 15 },
        })
      }

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `KasAI · Laporan Keuangan · Halaman ${i} dari ${pageCount}`,
          pageW / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        )
      }

      const filename = `KasAI_${businessName.replace(/\s+/g, '_')}_${period}_${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(filename)
      setDone(true)
    } catch (err) {
      console.error('PDF error:', err)
      setError('Gagal membuat PDF. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mt-1 max-w-xs">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">📄</span>
        <div>
          <p className="text-sm font-semibold text-foreground">Laporan PDF Siap</p>
          <p className="text-xs text-muted-foreground">Periode: {label}</p>
        </div>
      </div>
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}
      {done ? (
        <p className="text-xs text-emerald-600 font-medium">✓ PDF berhasil diunduh</p>
      ) : (
        <Button
          size="sm"
          onClick={handleDownload}
          disabled={loading}
          className="w-full h-8 text-xs"
        >
          {loading ? '⏳ Membuat PDF...' : '⬇️ Unduh PDF'}
        </Button>
      )}
    </div>
  )
}

export function AiChat({
  chatId,
  businessId,
  businessType,
  businessName = '',
  initialMessages = [],
}: {
  chatId: string
  businessId: string
  businessType?: string
  businessName?: string
  initialMessages?: Message[]
}) {
  const suggestions = SUGGESTIONS_BY_TYPE[businessType || 'other'] || DEFAULT_SUGGESTIONS
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

    // Deteksi intent PDF sebelum kirim ke AI
    const pdfIntent = detectPdfIntent(text)

    try {
      const response = await sendMessage(chatId, businessId, text)
      const assistantContent = response.assistantMessage.content

      if (pdfIntent.isPdf) {
        // Tambahkan pesan AI + inline PDF card
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: assistantContent,
            pdfCard: { period: pdfIntent.period, label: pdfIntent.label },
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: assistantContent },
        ])

        // Coba ekstrak transaksi dari pesan user (hanya kalau bukan intent PDF)
        const expenses = await extractFromMessage(text)
        if (expenses.length > 0) setExtractedExpenses(expenses)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Maaf, terjadi kesalahan. Silakan coba lagi.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTransaction = async (expense: ExtractedExpense, idx: number) => {
    setCreatingTransaction(true)
    try {
      await createTransaction(businessId, expense.amount, expense.description, undefined, 'manual')
      setSavedIds((prev) => new Set([...prev, idx]))
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '❌ Gagal menyimpan transaksi. Silakan coba lagi.' },
      ])
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
              Tanya tentang keuangan bisnis Anda, catat transaksi, atau minta laporan PDF langsung dari sini.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {suggestions.map((s) => (
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
                <div className="flex flex-col gap-2 max-w-[75%]">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {/* Inline PDF card — hanya muncul di pesan assistant yang punya pdfCard */}
                  {msg.role === 'assistant' && msg.pdfCard && (
                    <PdfDownloadCard
                      businessId={businessId}
                      businessName={businessName}
                      period={msg.pdfCard.period}
                      label={msg.pdfCard.label}
                    />
                  )}
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
              <div
                key={idx}
                className="flex items-center justify-between bg-white rounded-lg border border-amber-100 px-3 py-2"
              >
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
          onSubmit={(e) => {
            e.preventDefault()
            handleSend(input)
          }}
          className="flex gap-2"
        >
          <Input
            placeholder='Ketik transaksi, pertanyaan, atau "kirim laporan PDF"...'
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
          Ketik "laporan PDF" atau "kirim laporan" untuk mengunduh laporan keuangan.
        </p>
      </div>
    </div>
  )
}
