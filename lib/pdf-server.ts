/**
 * Server-side PDF generation menggunakan PDFKit (pure Node.js, tidak butuh DOM)
 * Digunakan oleh Telegram bot untuk kirim PDF langsung ke user
 */

import PDFDocument from 'pdfkit'

const CATEGORY_LABELS: Record<string, string> = {
  groceries: 'Bahan Makanan',
  transportation: 'Transportasi',
  utilities: 'Utilitas',
  entertainment: 'Hiburan',
  dining: 'Makan & Minum',
  shopping: 'Belanja',
  healthcare: 'Kesehatan',
  education: 'Pendidikan',
  office_supplies: 'Perlengkapan Kantor',
  other: 'Lainnya',
}

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

function rp(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

/**
 * Generate PDF laporan keuangan sebagai Buffer
 * Bisa langsung dikirim ke Telegram via sendDocument
 */
export function generateReportPdf(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Laporan Keuangan - ${data.businessName}`,
        Author: 'KasAI',
        Subject: `Laporan ${data.period}`,
      },
    })

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageW = doc.page.width - 100 // margin kiri + kanan = 100
    const PURPLE = '#4F46E5'
    const GREEN = '#10B981'
    const RED = '#EF4444'
    const GRAY = '#6B7280'
    const LIGHT_GRAY = '#F8FAFC'
    const BORDER = '#E5E7EB'

    // ── HEADER ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 80).fill(PURPLE)

    doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('KasAI', 50, 20)
    doc.fontSize(11).font('Helvetica').text('Laporan Keuangan', 50, 46)
    doc.fontSize(9).text(
      `${data.businessName}  ·  ${data.period}`,
      50,
      60
    )
    doc.text(
      `Dibuat: ${data.generatedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      doc.page.width - 50,
      60,
      { align: 'right', width: pageW }
    )

    let y = 100

    // ── RINGKASAN ────────────────────────────────────────────────────────────
    doc.fillColor('#1E1E1E').fontSize(13).font('Helvetica-Bold').text('Ringkasan Keuangan', 50, y)
    y += 18

    const cardW = (pageW - 15) / 4
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

    cards.forEach((card, i) => {
      const x = 50 + i * (cardW + 5)
      doc.rect(x, y, cardW, 48).fill(LIGHT_GRAY).stroke(BORDER)
      doc.fillColor(GRAY).fontSize(7).font('Helvetica').text(card.label, x + 6, y + 8, { width: cardW - 12 })
      doc.fillColor(card.color).fontSize(10).font('Helvetica-Bold').text(card.value, x + 6, y + 22, { width: cardW - 12 })
    })
    y += 62

    // ── PENGELUARAN PER KATEGORI ─────────────────────────────────────────────
    if (data.byCategory.length > 0) {
      doc.fillColor('#1E1E1E').fontSize(13).font('Helvetica-Bold').text('Pengeluaran per Kategori', 50, y)
      y += 18

      // Table header
      doc.rect(50, y, pageW, 18).fill(PURPLE)
      doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
      doc.text('Kategori', 56, y + 5, { width: pageW * 0.5 })
      doc.text('Jumlah', 56 + pageW * 0.5, y + 5, { width: pageW * 0.25, align: 'right' })
      doc.text('% Total', 56 + pageW * 0.75, y + 5, { width: pageW * 0.25 - 6, align: 'right' })
      y += 18

      data.byCategory.forEach((cat, i) => {
        const rowBg = i % 2 === 0 ? 'white' : LIGHT_GRAY
        doc.rect(50, y, pageW, 16).fill(rowBg)
        doc.fillColor('#1E1E1E').fontSize(8).font('Helvetica')
        const catLabel = CATEGORY_LABELS[cat.category] || cat.category
        doc.text(catLabel, 56, y + 4, { width: pageW * 0.5 })
        doc.text(rp(cat.amount), 56 + pageW * 0.5, y + 4, { width: pageW * 0.25, align: 'right' })
        doc.text(`${cat.percentage}%`, 56 + pageW * 0.75, y + 4, { width: pageW * 0.25 - 6, align: 'right' })
        y += 16
      })
      y += 14
    }

    // ── STATUS BUDGET ────────────────────────────────────────────────────────
    if (data.budgetStatus.length > 0) {
      // Cek apakah perlu halaman baru
      if (y > doc.page.height - 150) { doc.addPage(); y = 50 }

      doc.fillColor('#1E1E1E').fontSize(13).font('Helvetica-Bold').text('Status Budget Bulan Ini', 50, y)
      y += 18

      doc.rect(50, y, pageW, 18).fill(PURPLE)
      doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
      const colW = pageW / 5
      doc.text('Kategori', 56, y + 5, { width: colW })
      doc.text('Budget', 56 + colW, y + 5, { width: colW, align: 'right' })
      doc.text('Terpakai', 56 + colW * 2, y + 5, { width: colW, align: 'right' })
      doc.text('Sisa', 56 + colW * 3, y + 5, { width: colW, align: 'right' })
      doc.text('Status', 56 + colW * 4, y + 5, { width: colW - 6, align: 'right' })
      y += 18

      data.budgetStatus.forEach((b, i) => {
        const rowBg = i % 2 === 0 ? 'white' : LIGHT_GRAY
        doc.rect(50, y, pageW, 16).fill(rowBg)
        const statusColor = b.status === 'MELEBIHI' ? RED : b.status === 'HAMPIR HABIS' ? '#F59E0B' : GREEN
        const catLabel = CATEGORY_LABELS[b.category] || b.category
        const sisa = Math.max(0, b.budget - b.spent)
        doc.fillColor('#1E1E1E').fontSize(8).font('Helvetica')
        doc.text(catLabel, 56, y + 4, { width: colW })
        doc.text(rp(b.budget), 56 + colW, y + 4, { width: colW, align: 'right' })
        doc.text(rp(b.spent), 56 + colW * 2, y + 4, { width: colW, align: 'right' })
        doc.text(rp(sisa), 56 + colW * 3, y + 4, { width: colW, align: 'right' })
        doc.fillColor(statusColor).font('Helvetica-Bold')
        doc.text(b.status, 56 + colW * 4, y + 4, { width: colW - 6, align: 'right' })
        y += 16
      })
      y += 14
    }

    // ── TARGET KEUANGAN ──────────────────────────────────────────────────────
    const activeGoals = data.goals.filter((g) => !g.completed)
    if (activeGoals.length > 0) {
      if (y > doc.page.height - 150) { doc.addPage(); y = 50 }

      doc.fillColor('#1E1E1E').fontSize(13).font('Helvetica-Bold').text('Target Keuangan', 50, y)
      y += 18

      activeGoals.forEach((g, i) => {
        if (y > doc.page.height - 80) { doc.addPage(); y = 50 }
        const rowBg = i % 2 === 0 ? 'white' : LIGHT_GRAY
        doc.rect(50, y, pageW, 32).fill(rowBg)

        doc.fillColor('#1E1E1E').fontSize(9).font('Helvetica-Bold').text(g.title, 56, y + 4, { width: pageW * 0.5 })
        doc.fillColor(GRAY).fontSize(7.5).font('Helvetica')
        doc.text(`${rp(g.current)} / ${rp(g.target)}`, 56, y + 18, { width: pageW * 0.5 })

        // Progress bar
        const barX = 56 + pageW * 0.5
        const barW = pageW * 0.35
        doc.rect(barX, y + 10, barW, 8).fill('#E5E7EB')
        doc.rect(barX, y + 10, barW * Math.min(g.percentage / 100, 1), 8).fill(PURPLE)
        doc.fillColor('#1E1E1E').fontSize(8).font('Helvetica-Bold')
        doc.text(`${g.percentage}%`, barX + barW + 6, y + 10, { width: 30 })

        if (g.deadline) {
          doc.fillColor(GRAY).fontSize(7).font('Helvetica')
          doc.text(`Deadline: ${g.deadline}`, 56 + pageW * 0.5, y + 22, { width: pageW * 0.5 })
        }
        y += 36
      })
      y += 10
    }

    // ── DAFTAR TRANSAKSI ─────────────────────────────────────────────────────
    if (data.transactions.length > 0) {
      if (y > doc.page.height - 100) { doc.addPage(); y = 50 }

      doc.fillColor('#1E1E1E').fontSize(13).font('Helvetica-Bold').text('Daftar Transaksi', 50, y)
      y += 18

      // Header
      doc.rect(50, y, pageW, 18).fill(PURPLE)
      doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
      doc.text('Tanggal', 56, y + 5, { width: 55 })
      doc.text('Deskripsi', 116, y + 5, { width: pageW - 175 })
      doc.text('Tipe', 116 + pageW - 175, y + 5, { width: 55, align: 'center' })
      doc.text('Jumlah', 116 + pageW - 120, y + 5, { width: 114, align: 'right' })
      y += 18

      const maxRows = 50
      data.transactions.slice(0, maxRows).forEach((t, i) => {
        if (y > doc.page.height - 40) { doc.addPage(); y = 50 }
        const rowBg = i % 2 === 0 ? 'white' : LIGHT_GRAY
        doc.rect(50, y, pageW, 15).fill(rowBg)
        const amtColor = t.type === 'income' ? GREEN : RED
        const typeLabel = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'
        const sign = t.type === 'income' ? '+' : '-'

        doc.fillColor('#1E1E1E').fontSize(7.5).font('Helvetica')
        doc.text(t.date, 56, y + 4, { width: 55 })
        doc.text(t.description, 116, y + 4, { width: pageW - 175, ellipsis: true })
        doc.fillColor(amtColor).text(typeLabel, 116 + pageW - 175, y + 4, { width: 55, align: 'center' })
        doc.font('Helvetica-Bold').text(`${sign}${rp(t.amount)}`, 116 + pageW - 120, y + 4, { width: 114, align: 'right' })
        y += 15
      })

      if (data.transactions.length > maxRows) {
        y += 6
        doc.fillColor(GRAY).fontSize(8).font('Helvetica')
          .text(`... dan ${data.transactions.length - maxRows} transaksi lainnya. Lihat laporan lengkap di aplikasi KasAI.`, 50, y)
        y += 14
      }
    }

    // ── FOOTER setiap halaman ────────────────────────────────────────────────
    const totalPages = doc.bufferedPageRange().count + 1
    for (let i = 0; i < doc.bufferedPageRange().count; i++) {
      doc.switchToPage(i)
      doc.fillColor(GRAY).fontSize(7).font('Helvetica')
        .text(
          `KasAI · Laporan Keuangan · Halaman ${i + 1}`,
          50,
          doc.page.height - 30,
          { align: 'center', width: pageW }
        )
    }

    doc.end()
  })
}
