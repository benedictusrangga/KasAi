/**
 * KasAI — Plan definitions & enforcement helpers
 * Angka bisa diubah di sini tanpa menyentuh kode lain.
 */

export const PLANS = {
  // ── FREE ──────────────────────────────────────────────────────────────────
  free: {
    id: 'free',
    name: 'Free',
    badge: null,
    category: 'free' as const,
    price: 0,
    priceLabel: 'Gratis',
    period: '',
    desc: 'Untuk mencoba KasAI',
    maxBusinesses: 1,
    maxTxPerMonth: 50,
    maxAiChatsPerMonth: 20,
    pdfExport: false,
    scanReceipt: true,
    telegramBot: true,
    multiUser: false,
    maxMembers: 0,
    features: [
      '1 bisnis / workspace',
      '50 transaksi per bulan',
      '20 AI chat per bulan',
      'Telegram bot',
      'Scan struk (OCR)',
      'Laporan dasar',
    ],
    highlight: false,
    cta: 'Mulai Gratis',
  },

  // ── PERSONAL ──────────────────────────────────────────────────────────────
  personal_starter: {
    id: 'personal_starter',
    name: 'Personal Starter',
    badge: null,
    category: 'personal' as const,
    price: 29000,
    priceLabel: 'Rp 29.000',
    period: '/bulan',
    desc: 'Untuk keuangan pribadi aktif',
    maxBusinesses: 1,
    maxTxPerMonth: 200,
    maxAiChatsPerMonth: 100,
    pdfExport: true,
    scanReceipt: true,
    telegramBot: true,
    multiUser: false,
    maxMembers: 0,
    features: [
      '1 bisnis / workspace',
      '200 transaksi per bulan',
      '100 AI chat per bulan',
      'Export PDF laporan',
      'Telegram bot',
      'Scan struk (OCR)',
      'Goals & Budget',
    ],
    highlight: false,
    cta: 'Pilih Starter',
  },

  personal_pro: {
    id: 'personal_pro',
    name: 'Personal Pro',
    badge: 'Populer',
    category: 'personal' as const,
    price: 49000,
    priceLabel: 'Rp 49.000',
    period: '/bulan',
    desc: 'Untuk pengguna aktif sehari-hari',
    maxBusinesses: 1,
    maxTxPerMonth: 500,
    maxAiChatsPerMonth: 300,
    pdfExport: true,
    scanReceipt: true,
    telegramBot: true,
    multiUser: false,
    maxMembers: 0,
    features: [
      '1 bisnis / workspace',
      '500 transaksi per bulan',
      '300 AI chat per bulan',
      'Export PDF laporan',
      'Telegram bot prioritas',
      'Scan struk (OCR)',
      'Goals & Budget',
      'Laporan lengkap',
    ],
    highlight: false,
    cta: 'Pilih Pro',
  },

  personal_max: {
    id: 'personal_max',
    name: 'Personal Max',
    badge: null,
    category: 'personal' as const,
    price: 79000,
    priceLabel: 'Rp 79.000',
    period: '/bulan',
    desc: 'Untuk freelancer & profesional',
    maxBusinesses: 1,
    maxTxPerMonth: 1000,
    maxAiChatsPerMonth: 1000,
    pdfExport: true,
    scanReceipt: true,
    telegramBot: true,
    multiUser: false,
    maxMembers: 0,
    features: [
      '1 bisnis / workspace',
      '1.000 transaksi per bulan',
      '1.000 AI chat per bulan',
      'Export PDF laporan',
      'Telegram bot prioritas',
      'Scan struk (OCR)',
      'Goals & Budget',
      'Laporan lengkap & analitik',
    ],
    highlight: false,
    cta: 'Pilih Max',
  },

  personal_unlimited: {
    id: 'personal_unlimited',
    name: 'Personal Unlimited',
    badge: 'Best Value',
    category: 'personal' as const,
    price: 129000,
    priceLabel: 'Rp 129.000',
    period: '/bulan',
    desc: 'Tanpa batas untuk personal',
    maxBusinesses: 1,
    maxTxPerMonth: Infinity,
    maxAiChatsPerMonth: Infinity,
    pdfExport: true,
    scanReceipt: true,
    telegramBot: true,
    multiUser: false,
    maxMembers: 0,
    features: [
      '1 bisnis / workspace',
      'Transaksi tak terbatas',
      'AI chat tak terbatas',
      'Export PDF laporan',
      'Telegram bot prioritas',
      'Scan struk (OCR)',
      'Goals & Budget',
      'Semua fitur premium',
    ],
    highlight: false,
    cta: 'Pilih Unlimited',
  },

  // ── BUSINESS ──────────────────────────────────────────────────────────────
  business_starter: {
    id: 'business_starter',
    name: 'Business Starter',
    badge: null,
    category: 'business' as const,
    price: 149000,
    priceLabel: 'Rp 149.000',
    period: '/bulan',
    desc: 'Untuk UMKM yang baru berkembang',
    maxBusinesses: 3,
    maxTxPerMonth: 2000,
    maxAiChatsPerMonth: 500,
    pdfExport: true,
    scanReceipt: true,
    telegramBot: true,
    multiUser: false,
    maxMembers: 0,
    features: [
      'Hingga 3 bisnis',
      '2.000 transaksi per bulan',
      '500 AI chat per bulan',
      'Export PDF laporan',
      'Telegram bot',
      'Scan struk (OCR)',
      'Goals & Budget per bisnis',
      'Dashboard multi-bisnis',
    ],
    highlight: false,
    cta: 'Pilih Starter',
  },

  business_pro: {
    id: 'business_pro',
    name: 'Business Pro',
    badge: 'Paling Populer',
    category: 'business' as const,
    price: 249000,
    priceLabel: 'Rp 249.000',
    period: '/bulan',
    desc: 'Untuk bisnis yang sedang tumbuh',
    maxBusinesses: 10,
    maxTxPerMonth: Infinity,
    maxAiChatsPerMonth: Infinity,
    pdfExport: true,
    scanReceipt: true,
    telegramBot: true,
    multiUser: true,
    maxMembers: 3, // max 3 admin/member per bisnis
    features: [
      'Hingga 10 bisnis',
      'Transaksi tak terbatas',
      'AI chat tak terbatas',
      'Export PDF laporan',
      'Telegram bot prioritas',
      'Scan struk (OCR)',
      'Goals & Budget per bisnis',
      'Dashboard multi-bisnis',
      'Laporan konsolidasi',
      'Multi-user hingga 3 admin',
    ],
    highlight: true,
    cta: 'Pilih Pro',
  },

  business_enterprise: {
    id: 'business_enterprise',
    name: 'Business Enterprise',
    badge: null,
    category: 'business' as const,
    price: 499000,
    priceLabel: 'Rp 499.000',
    period: '/bulan',
    desc: 'Untuk jaringan bisnis besar',
    maxBusinesses: Infinity,
    maxTxPerMonth: Infinity,
    maxAiChatsPerMonth: Infinity,
    pdfExport: true,
    scanReceipt: true,
    telegramBot: true,
    multiUser: true,
    maxMembers: Infinity, // unlimited members
    features: [
      'Bisnis tak terbatas',
      'Transaksi tak terbatas',
      'AI chat tak terbatas',
      'Export PDF laporan',
      'Telegram bot prioritas',
      'Scan struk (OCR)',
      'Goals & Budget per bisnis',
      'Dashboard multi-bisnis',
      'Laporan konsolidasi',
      'Multi-user anggota tak terbatas',
      'Role: owner, admin & viewer',
      'Dedicated support',
    ],
    highlight: false,
    cta: 'Pilih Enterprise',
  },
} as const

