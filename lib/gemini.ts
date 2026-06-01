import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Model priority: coba dari yang terbaru, fallback ke yang lebih lama
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
]

// Helper: coba model satu per satu sampai berhasil
async function generateWithFallback(
  generateFn: (modelName: string) => Promise<string>
): Promise<string> {
  let lastError: unknown
  for (const modelName of GEMINI_MODELS) {
    try {
      return await generateFn(modelName)
    } catch (err: any) {
      // Jika model tidak tersedia / quota habis, coba model berikutnya
      const msg = err?.message || ''
      if (
        msg.includes('not found') ||
        msg.includes('not supported') ||
        msg.includes('quota') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('404')
      ) {
        lastError = err
        continue
      }
      // Error lain (network, auth, dll) — langsung throw
      throw err
    }
  }
  throw lastError
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtractedTransaction {
  amount: number
  description: string
  category:
    | 'groceries'
    | 'transportation'
    | 'utilities'
    | 'entertainment'
    | 'dining'
    | 'shopping'
    | 'healthcare'
    | 'education'
    | 'office_supplies'
    | 'other'
  transactionType: 'expense' | 'income'
  confidence: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TRANSACTION_CATEGORIES = [
  'groceries',
  'transportation',
  'utilities',
  'entertainment',
  'dining',
  'shopping',
  'healthcare',
  'education',
  'office_supplies',
  'other',
]

const EXTRACTION_SYSTEM_PROMPT = `Kamu adalah asisten AI yang ahli mengekstrak informasi transaksi keuangan dari pesan teks, struk, dan screenshot aplikasi perbankan Indonesia.

Tugasmu:
1. Identifikasi apakah ini pengeluaran (expense) atau pemasukan (income)
2. Ekstrak jumlah, deskripsi, dan kategori
3. Berikan confidence score

Gunakan kategori berikut: ${TRANSACTION_CATEGORIES.join(', ')}.

Aturan penting:
- Jika teks mendeskripsikan uang masuk/diterima/penjualan/transfer masuk → transactionType: "income"
- Jika teks mendeskripsikan pengeluaran/pembelian/bayar/transfer keluar/m-transfer berhasil → transactionType: "expense"
- Angka seperti "50rb", "50k", "50ribu" = 50000
- Angka seperti "1.2jt", "1,2jt", "1.2 juta" = 1200000
- Untuk screenshot transfer bank (BCA, Mandiri, BRI, BNI, dll): baca NOMINAL TRANSFER atau jumlah yang ditransfer
- Untuk struk belanja: baca total pembayaran
- Untuk screenshot m-banking/e-wallet: baca nominal transaksi
- Jika ada kata "BERHASIL", "SUCCESS", "Transfer Berhasil" → ini adalah transaksi yang valid
- Format nominal Indonesia: titik sebagai pemisah ribuan (750.000 = tujuh ratus lima puluh ribu)

Balas HANYA dengan JSON array, tanpa teks lain.

Format setiap transaksi:
{
  "amount": number,
  "description": string,
  "category": string,
  "transactionType": "expense" | "income",
  "confidence": number (0-100)
}

Jika tidak ada transaksi, kembalikan: []`

// ─── Context builder ──────────────────────────────────────────────────────────

function buildContextPrompt(context?: {
  accountType?: string
  businessType?: string
  businessName?: string
}): string {
  if (!context) return ''
  const isPersonal = context.accountType === 'personal'
  const parts: string[] = []
  if (isPersonal) {
    parts.push('Ini adalah keuangan personal (bukan bisnis).')
  } else {
    if (context.businessName) parts.push(`Nama bisnis: ${context.businessName}.`)
    if (context.businessType) parts.push(`Jenis bisnis: ${context.businessType}.`)
  }
  return parts.join(' ')
}

// ─── Parse helper ─────────────────────────────────────────────────────────────

function parseJsonResponse(raw: string): any {
  const cleaned = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
  return JSON.parse(cleaned)
}

// ─── Public functions ─────────────────────────────────────────────────────────

/**
 * Ekstrak transaksi dari teks natural language (bahasa Indonesia / Inggris)
 */
export async function extractTransactionsFromText(
  text: string,
  context?: {
    accountType?: string
    businessType?: string
    businessName?: string
  }
): Promise<ExtractedTransaction[]> {
  try {
    const contextPrompt = buildContextPrompt(context)

    const result = await generateWithFallback(async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName })
      const res = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${contextPrompt ? contextPrompt + '\n' : ''}Ekstrak transaksi dari teks berikut:\n\n${text}`,
              },
            ],
          },
        ],
        systemInstruction: EXTRACTION_SYSTEM_PROMPT,
      })
      return res.response.text()
    })

    const parsed = parseJsonResponse(result)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('[Gemini] extractTransactionsFromText error:', error)
    return []
  }
}

/**
 * Chat conversational dengan AI — memahami konteks bisnis + data keuangan user
 */
export async function chatWithAI(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context?: {
    accountType?: string
    phoneNumber?: string
    businessType?: string
    businessName?: string
    // Ringkasan keuangan — inject data real tapi hemat token
    financialSummary?: {
      totalIncome: number
      totalExpense: number
      netProfit: number
      txCount: number
      monthIncome: number
      monthExpense: number
      topExpenses: Array<{ desc: string; amount: number }>
      recentTx: Array<{ type: string; desc: string; amount: number; date: string }>
      budgetStatus?: Array<{ category: string; budget: number; spent: number; percentage: number }>
      activeGoals?: Array<{ title: string; target: number; current: number; percentage: number; deadline: string | null }>
    }
  }
): Promise<string> {
  const fs = context?.financialSummary
  const isPersonal = context?.accountType === 'personal'

  // Bangun ringkasan keuangan yang ringkas (hemat token)
  const financialContext = fs ? `
DATA KEUANGAN (gunakan untuk menjawab pertanyaan):
- Total pemasukan: Rp ${fs.totalIncome.toLocaleString('id-ID')}
- Total pengeluaran: Rp ${fs.totalExpense.toLocaleString('id-ID')}
- ${isPersonal ? 'Sisa uang' : 'Laba bersih'}: Rp ${fs.netProfit.toLocaleString('id-ID')}
- Total transaksi: ${fs.txCount}
- Bulan ini — pemasukan: Rp ${fs.monthIncome.toLocaleString('id-ID')}, pengeluaran: Rp ${fs.monthExpense.toLocaleString('id-ID')}
${fs.topExpenses.length > 0 ? `- Pengeluaran terbesar: ${fs.topExpenses.map(e => `${e.desc} (Rp ${e.amount.toLocaleString('id-ID')})`).join(', ')}` : ''}
${fs.recentTx.length > 0 ? `- 5 terakhir: ${fs.recentTx.map(t => `${t.type === 'income' ? '+' : '-'}Rp ${t.amount.toLocaleString('id-ID')} ${t.desc} (${t.date})`).join(' | ')}` : ''}
${fs.activeGoals && fs.activeGoals.length > 0 ? `- TARGET AKTIF: ${fs.activeGoals.map(g => `"${g.title}" ${g.percentage}% (${g.current.toLocaleString('id-ID')}/${g.target.toLocaleString('id-ID')})${g.deadline ? ` deadline ${g.deadline}` : ''}`).join(', ')}` : ''}
${fs.budgetStatus && fs.budgetStatus.length > 0 ? `- BUDGET BULAN INI: ${fs.budgetStatus.map(b => `${b.category} ${b.percentage}% (Rp ${b.spent.toLocaleString('id-ID')} dari Rp ${b.budget.toLocaleString('id-ID')})`).join(', ')}` : ''}` : ''

  const personalContext = isPersonal
    ? `Ini adalah akun KEUANGAN PERSONAL (bukan bisnis). Gunakan istilah yang sesuai:
- "pemasukan/pendapatan" bukan "omzet"
- "pengeluaran/belanja" bukan "biaya operasional"
- "sisa uang/tabungan" bukan "laba bersih"
- Fokus pada budgeting, penghematan, dan kebiasaan belanja`
    : `Ini adalah akun BISNIS (${context?.businessType || 'umum'}). Gunakan istilah bisnis:
- "omzet/pendapatan" untuk pemasukan
- "biaya/pengeluaran operasional" untuk pengeluaran
- "laba bersih/profit" untuk selisih
- Fokus pada profitabilitas, efisiensi biaya, dan pertumbuhan bisnis`

  const systemInstruction = `Kamu adalah asisten AI keuangan KasAI untuk UMKM dan personal Indonesia.
Nama: ${context?.businessName || 'Pengguna'}
${personalContext}
${financialContext}

Tugasmu:
- Jawab pertanyaan keuangan berdasarkan DATA DI ATAS secara akurat
- Beri insight dan saran yang relevan dengan tipe akun
- Jika ditanya nominal → jawab langsung dari data, jangan tanya balik
- Jika belum ada data → bilang "belum ada transaksi tercatat"

Format jawaban:
- Bahasa Indonesia, ramah, to the point
- Maks 3-4 kalimat untuk jawaban sederhana
- Gunakan format Rp X.XXX.XXX
- Boleh pakai emoji secukupnya untuk keterbacaan`

  const contents = messages.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }))

  return generateWithFallback(async (modelName) => {
    const model = genAI.getGenerativeModel({ model: modelName })
    const res = await model.generateContent({ contents, systemInstruction })
    return res.response.text()
  })
}

/**
 * Ekstrak transaksi dari gambar struk / invoice
 */
export async function extractTransactionsFromImage(
  imageData: string,
  context?: {
    accountType?: string
    businessType?: string
    businessName?: string
    caption?: string
  }
): Promise<ExtractedTransaction[]> {
  try {
    const contextPrompt = buildContextPrompt(context)
    const captionHint = context?.caption
      ? `\nKeterangan dari pengirim: "${context.caption}". Gunakan ini sebagai petunjuk deskripsi transaksi.`
      : ''

    let base64Data = imageData
    let mimeType = 'image/jpeg'
    if (imageData.startsWith('data:')) {
      const [header, data] = imageData.split(',')
      base64Data = data
      const mimeMatch = header.match(/data:([^;]+)/)
      if (mimeMatch) mimeType = mimeMatch[1]
    }

    const result = await generateWithFallback(async (modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName })
      const res = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: { mimeType, data: base64Data },
              },
              {
                text: `${contextPrompt ? contextPrompt + '\n' : ''}${captionHint}Ekstrak semua transaksi dari gambar ini (bisa berupa struk, screenshot transfer bank, bukti pembayaran, atau nota). Kembalikan hanya JSON array.`,
              },
            ],
          },
        ],
        systemInstruction: EXTRACTION_SYSTEM_PROMPT,
      })
      return res.response.text()
    })

    const parsed = parseJsonResponse(result)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('[Gemini] extractTransactionsFromImage error:', error)
    return []
  }
}

// Alias untuk backward compatibility
export const extractExpensesFromText = extractTransactionsFromText
export const extractExpensesFromImage = extractTransactionsFromImage
