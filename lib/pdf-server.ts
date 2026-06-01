/**
 * Server-side PDF generation — pure TypeScript, zero dependencies.
 * Menggunakan raw PDF 1.4 spec, tidak butuh font files eksternal.
 * Compatible dengan Vercel serverless / Edge runtime.
 */

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

function rp(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

function safe(s: string): string {
  // Escape PDF string special chars
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    // Replace non-latin chars with '?' to avoid encoding issues in standard PDF fonts
    .replace(/[^\x20-\x7E]/g, '?')
}

// ─── Minimal PDF builder ──────────────────────────────────────────────────────

class PdfBuilder {
  private objects: string[] = []
  private offsets: number[] = []
  private buf: string[] = []
  private pageIds: number[] = []
  private contentIds: number[] = []
  private currentPage = 0

  // Page dimensions (A4 in points: 595 x 842)
  readonly W = 595
  readonly H = 842
  readonly ML = 40  // margin left
  readonly MR = 40  // margin right
  readonly MT = 40  // margin top
  readonly MB = 40  // margin bottom
  readonly CW: number  // content width

  private y = 0  // current Y position (from top)
  private pageContent: string[] = []

  constructor() {
    this.CW = this.W - this.ML - this.MR
  }

  // Add a PDF object, return its 1-based ID
  private addObj(content: string): number {
    this.objects.push(content)
    return this.objects.length  // 1-based
  }

  // Convert top-based Y to PDF bottom-based Y
  private py(y: number) {
    return this.H - y
  }

  // ── Drawing primitives ──────────────────────────────────────────────────────

  private cmd(s: string) {
    this.pageContent.push(s)
  }

  setFill(r: number, g: number, b: number) {
    this.cmd(`${(r/255).toFixed(3)} ${(g/255).toFixed(3)} ${(b/255).toFixed(3)} rg`)
  }

  setStroke(r: number, g: number, b: number) {
    this.cmd(`${(r/255).toFixed(3)} ${(g/255).toFixed(3)} ${(b/255).toFixed(3)} RG`)
  }

  setLineWidth(w: number) {
    this.cmd(`${w} w`)
  }

  rect(x: number, y: number, w: number, h: number, fill = true, stroke = false) {
    const op = fill && stroke ? 'B' : fill ? 'f' : 'S'
    this.cmd(`${x} ${this.py(y + h)} ${w} ${h} re ${op}`)
  }

  line(x1: number, y1: number, x2: number, y2: number) {
    this.cmd(`${x1} ${this.py(y1)} m ${x2} ${this.py(y2)} l S`)
  }

  text(
    s: string,
    x: number,
    y: number,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; align?: 'left' | 'right' | 'center'; maxWidth?: number } = {}
  ) {
    const size = opts.size ?? 10
    const font = opts.bold ? '/F2' : '/F1'
    const [r, g, b] = opts.color ?? [0, 0, 0]

    let tx = x
    if (opts.align === 'right' && opts.maxWidth) {
      // Approximate text width: size * 0.5 per char for Helvetica
      const tw = s.length * size * 0.5
      tx = x + opts.maxWidth - tw
    } else if (opts.align === 'center' && opts.maxWidth) {
      const tw = s.length * size * 0.5
      tx = x + (opts.maxWidth - tw) / 2
    }

    this.cmd(
      `BT ${font} ${size} Tf ${(r/255).toFixed(3)} ${(g/255).toFixed(3)} ${(b/255).toFixed(3)} rg ` +
      `${tx} ${this.py(y + size * 0.8)} Td (${safe(s)}) Tj ET`
    )
  }

  // Truncate string to fit maxWidth (approximate)
  truncate(s: string, maxWidth: number, size: number): string {
    const charW = size * 0.52
    const maxChars = Math.floor(maxWidth / charW)
    if (s.length <= maxChars) return s
    return s.slice(0, maxChars - 3) + '...'
  }

  // ── Page management ─────────────────────────────────────────────────────────

  newPage() {
    if (this.pageContent.length > 0) this.flushPage()
    this.pageContent = []
    this.y = this.MT
    this.currentPage++
  }

  private flushPage() {
    const stream = this.pageContent.join('\n')
    const contentId = this.addObj(
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
    )
    this.contentIds.push(contentId)

    const pageId = this.addObj(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.W} ${this.H}] ` +
      `/Contents ${contentId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`
    )
    this.pageIds.push(pageId)
  }

  // Check if we need a new page
  checkPage(neededHeight: number) {
    if (this.y + neededHeight > this.H - this.MB) {
      this.flushPage()
      this.pageContent = []
      this.y = this.MT
      this.currentPage++
    }
  }

  getY() { return this.y }
  setY(y: number) { this.y = y }
  advanceY(dy: number) { this.y += dy }

  // ── Build final PDF ─────────────────────────────────────────────────────────

  build(): Buffer {
    // Flush last page
    if (this.pageContent.length > 0) this.flushPage()

    // We need to insert catalog (1), pages (2), font1 (3), font2 (4) BEFORE page objects
    // But our objects array is 1-based already from addObj calls.
    // Rebuild with proper ordering:

    const allObjects: string[] = []

    // obj 1: catalog (placeholder, filled after)
    // obj 2: pages (placeholder)
    // obj 3: Helvetica font
    // obj 4: Helvetica-Bold font
    // obj 5+: content streams and page dicts

    // Shift all existing object IDs by 4
    const shift = 4
    const shiftedContentIds = this.contentIds.map(id => id + shift)
    const shiftedPageIds = this.pageIds.map(id => id + shift)

    const pagesRef = shiftedPageIds.map(id => `${id} 0 R`).join(' ')

    const fixedObjs = [
      // obj 1: catalog
      `<< /Type /Catalog /Pages 2 0 R >>`,
      // obj 2: pages
      `<< /Type /Pages /Kids [${pagesRef}] /Count ${shiftedPageIds.length} >>`,
      // obj 3: Helvetica
      `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`,
      // obj 4: Helvetica-Bold
      `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`,
    ]

    // Rebuild page objects with shifted font/content refs
    const rebuiltPageObjs = this.objects.map((obj, i) => {
      // Page objects reference content streams and font resources
      // Content IDs and page IDs need to be shifted
      return obj.replace(/(\d+) 0 R/g, (match, id) => {
        return `${parseInt(id) + shift} 0 R`
      })
    })

    const allObjs = [...fixedObjs, ...rebuiltPageObjs]

    // Build PDF body
    let body = '%PDF-1.4\n'
    const offsets: number[] = []

    allObjs.forEach((content, i) => {
      offsets.push(body.length)
      body += `${i + 1} 0 obj\n${content}\nendobj\n`
    })

    // xref table
    const xrefOffset = body.length
    body += `xref\n0 ${allObjs.length + 1}\n`
    body += `0000000000 65535 f \n`
    offsets.forEach(off => {
      body += `${String(off).padStart(10, '0')} 00000 n \n`
    })

    body += `trailer\n<< /Size ${allObjs.length + 1} /Root 1 0 R >>\n`
    body += `startxref\n${xrefOffset}\n%%EOF`

    return Buffer.from(body, 'latin1')
  }
}

// ─── Main report generator ────────────────────────────────────────────────────

export function generateReportPdf(data: ReportData): Promise<Buffer> {
  return new Promise((resolve) => {
    const pdf = new PdfBuilder()
    const ML = pdf.ML
    const CW = pdf.CW

    // Colors
    const PURPLE: [number, number, number] = [79, 70, 229]
    const GREEN: [number, number, number] = [16, 185, 129]
    const RED: [number, number, number] = [239, 68, 68]
    const GRAY: [number, number, number] = [107, 114, 128]
    const LIGHT: [number, number, number] = [248, 250, 252]
    const WHITE: [number, number, number] = [255, 255, 255]
    const DARK: [number, number, number] = [30, 30, 30]
    const AMBER: [number, number, number] = [245, 158, 11]

    // ── PAGE 1 ──────────────────────────────────────────────────────────────
    pdf.newPage()

    // Header bar
    pdf.setFill(...PURPLE)
    pdf.rect(0, 0, pdf.W, 70)

    pdf.text('KasAI', ML, 14, { size: 20, bold: true, color: WHITE })
    pdf.text('Laporan Keuangan', ML, 36, { size: 11, color: WHITE })
    pdf.text(
      `${data.businessName}  |  ${data.period}`,
      ML, 50, { size: 9, color: WHITE }
    )
    pdf.text(
      `Dibuat: ${data.generatedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      ML + CW, 50, { size: 9, color: WHITE, align: 'right', maxWidth: CW }
    )

    pdf.setY(85)

    // ── RINGKASAN ──────────────────────────────────────────────────────────
    pdf.text('Ringkasan Keuangan', ML, pdf.getY(), { size: 13, bold: true, color: DARK })
    pdf.advanceY(16)

    const cardW = (CW - 15) / 4
    const cards = [
      { label: 'Total Pemasukan', value: rp(data.summary.totalIncome), color: GREEN },
      { label: 'Total Pengeluaran', value: rp(data.summary.totalExpense), color: RED },
      {
        label: data.summary.netProfit >= 0 ? 'Laba Bersih' : 'Kerugian',
        value: rp(Math.abs(data.summary.netProfit)),
        color: data.summary.netProfit >= 0 ? PURPLE : RED,
      },
      { label: 'Total Transaksi', value: String(data.summary.txCount), color: GRAY },
    ]

    const cardY = pdf.getY()
    cards.forEach((card, i) => {
      const cx = ML + i * (cardW + 5)
      pdf.setFill(...LIGHT)
      pdf.rect(cx, cardY, cardW, 44)
      pdf.setFill(...card.color)
      pdf.rect(cx, cardY, cardW, 3)
      pdf.text(card.label, cx + 5, cardY + 8, { size: 7, color: GRAY, maxWidth: cardW - 10 })
      pdf.text(card.value, cx + 5, cardY + 22, { size: 9, bold: true, color: card.color, maxWidth: cardW - 10 })
    })
    pdf.advanceY(58)

    // ── KATEGORI ───────────────────────────────────────────────────────────
    if (data.byCategory.length > 0) {
      pdf.checkPage(20 + data.byCategory.length * 16 + 10)

      pdf.text('Pengeluaran per Kategori', ML, pdf.getY(), { size: 12, bold: true, color: DARK })
      pdf.advanceY(14)

      // Table header
      const hy = pdf.getY()
      pdf.setFill(...PURPLE)
      pdf.rect(ML, hy, CW, 16)
      pdf.text('Kategori', ML + 5, hy + 3, { size: 8, bold: true, color: WHITE })
      pdf.text('Jumlah', ML + CW * 0.6, hy + 3, { size: 8, bold: true, color: WHITE })
      pdf.text('% Total', ML + CW * 0.82, hy + 3, { size: 8, bold: true, color: WHITE })
      pdf.advanceY(16)

      data.byCategory.forEach((cat, i) => {
        pdf.checkPage(16)
        const ry = pdf.getY()
        pdf.setFill(...(i % 2 === 0 ? WHITE : LIGHT))
        pdf.rect(ML, ry, CW, 15)
        pdf.text(pdf.truncate(cat.category, CW * 0.55, 8), ML + 5, ry + 3, { size: 8, color: DARK })
        pdf.text(rp(cat.amount), ML + CW * 0.6, ry + 3, { size: 8, color: DARK })
        pdf.text(`${cat.percentage}%`, ML + CW * 0.82, ry + 3, { size: 8, color: DARK })
        pdf.advanceY(15)
      })
      pdf.advanceY(12)
    }

    // ── BUDGET ─────────────────────────────────────────────────────────────
    if (data.budgetStatus.length > 0) {
      pdf.checkPage(20 + data.budgetStatus.length * 16 + 10)

      pdf.text('Status Budget', ML, pdf.getY(), { size: 12, bold: true, color: DARK })
      pdf.advanceY(14)

      const colW = CW / 5
      const bhy = pdf.getY()
      pdf.setFill(...PURPLE)
      pdf.rect(ML, bhy, CW, 16)
      const headers = ['Kategori', 'Budget', 'Terpakai', 'Sisa', 'Status']
      headers.forEach((h, i) => {
        pdf.text(h, ML + i * colW + 4, bhy + 3, { size: 7.5, bold: true, color: WHITE })
      })
      pdf.advanceY(16)

      data.budgetStatus.forEach((b, i) => {
        pdf.checkPage(16)
        const ry = pdf.getY()
        pdf.setFill(...(i % 2 === 0 ? WHITE : LIGHT))
        pdf.rect(ML, ry, CW, 15)
        const statusColor: [number, number, number] = b.status === 'MELEBIHI' ? RED : b.status === 'HAMPIR HABIS' ? AMBER : GREEN
        const sisa = Math.max(0, b.budget - b.spent)
        pdf.text(pdf.truncate(b.category, colW - 8, 7.5), ML + 4, ry + 3, { size: 7.5, color: DARK })
        pdf.text(rp(b.budget), ML + colW + 4, ry + 3, { size: 7.5, color: DARK })
        pdf.text(rp(b.spent), ML + colW * 2 + 4, ry + 3, { size: 7.5, color: DARK })
        pdf.text(rp(sisa), ML + colW * 3 + 4, ry + 3, { size: 7.5, color: DARK })
        pdf.text(b.status, ML + colW * 4 + 4, ry + 3, { size: 7.5, bold: true, color: statusColor })
        pdf.advanceY(15)
      })
      pdf.advanceY(12)
    }

    // ── GOALS ──────────────────────────────────────────────────────────────
    const activeGoals = data.goals.filter(g => !g.completed)
    if (activeGoals.length > 0) {
      pdf.checkPage(20 + activeGoals.length * 34 + 10)

      pdf.text('Target Keuangan', ML, pdf.getY(), { size: 12, bold: true, color: DARK })
      pdf.advanceY(14)

      activeGoals.forEach((g, i) => {
        pdf.checkPage(34)
        const gy = pdf.getY()
        pdf.setFill(...(i % 2 === 0 ? WHITE : LIGHT))
        pdf.rect(ML, gy, CW, 30)

        pdf.text(pdf.truncate(g.title, CW * 0.5, 9), ML + 5, gy + 4, { size: 9, bold: true, color: DARK })
        pdf.text(`${rp(g.current)} / ${rp(g.target)}`, ML + 5, gy + 17, { size: 7.5, color: GRAY })

        // Progress bar
        const barX = ML + CW * 0.52
        const barW = CW * 0.35
        const barY = gy + 10
        pdf.setFill(229, 231, 235)
        pdf.rect(barX, barY, barW, 8)
        pdf.setFill(...PURPLE)
        pdf.rect(barX, barY, barW * Math.min(g.percentage / 100, 1), 8)
        pdf.text(`${g.percentage}%`, barX + barW + 6, barY + 1, { size: 8, bold: true, color: DARK })

        if (g.deadline) {
          pdf.text(`Deadline: ${g.deadline}`, ML + CW * 0.52, gy + 20, { size: 7, color: GRAY })
        }
        pdf.advanceY(34)
      })
      pdf.advanceY(10)
    }

    // ── TRANSAKSI ──────────────────────────────────────────────────────────
    if (data.transactions.length > 0) {
      pdf.checkPage(30)

      pdf.text('Daftar Transaksi', ML, pdf.getY(), { size: 12, bold: true, color: DARK })
      pdf.advanceY(14)

      // Header
      const thy = pdf.getY()
      pdf.setFill(...PURPLE)
      pdf.rect(ML, thy, CW, 16)
      pdf.text('Tanggal', ML + 4, thy + 3, { size: 7.5, bold: true, color: WHITE })
      pdf.text('Deskripsi', ML + 70, thy + 3, { size: 7.5, bold: true, color: WHITE })
      pdf.text('Tipe', ML + CW * 0.68, thy + 3, { size: 7.5, bold: true, color: WHITE })
      pdf.text('Jumlah', ML + CW * 0.82, thy + 3, { size: 7.5, bold: true, color: WHITE })
      pdf.advanceY(16)

      const maxRows = 60
      data.transactions.slice(0, maxRows).forEach((t, i) => {
        pdf.checkPage(14)
        const ry = pdf.getY()
        pdf.setFill(...(i % 2 === 0 ? WHITE : LIGHT))
        pdf.rect(ML, ry, CW, 13)

        const amtColor: [number, number, number] = t.type === 'income' ? GREEN : RED
        const sign = t.type === 'income' ? '+' : '-'
        const typeLabel = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'

        pdf.text(t.date, ML + 4, ry + 2, { size: 7, color: DARK })
        pdf.text(pdf.truncate(t.description, CW * 0.55, 7), ML + 70, ry + 2, { size: 7, color: DARK })
        pdf.text(typeLabel, ML + CW * 0.68, ry + 2, { size: 7, color: amtColor })
        pdf.text(`${sign}${rp(t.amount)}`, ML + CW * 0.82, ry + 2, { size: 7, bold: true, color: amtColor })
        pdf.advanceY(13)
      })

      if (data.transactions.length > maxRows) {
        pdf.advanceY(6)
        pdf.text(
          `... dan ${data.transactions.length - maxRows} transaksi lainnya. Lihat di aplikasi KasAI.`,
          ML, pdf.getY(), { size: 8, color: GRAY }
        )
      }
    }

    resolve(pdf.build())
  })
}