export type PlanId = keyof typeof PLANS
export type PlanCategory = 'free' | 'personal' | 'business'

export function getPlan(planId: string | null | undefined) {
  return PLANS[(planId as PlanId) ?? 'free'] ?? PLANS.free
}

export function getPlanCategory(planId: string | null | undefined): PlanCategory {
  return getPlan(planId).category
}

export function isLimitReached(txThisMonth: number, planId: string | null | undefined): boolean {
  const plan = getPlan(planId)
  if (plan.maxTxPerMonth === Infinity) return false
  return txThisMonth >= plan.maxTxPerMonth
}

export function getUsagePercent(txThisMonth: number, planId: string | null | undefined): number {
  const plan = getPlan(planId)
  if (plan.maxTxPerMonth === Infinity) return 0
  return Math.min(Math.round((txThisMonth / plan.maxTxPerMonth) * 100), 100)
}

export function canAddBusiness(businessCount: number, planId: string | null | undefined): boolean {
  const plan = getPlan(planId)
  if (plan.maxBusinesses === Infinity) return true
  return businessCount < plan.maxBusinesses
}

export function canAddMember(currentMemberCount: number, planId: string | null | undefined): boolean {
  const plan = getPlan(planId)
  if (!plan.multiUser) return false
  if (plan.maxMembers === Infinity) return true
  return currentMemberCount < plan.maxMembers
}

export function getMaxMembers(planId: string | null | undefined): number {
  const plan = getPlan(planId)
  return plan.maxMembers
}

export function formatPrice(price: number): string {
  if (price === 0) return 'Gratis'
  return 'Rp ' + price.toLocaleString('id-ID')
}

// Grouped for pricing page
export const PLAN_GROUPS = {
  free: [PLANS.free],
  personal: [PLANS.personal_starter, PLANS.personal_pro, PLANS.personal_max, PLANS.personal_unlimited],
  business: [PLANS.business_starter, PLANS.business_pro, PLANS.business_enterprise],
}
