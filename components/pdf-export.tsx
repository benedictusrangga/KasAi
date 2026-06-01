'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  businessId: string
  businessName: string
}

export function PdfExport({ businessId, businessName }: Props) {
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState<'month' | 'week' | 'all'>('month')

  const handleExport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/report/pdf?businessId=${businessId}&period=${period}&format=json`)
      const data = await res.json()

      // Dynamic import jsPDF (client-side only)
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()

      // Header
      doc.setFillColor(79, 70, 229) // primary color
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
      doc.text(`Dibuat: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageW - 15, 30, { align: 'right' })

      let y = 45

      // Summary cards
      doc.setTextColor(30, 30, 30)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Ringkasan Keuangan', 15, y)
      y += 8

      const cards = [
        { label: 'Total Pemasukan', value: `Rp ${data.summary.totalIncome.toLocaleString('id-ID')}`, color: [16, 185, 129] as [number, number, number] },
        { label: 'Total Pengeluaran', value: `Rp ${data.summary.totalExpense.toLocaleString('id-ID')}`, color: [239, 68, 68] as [number, number, number] },
        { label: data.summary.netProfit >= 0 ? 'Laba Bersih' : 'Kerugian', value: `Rp ${Math.abs(data.summary.netProfit).toLocaleString('id-ID')}`, color: data.summary.netProfit >= 0 ? [79, 70, 229] as [number, number, number] : [239, 68, 68] as [number, number, number] },
        { label: 'Total Transaksi', value: `${data.summary.txCount}`, color: [107, 114, 128] as [number, number, number] },
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
        doc.text('Status Budget Bulan Ini', 15, y)
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
          columnStyles: { 4: { fontStyle: 'bold' } },
          didParseCell: (data: any) => {
            if (data.column.index === 4 && data.section === 'body') {
              const val = data.cell.raw as string
              if (val === 'MELEBIHI') data.cell.styles.textColor = [239, 68, 68]
              else if (val === 'HAMPIR HABIS') data.cell.styles.textColor = [245, 158, 11]
              else data.cell.styles.textColor = [16, 185, 129]
            }
          },
          margin: { left: 15, right: 15 },
        })
        y = (doc as any).lastAutoTable.finalY + 10
      }

      // Goals
      if (data.goals && data.goals.filter((g: any) => !g.completed).length > 0) {
        doc.setTextColor(30, 30, 30)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Target Keuangan', 15, y)
        y += 6

        autoTable(doc, {
          startY: y,
          head: [['Target', 'Target Jumlah', 'Tercapai', 'Progress', 'Deadline']],
          body: data.goals.filter((g: any) => !g.completed).map((g: any) => [
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

      // Transactions table
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
          didParseCell: (data: any) => {
            if (data.column.index === 4 && data.section === 'body') {
              const val = data.cell.raw as string
              data.cell.styles.textColor = val.startsWith('+') ? [16, 185, 129] : [239, 68, 68]
              data.cell.styles.fontStyle = 'bold'
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
        doc.text(`KasAI · Laporan Keuangan · Halaman ${i} dari ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' })
      }

      const filename = `KasAI_${businessName.replace(/\s+/g, '_')}_${period}_${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(filename)
    } catch (err) {
      console.error('PDF export error:', err)
      alert('Gagal membuat PDF. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={period}
        onChange={(e) => setPeriod(e.target.value as any)}
        className="h-9 px-3 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="week">Minggu Ini</option>
        <option value="month">Bulan Ini</option>
        <option value="all">Semua Waktu</option>
      </select>
      <Button onClick={handleExport} disabled={loading} variant="outline" size="sm" className="gap-2">
        {loading ? '⏳ Membuat PDF...' : '📄 Export PDF'}
      </Button>
    </div>
  )
}
