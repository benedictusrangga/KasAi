/**
 * Utilitas normalisasi kategori transaksi.
 *
 * Budget disimpan dengan key slug (dining, groceries, dll).
 * categoryName di transaksi bisa berupa slug ATAU label Indonesia.
 * Fungsi ini menormalisasi keduanya ke slug agar lookup budget selalu match.
 */

export const CATEGORY_SLUG_TO_LABEL: Record<string, string> = {
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

// Reverse map: label → slug (case-insensitive)
const LABEL_TO_SLUG: Record<string, string> = {
  'bahan makanan': 'groceries',
  'groceries': 'groceries',
  'transportasi': 'transportation',
  'transportation': 'transportation',
  'utilitas': 'utilities',
  'utilities': 'utilities',
  'hiburan': 'entertainment',
  'entertainment': 'entertainment',
  'makan & minum': 'dining',
  'makan minum': 'dining',
  'makan': 'dining',
  'dining': 'dining',
  'belanja': 'shopping',
  'shopping': 'shopping',
  'kesehatan': 'healthcare',
  'healthcare': 'healthcare',
  'pendidikan': 'education',
  'education': 'education',
  'perlengkapan kantor': 'office_supplies',
  'office supplies': 'office_supplies',
  'office_supplies': 'office_supplies',
  'lainnya': 'other',
  'other': 'other',
}

/**
 * Normalisasi category key ke slug.
 * Input bisa berupa categoryId (nanoid), categoryName (label atau slug), atau null.
 * Output selalu slug jika dikenal, atau lowercase original jika tidak.
 *
 * Contoh:
 *   normalizeCategorySlug('Makan & Minum') → 'dining'
 *   normalizeCategorySlug('dining')        → 'dining'
 *   normalizeCategorySlug('Bahan Makanan') → 'groceries'
 *   normalizeCategorySlug('custom-cat')    → 'custom-cat'
 *   normalizeCategorySlug(null)            → 'other'
 */
export function normalizeCategorySlug(raw: string | null | undefined): string {
  if (!raw) return 'other'
  const lower = raw.toLowerCase().trim()
  return LABEL_TO_SLUG[lower] ?? lower
}

/**
 * Hitung spending per kategori dari daftar transaksi bulan ini.
 * Key yang dihasilkan selalu slug (normalized).
 */
export function buildSpendingByCategory(
  expenses: Array<{ categoryName: string | null; categoryId: string | null; amount: string }>
): Record<string, number> {
  const result: Record<string, number> = {}
  for (const t of expenses) {
    // Prioritaskan categoryName (human-readable) karena itulah yang user set.
    // categoryId hanya fallback jika categoryName tidak ada.
    const key = normalizeCategorySlug(t.categoryName || t.categoryId)
    result[key] = (result[key] || 0) + parseFloat(t.amount)
  }
  return result
}
