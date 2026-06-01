/**
 * Server-side PDF generation menggunakan pdf-lib
 * Pure JavaScript, zero native dependencies, works on Vercel serverless.
 */

import {
  PDFDocument,
  PDFPage,
  rgb,
  StandardFonts,
  PDFFont,
  RGB,
} from 'pdf-lib'

export interface ReportData {
  businessName: string
  businessType: string
  period: string
  generatedAt: Date
  summary: {
    totalIncome: number
    totalExpense: number
    netProfit: number
    txCount: number
  }
  transactions: Array<{
    date: string
    description: string
    type: 'income' | 'expense'
    amount: number
    categoryId?: string | null
    source: string
  }>
  byCategory: Array<{ category: string; amount: number; percentage: number }>
  budgetStatus: Array<{
    category: string
    budget: number
    spent: number
    percentage: number
    status: string
  }>
  goals: Array<{
    title: string
    target: number
    current: number
    percentage: number
    completed: boolean
    deadline: string | null
  }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rp(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

/** Strip non-WinAnsi chars so pdf-lib doesn't throw on Indonesian text */
function safe(s: string): string {
  return s.replace(/[^\x20-\xFF]/g, '?')
}

function truncate(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s
  return s.slice(0, maxLen - 3) + '...'
}

// Colors
const C = {
  purple:    rgb(0.310, 0.275, 0.898),  // #4F46E5
  purpleDark:rgb(0.239, 0.208, 0.780),  // darker header
  green:     rgb(0.063, 0.725, 0.506),  // #10B981
  red:       rgb(0.937, 0.267, 0.267),  // #EF4444
  amber:     rgb(0.961, 0.620, 0.043),  // #F59E0B
  gray:      rgb(0.420, 0.447, 0.502),  // #6B7280
  grayLight: rgb(0.949, 0.980, 0.992),  // #F0FAFC
  grayBorder:rgb(0.898, 0.918, 0.933),  // #E5E7EB
  white:     rgb(1, 1, 1),
  black:     rgb(0.118, 0.118, 0.118),  // #1E1E1E
  rowAlt:    rgb(0.973, 0.984, 0.996),  // very light blue-gray
}

// ─── Page helper class ────────────────────────────────────────────────────────

class PageHelper {
  page: PDFPage
  font: PDFFont
  fontBold: PDFFont
  readonly W: number
  readonly H: number
  readonly ML = 40
  readonly MR = 40
  readonly MB = 35
  readonly CW: number
  y: number  // current Y from top

  constructor(page: PDFPage, font: PDFFont, fontBold: PDFFont) {
    this.page = page
    this.font = font
    this.fontBold = fontBold
    this.W = page.getWidth()
    this.H = page.getHeight()
    this.CW = this.W - this.ML - this.MR
    this.y = 40
  }

  /** Convert top-based y to pdf-lib bottom-based y */
  py(y: number, h = 0) {
    return this.H - y - h
  }

  needsNewPage(height: number) {
    return this.y + height > this.H - this.MB
  }

  // ── Drawing ────────────────────────────────────────────────────────────────

  fillRect(x: number, y: number, w: number, h: number, color: RGB) {
    this.page.drawRectangle({
      x, y: this.py(y, h), width: w, height: h,
      color,
    })
  }

  strokeRect(x: number, y: number, w: number, h: number, color: RGB, lineWidth = 0.5) {
    this.page.drawRectangle({
      x, y: this.py(y, h), width: w, height: h,
      borderColor: color, borderWidth: lineWidth,
    })
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, color: RGB, thickness = 0.5) {
    this.page.drawLine({
      start: { x: x1, y: this.py(y1) },
      end:   { x: x2, y: this.py(y2) },
      color, thickness,
    })
  }

  text(
    s: string,
    x: number,
    y: number,
    opts: {
      size?: number
      bold?: boolean
      color?: RGB
      maxWidth?: number
      align?: 'left' | 'right' | 'center'
    } = {}
  ) {
    const size = opts.size ?? 10
    const f = opts.bold ? this.fontBold : this.font
    const color = opts.color ?? C.black
    const str = safe(s)

    let tx = x
    if (opts.maxWidth && opts.align) {
      const tw = f.widthOfTextAtSize(str, size)
      if (opts.align === 'right') tx = x + opts.maxWidth - tw
      else if (opts.align === 'center') tx = x + (opts.maxWidth - tw) / 2
    }

    this.page.drawText(str, {
      x: tx,
      y: this.py(y + size),
      size,
      font: f,
      color,
    })
  }

  /** Draw text clipped to maxWidth chars (approximate) */
  textClip(s: string, x: number, y: number, maxWidth: number, opts: Parameters<PageHelper['text']>[3] = {}) {
    const size = opts.size ?? 10
    const f = opts.bold ? this.fontBold : this.font
    let str = safe(s)
    // Trim until fits
    while (str.length > 1 && f.widthOfTextAtSize(str, size) > maxWidth) {
      str = str.slice(0, -4) + '...'
    }
    this.text(str, x, y, opts)
  }

  // ── Section header ─────────────────────────────────────────────────────────

  sectionTitle(title: string) {
    this.text(title, this.ML, this.y, { size: 12, bold: true, color: C.black })
    this.y += 6
    this.drawLine(this.ML, this.y, this.ML + this.CW, this.y, C.purple, 1.5)
    this.y += 10
  }

  // ── Table helpers ──────────────────────────────────────────────────────────

  tableHeader(cols: Array<{ label: string; x: number; w: number; align?: 'left' | 'right' | 'center' }>, rowH = 18) {
    this.fillRect(this.ML, this.y, this.CW, rowH, C.purple)
    cols.forEach(col => {
      this.text(col.label, col.x, this.y + (rowH - 8) / 2, {
        size: 8, bold: true, color: C.white,
        maxWidth: col.w, align: col.align ?? 'left',
      })
    })
    this.y += rowH
  }

  tableRow(
    cells: Array<{ text: string; x: number; w: number; align?: 'left' | 'right' | 'center'; color?: RGB; bold?: boolean }>,
    rowH: number,
    isAlt: boolean
  ) {
    this.fillRect(this.ML, this.y, this.CW, rowH, isAlt ? C.rowAlt : C.white)
    cells.forEach(cell => {
      this.textClip(cell.text, cell.x, this.y + (rowH - 8) / 2, cell.w, {
        size: 8, color: cell.color ?? C.black, bold: cell.bold,
        maxWidth: cell.w, align: cell.align,
      })
    })
    this.y += rowH
  }
}

// ─── Main generator ───────────────────────────────────────────────────────────

export async function generateReportPdf(data: ReportData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.setTitle(`Laporan Keuangan - ${data.businessName}`)
  pdfDoc.setAuthor('KasAI')
  pdfDoc.setSubject(data.period)

  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Helper to add a new page
  function addPage(): PageHelper {
    const page = pdfDoc.addPage([595, 842]) // A4
    return new PageHelper(page, font, fontBold)
  }

  // Helper to get or create page when content overflows
  let ph = addPage()

  function ensureSpace(needed: number): void {
    if (ph.needsNewPage(needed)) {
      // Footer on current page
      drawFooter(ph, pdfDoc.getPageCount())
      ph = addPage()
      ph.y = 40
    }
  }

  function drawFooter(p: PageHelper, pageNum: number) {
    p.fillRect(0, p.H - 28, p.W, 28, C.grayLight)
    p.drawLine(0, p.H - 28, p.W, p.H - 28, C.grayBorder, 0.5)
    p.text(
      `KasAI  ·  Laporan Keuangan  ·  ${data.businessName}  ·  ${data.period}`,
      p.ML, p.H - 20, { size: 7, color: C.gray }
    )
    p.text(
      `Halaman ${pageNum}`,
      p.ML, p.H - 20, { size: 7, color: C.gray, maxWidth: p.CW, align: 'right' }
    )
  }

  // ── HEADER ────────────────────────────────────────────────────────────────
  // Purple gradient-like header
  ph.fillRect(0, 0, ph.W, 75, C.purple)
  ph.fillRect(0, 0, ph.W, 4, C.purpleDark)

  // KasAI logo text
  ph.text('KasAI', ph.ML, 14, { size: 22, bold: true, color: C.white })
  ph.text('Laporan Keuangan', ph.ML, 38, { size: 11, color: C.white })
  ph.text(
    safe(`${data.businessName}  ·  ${data.period}`),
    ph.ML, 52, { size: 9, color: rgb(0.8, 0.8, 1) }
  )

  const dateStr = data.generatedAt.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  ph.text(`Dibuat: ${dateStr}`, ph.ML, 52, {
    size: 9, color: rgb(0.8, 0.8, 1),
    maxWidth: ph.CW, align: 'right',
  })

  ph.y = 90

  // ── SUMMARY CARDS ─────────────────────────────────────────────────────────
  ph.sectionTitle('Ringkasan Keuangan')

  const cardW = (ph.CW - 12) / 4
  const cardH = 52
  const cards = [
    { label: 'Total Pemasukan',  value: rp(data.summary.totalIncome),              accent: C.green,  sub: `${data.transactions.filter(t => t.type === 'income').length} transaksi` },
    { label: 'Total Pengeluaran',value: rp(data.summary.totalExpense),             accent: C.red,    sub: `${data.transactions.filter(t => t.type === 'expense').length} transaksi` },
    { label: data.summary.netProfit >= 0 ? 'Laba Bersih' : 'Kerugian',
                                  value: rp(Math.abs(data.summary.netProfit)),      accent: data.summary.netProfit >= 0 ? C.purple : C.red, sub: data.summary.netProfit >= 0 ? 'Positif' : 'Negatif' },
    { label: 'Total Transaksi',  value: String(data.summary.txCount),              accent: C.gray,   sub: 'semua waktu' },
  ]

  const cardY = ph.y
  cards.forEach((card, i) => {
    const cx = ph.ML + i * (cardW + 4)
    // Card background
    ph.fillRect(cx, cardY, cardW, cardH, C.white)
    ph.strokeRect(cx, cardY, cardW, cardH, C.grayBorder, 0.8)
    // Accent top bar
    ph.fillRect(cx, cardY, cardW, 3, card.accent)
    // Label
    ph.text(safe(card.label), cx + 7, cardY + 10, { size: 7, color: C.gray })
    // Value
    ph.textClip(safe(card.value), cx + 7, cardY + 24, cardW - 14, { size: 10, bold: true, color: card.accent })
    // Sub
    ph.text(safe(card.sub), cx + 7, cardY + 38, { size: 7, color: C.gray })
  })
  ph.y = cardY + cardH + 20

  // ── CATEGORY BREAKDOWN ────────────────────────────────────────────────────
  if (data.byCategory.length > 0) {
    ensureSpace(20 + Math.min(data.byCategory.length, 10) * 16 + 20)
    ph.sectionTitle('Pengeluaran per Kategori')

    const cols = [
      { label: 'Kategori',    x: ph.ML + 6,           w: ph.CW * 0.45 },
      { label: 'Jumlah',      x: ph.ML + ph.CW * 0.5, w: ph.CW * 0.28, align: 'right' as const },
      { label: '% Total',     x: ph.ML + ph.CW * 0.8, w: ph.CW * 0.18, align: 'right' as const },
    ]
    ph.tableHeader(cols)

    data.byCategory.slice(0, 12).forEach((cat, i) => {
      ensureSpace(16)
      const cells = [
        { text: cat.category,         x: ph.ML + 6,           w: ph.CW * 0.44 },
        { text: rp(cat.amount),       x: ph.ML + ph.CW * 0.5, w: ph.CW * 0.28, align: 'right' as const },
        { text: `${cat.percentage}%`, x: ph.ML + ph.CW * 0.8, w: ph.CW * 0.18, align: 'right' as const },
      ]
      ph.tableRow(cells, 15, i % 2 === 1)

      // Mini bar chart
      const barX = ph.ML + ph.CW * 0.5 - 60
      const barW = 55
      const barH = 5
      const barY = ph.y - 15 + 5
      ph.fillRect(barX, barY, barW, barH, C.grayBorder)
      ph.fillRect(barX, barY, barW * (cat.percentage / 100), barH, C.purple)
    })
    ph.y += 16
  }

  // ── BUDGET STATUS ─────────────────────────────────────────────────────────
  if (data.budgetStatus.length > 0) {
    ensureSpace(20 + data.budgetStatus.length * 16 + 20)
    ph.sectionTitle('Status Budget Bulan Ini')

    const colW = ph.CW / 5
    const cols = [
      { label: 'Kategori', x: ph.ML + 6,              w: colW - 6 },
      { label: 'Budget',   x: ph.ML + colW,            w: colW - 4, align: 'right' as const },
      { label: 'Terpakai', x: ph.ML + colW * 2,        w: colW - 4, align: 'right' as const },
      { label: 'Sisa',     x: ph.ML + colW * 3,        w: colW - 4, align: 'right' as const },
      { label: 'Status',   x: ph.ML + colW * 4,        w: colW - 6, align: 'center' as const },
    ]
    ph.tableHeader(cols)

    data.budgetStatus.forEach((b, i) => {
      ensureSpace(16)
      const statusColor = b.status === 'MELEBIHI' ? C.red : b.status === 'HAMPIR HABIS' ? C.amber : C.green
      const sisa = Math.max(0, b.budget - b.spent)
      const cells = [
        { text: b.category,    x: ph.ML + 6,              w: colW - 6 },
        { text: rp(b.budget),  x: ph.ML + colW,            w: colW - 4, align: 'right' as const },
        { text: rp(b.spent),   x: ph.ML + colW * 2,        w: colW - 4, align: 'right' as const },
        { text: rp(sisa),      x: ph.ML + colW * 3,        w: colW - 4, align: 'right' as const },
        { text: b.status,      x: ph.ML + colW * 4,        w: colW - 6, align: 'center' as const, color: statusColor, bold: true },
      ]
      ph.tableRow(cells, 15, i % 2 === 1)

      // Progress bar under row
      const barX = ph.ML + colW
      const barW = colW * 2 - 8
      const barY = ph.y - 4
      ph.fillRect(barX, barY, barW, 3, C.grayBorder)
      const pct = Math.min(b.percentage / 100, 1)
      ph.fillRect(barX, barY, barW * pct, 3, statusColor)
    })
    ph.y += 16
  }

  // ── GOALS ─────────────────────────────────────────────────────────────────
  const activeGoals = data.goals.filter(g => !g.completed)
  if (activeGoals.length > 0) {
    ensureSpace(20 + activeGoals.length * 36 + 20)
    ph.sectionTitle('Target Keuangan')

    activeGoals.forEach((g, i) => {
      ensureSpace(36)
      const gy = ph.y
      ph.fillRect(ph.ML, gy, ph.CW, 32, i % 2 === 1 ? C.rowAlt : C.white)
      ph.strokeRect(ph.ML, gy, ph.CW, 32, C.grayBorder, 0.5)

      // Left: title + amounts
      ph.textClip(g.title, ph.ML + 8, gy + 5, ph.CW * 0.45, { size: 9, bold: true, color: C.black })
      ph.text(
        `${rp(g.current)} / ${rp(g.target)}`,
        ph.ML + 8, gy + 18, { size: 7.5, color: C.gray }
      )

      // Right: progress bar
      const barX = ph.ML + ph.CW * 0.52
      const barW = ph.CW * 0.36
      const barY = gy + 10
      const barH = 10
      ph.fillRect(barX, barY, barW, barH, C.grayBorder)
      const pct = Math.min(g.percentage / 100, 1)
      const barColor = pct >= 1 ? C.green : pct >= 0.7 ? C.purple : C.amber
      ph.fillRect(barX, barY, barW * pct, barH, barColor)
      // Percentage text
      ph.text(`${g.percentage}%`, barX + barW + 6, barY + 1, { size: 8, bold: true, color: barColor })

      if (g.deadline) {
        ph.text(`Deadline: ${g.deadline}`, barX, gy + 22, { size: 7, color: C.gray })
      }

      ph.y += 36
    })
    ph.y += 10
  }

  // ── TRANSACTIONS TABLE ────────────────────────────────────────────────────
  if (data.transactions.length > 0) {
    ensureSpace(30)
    ph.sectionTitle('Daftar Transaksi')

    const c1 = ph.ML + 6
    const c2 = ph.ML + 72
    const c3 = ph.ML + ph.CW * 0.62
    const c4 = ph.ML + ph.CW * 0.76

    const cols = [
      { label: 'Tanggal',    x: c1, w: 64 },
      { label: 'Deskripsi',  x: c2, w: ph.CW * 0.58 },
      { label: 'Tipe',       x: c3, w: ph.CW * 0.13, align: 'center' as const },
      { label: 'Jumlah',     x: c4, w: ph.CW * 0.22, align: 'right' as const },
    ]
    ph.tableHeader(cols)

    const maxRows = 60
    data.transactions.slice(0, maxRows).forEach((t, i) => {
      ensureSpace(14)
      const amtColor = t.type === 'income' ? C.green : C.red
      const sign = t.type === 'income' ? '+' : '-'
      const typeLabel = t.type === 'income' ? 'Masuk' : 'Keluar'

      const cells = [
        { text: t.date,                    x: c1, w: 64 },
        { text: t.description,             x: c2, w: ph.CW * 0.57 },
        { text: typeLabel,                 x: c3, w: ph.CW * 0.13, align: 'center' as const, color: amtColor },
        { text: `${sign}${rp(t.amount)}`,  x: c4, w: ph.CW * 0.22, align: 'right' as const, color: amtColor, bold: true },
      ]
      ph.tableRow(cells, 13, i % 2 === 1)
    })

    if (data.transactions.length > maxRows) {
      ph.y += 6
      ensureSpace(14)
      ph.text(
        `... dan ${data.transactions.length - maxRows} transaksi lainnya. Lihat laporan lengkap di aplikasi KasAI.`,
        ph.ML, ph.y, { size: 8, color: C.gray }
      )
      ph.y += 14
    }
  }

  // ── FOOTER on last page ───────────────────────────────────────────────────
  drawFooter(ph, pdfDoc.getPageCount())

  const bytes = await pdfDoc.save()
  return Buffer.from(bytes)
}
