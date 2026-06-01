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

const EXTRACTION_SYSTEM_PROMPT = `Kamu adalah asisten AI yang ahli mengekstrak informasi transaksi keuangan dari pesan teks dan gambar dalam bahasa Indonesia maupun Inggris.

Tugasmu:
1. Identifikasi apakah pesan mendeskripsikan pengeluaran (expense) atau pemasukan (income)
2. Ekstrak jumlah, deskripsi, dan kategori
3. Berikan confidence score

Gunakan kategori berikut: ${TRANSACTION_CATEGORIES.join(', ')}.

Aturan:
- Jika teks mendeskripsikan uang masuk/diterima/penjualan → transactionType: "income"
- Jika teks mendeskripsikan pengeluaran/pembelian/bayar → transactionType: "expense"
- Angka seperti "50rb", "50k", "50ribu" = 50000
- Angka seperti "1.2jt", "1,2jt", "1.2 juta" = 1200000

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
  const parts: string[] = []
  if (context.accountType) parts.push(`Tipe akun: ${context.accountType}.`)
  if (context.businessName) parts.push(`Nama bisnis: ${context.businessName}.`)
  if (context.businessType) parts.push(`Jenis bisnis: ${context.businessType}.`)
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
 * Chat conversational dengan AI — memahami konteks bisnis user
 */
export async function chatWithAI(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context?: {
    accountType?: string
    phoneNumber?: string
    businessType?: string
    businessName?: string
  }
): Promise<string> {
  const businessContext = context
    ? [
        `Tipe akun: ${context.accountType || 'personal'}.`,
        context.businessName ? `Nama bisnis: ${context.businessName}.` : '',
        context.businessType ? `Jenis bisnis: ${context.businessType}.` : '',
      ]
        .filter(Boolean)
        .join(' ')
    : ''

  const systemInstruction = `Kamu adalah asisten AI keuangan untuk aplikasi akuntansi UMKM Indonesia bernama KasAI.

Bantu pengguna untuk:
- Memahami pengeluaran dan pemasukan mereka
- Mendapatkan insight keuangan bisnis
- Menjawab pertanyaan tentang keuangan
- Memberikan saran budgeting dan efisiensi biaya

Aturan:
- Gunakan bahasa Indonesia yang ramah dan profesional
- Gunakan format Rupiah (Rp) untuk mata uang
- Jawaban singkat, padat, dan actionable
- Jika ada pertanyaan di luar keuangan, arahkan kembali ke topik keuangan bisnis

${businessContext}`

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
  }
): Promise<ExtractedTransaction[]> {
  try {
    const contextPrompt = buildContextPrompt(context)

    // Strip data URL prefix jika ada
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
                text: `${contextPrompt ? contextPrompt + '\n' : ''}Ekstrak semua transaksi dari struk atau invoice ini. Kembalikan hanya JSON array.`,
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
