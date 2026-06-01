'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  updateBusiness,
  updateUserProfile,
} from '@/app/actions/business'
import { PLANS, PLAN_GROUPS, getPlan, type PlanId } from '@/lib/plan-limits'

const CATEGORY_TYPES = [
  { value: 'groceries', label: 'Bahan Makanan' },
  { value: 'transportation', label: 'Transportasi' },
  { value: 'utilities', label: 'Utilitas' },
  { value: 'entertainment', label: 'Hiburan' },
  { value: 'dining', label: 'Makan & Minum' },
  { value: 'shopping', label: 'Belanja' },
  { value: 'healthcare', label: 'Kesehatan' },
  { value: 'education', label: 'Pendidikan' },
  { value: 'office_supplies', label: 'Perlengkapan Kantor' },
  { value: 'other', label: 'Lainnya' },
]

const BUSINESS_TYPES = [
  { value: 'florist', label: 'Florist' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'cafe', label: 'Cafe / Resto' },
  { value: 'retail', label: 'Toko Retail' },
  { value: 'other', label: 'Bisnis Lainnya' },
  { value: 'personal', label: 'Keuangan Personal' },
]

const TABS = [
  { id: 'profile', label: '👤 Profil & Telegram' },
  { id: 'business', label: '🏪 Info Bisnis' },
  { id: 'categories', label: '🏷️ Kategori' },
  { id: 'products', label: '📦 Produk & Layanan' },
  { id: 'plan', label: '🚀 Plan & Upgrade' },
]

type Props = {
  business: { id: string; name: string; type: string; description?: string | null }
  user: {
    name?: string | null
    phoneNumber?: string | null
    accountType?: string | null
    currency?: string | null
    timezone?: string | null
    telegramId?: string | null
    plan?: string | null
    planExpiresAt?: Date | null
  }
  categories: Array<{ id: string; name: string; type: string; description?: string | null }>
  products: Array<{ id: string; name: string; unit?: string | null; price?: string | null; description?: string | null }>
  txThisMonth?: number
}

export function SettingsPanel({ business, user, categories, products, txThisMonth = 0 }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const [profile, setProfile] = useState({
    name: user.name || '',
    phoneNumber: user.phoneNumber || '',
    accountType: (user.accountType === 'business' ? 'business' : 'personal') as 'personal' | 'business',
    currency: user.currency || 'IDR',
    timezone: user.timezone || 'Asia/Jakarta',
    telegramId: user.telegramId || '',
  })

  const [bizInfo, setBizInfo] = useState({
    name: business.name,
    type: business.type as 'florist' | 'laundry' | 'cafe' | 'retail' | 'other',
    description: business.description || '',
  })

  const [categoryList, setCategoryList] = useState(categories)
  const [newCat, setNewCat] = useState({ name: '', type: 'other', description: '' })

  const [productList, setProductList] = useState(products)
  const [newProd, setNewProd] = useState({ name: '', unit: 'pcs', price: '', description: '' })

  const showStatus = (type: 'success' | 'error', msg: string) => {
    setStatus({ type, msg })
    setTimeout(() => setStatus(null), 3000)
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      await updateUserProfile(profile)
      showStatus('success', 'Profil berhasil disimpan.')
      router.refresh()
    } catch {
      showStatus('error', 'Gagal menyimpan profil.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveBusiness = async () => {
    setIsSaving(true)
    try {
      await updateBusiness(business.id, bizInfo)
      showStatus('success', 'Informasi bisnis diperbarui.')
      router.refresh()
    } catch {
      showStatus('error', 'Gagal memperbarui bisnis.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCat.name.trim()) { showStatus('error', 'Nama kategori diperlukan.'); return }
    setIsSaving(true)
    try {
      const created = await createCategory(business.id, newCat.name, newCat.type, newCat.description)
      setCategoryList([...categoryList, { id: created.id, name: created.name, type: created.type, description: newCat.description }])
      setNewCat({ name: '', type: 'other', description: '' })
      showStatus('success', 'Kategori ditambahkan.')
    } catch {
      showStatus('error', 'Gagal menambahkan kategori.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return
    setIsSaving(true)
    try {
      await deleteCategory(id)
      setCategoryList(categoryList.filter((c) => c.id !== id))
      showStatus('success', 'Kategori dihapus.')
    } catch {
      showStatus('error', 'Gagal menghapus kategori.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddProduct = async () => {
    if (!newProd.name.trim()) { showStatus('error', 'Nama produk diperlukan.'); return }
    setIsSaving(true)
    try {
      const created = await createProduct(business.id, newProd.name, newProd.unit, Number(newProd.price) || undefined, newProd.description)
      setProductList([...productList, { id: created.id, name: created.name, unit: created.unit, price: created.price?.toString() ?? '', description: created.description }])
      setNewProd({ name: '', unit: 'pcs', price: '', description: '' })
      showStatus('success', 'Produk ditambahkan.')
    } catch {
      showStatus('error', 'Gagal menambahkan produk.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return
    setIsSaving(true)
    try {
      await deleteProduct(id)
      setProductList(productList.filter((p) => p.id !== id))
      showStatus('success', 'Produk dihapus.')
    } catch {
      showStatus('error', 'Gagal menghapus produk.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      {/* Status toast */}
      {status && (
        <div className={`fixed top-4 right-4 z-50 rounded-xl border px-5 py-3 text-sm font-medium shadow-lg transition-all ${
          status.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-destructive/20 bg-destructive/10 text-destructive'
        }`}>
          {status.type === 'success' ? '✓ ' : '✕ '}{status.msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-8 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile & Telegram tab */}
      {activeTab === 'profile' && (
        <div className="max-w-xl space-y-5">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <p className="font-semibold text-foreground text-sm mb-2">Cara menghubungkan Telegram</p>
                <ol className="text-xs text-muted-foreground leading-relaxed space-y-1 list-decimal list-inside">
                  <li>Chat ke <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">@userinfobot</a> di Telegram → kirim pesan apa saja</li>
                  <li>Copy angka <strong>Your user ID</strong> dari balasannya</li>
                  <li>Paste di field <strong>Telegram ID</strong> di bawah → klik <strong>Simpan Profil</strong></li>
                  <li>Baru chat ke <a href="https://t.me/Aiaccountingsbot" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">@Aiaccountingsbot</a> — bot langsung mengenali Anda</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="h-11" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Nomor HP (untuk Telegram) *</Label>
            <Input
              id="phone"
              placeholder="+628123456789"
              value={profile.phoneNumber}
              onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Format internasional, contoh: +6281234567890
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telegram-id">Telegram ID *</Label>
            <Input
              id="telegram-id"
              placeholder="Contoh: 7123456789"
              value={profile.telegramId}
              onChange={(e) => setProfile({ ...profile, telegramId: e.target.value })}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Cara dapat ID: buka Telegram → chat ke{' '}
              <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">@userinfobot</a>
              {' '}→ kirim pesan apa saja → copy angka <strong>Your user ID</strong> → paste di sini → Simpan.
              Setelah itu baru chat ke @Aiaccountingsbot.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Mata Uang</Label>
              <Input id="currency" value={profile.currency} onChange={(e) => setProfile({ ...profile, currency: e.target.value })} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Zona Waktu</Label>
              <Input id="timezone" value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })} className="h-11" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tipe Akun</Label>
            <Select value={profile.accountType} onValueChange={(v) => setProfile({ ...profile, accountType: v as any })}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="business">Bisnis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSaveProfile} disabled={isSaving} className="h-11">
            {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
          </Button>
        </div>
      )}

      {/* Business info tab */}
      {activeTab === 'business' && (
        <div className="max-w-xl space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="biz-name">Nama Bisnis</Label>
            <Input id="biz-name" value={bizInfo.name} onChange={(e) => setBizInfo({ ...bizInfo, name: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipe Bisnis</Label>
            <div className="h-11 px-3 flex items-center rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground">
              {BUSINESS_TYPES.find((t) => t.value === bizInfo.type)?.label || bizInfo.type}
              <span className="ml-auto text-xs">🔒 Diatur oleh admin</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="biz-desc">Deskripsi</Label>
            <Textarea
              id="biz-desc"
              value={bizInfo.description}
              onChange={(e) => setBizInfo({ ...bizInfo, description: e.target.value })}
              className="min-h-[100px]"
              placeholder="Deskripsi singkat bisnis Anda..."
            />
          </div>
          <Button onClick={handleSaveBusiness} disabled={isSaving} className="h-11">
            {isSaving ? 'Menyimpan...' : 'Simpan Bisnis'}
          </Button>
        </div>
      )}

      {/* Categories tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Add new */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4">Tambah Kategori Baru</h3>
            <div className="grid sm:grid-cols-3 gap-3 mb-3">
              <div className="space-y-1.5">
                <Label>Nama Kategori</Label>
                <Input value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} placeholder="Contoh: Bahan Baku" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Jenis</Label>
                <Select value={newCat.type} onValueChange={(v) => setNewCat({ ...newCat, type: v })}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Deskripsi</Label>
                <Input value={newCat.description} onChange={(e) => setNewCat({ ...newCat, description: e.target.value })} placeholder="Opsional" className="h-10" />
              </div>
            </div>
            <Button onClick={handleAddCategory} disabled={isSaving} size="sm">
              + Tambah Kategori
            </Button>
          </div>

          {/* List */}
          {categoryList.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
              <p className="text-muted-foreground text-sm">Belum ada kategori. Tambahkan di atas.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {categoryList.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{cat.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{cat.type}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(cat.id)} className="text-destructive hover:text-destructive h-8 text-xs">
                    Hapus
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Products tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Add new */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4">Tambah Produk / Layanan</h3>
            <div className="grid sm:grid-cols-4 gap-3 mb-3">
              <div className="space-y-1.5">
                <Label>Nama Produk</Label>
                <Input value={newProd.name} onChange={(e) => setNewProd({ ...newProd, name: e.target.value })} placeholder="Contoh: Kopi Susu" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Satuan</Label>
                <Input value={newProd.unit} onChange={(e) => setNewProd({ ...newProd, unit: e.target.value })} placeholder="cup, pcs, kg" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Harga (Rp)</Label>
                <Input type="number" value={newProd.price} onChange={(e) => setNewProd({ ...newProd, price: e.target.value })} placeholder="25000" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Deskripsi</Label>
                <Input value={newProd.description} onChange={(e) => setNewProd({ ...newProd, description: e.target.value })} placeholder="Opsional" className="h-10" />
              </div>
            </div>
            <Button onClick={handleAddProduct} disabled={isSaving} size="sm">
              + Tambah Produk
            </Button>
          </div>

          {/* List */}
          {productList.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
              <p className="text-muted-foreground text-sm">Belum ada produk. Tambahkan di atas.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {productList.map((prod) => (
                <div key={prod.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{prod.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {prod.unit} · Rp {prod.price ? Number(prod.price).toLocaleString('id-ID') : '—'}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(prod.id)} className="text-destructive hover:text-destructive h-8 text-xs">
                    Hapus
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plan & Upgrade tab */}
      {activeTab === 'plan' && (() => {
        const currentPlan = getPlan(user.plan)
        const usagePct = currentPlan.maxTxPerMonth === Infinity
          ? 0
          : Math.min(Math.round((txThisMonth / currentPlan.maxTxPerMonth) * 100), 100)
        const isAtLimit = currentPlan.maxTxPerMonth !== Infinity && txThisMonth >= currentPlan.maxTxPerMonth
        const isNearLimit = usagePct >= 80 && !isAtLimit

        return (
          <div className="space-y-8 max-w-3xl">
            {/* Current plan card */}
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Plan Aktif</p>
                  <h3 className="text-2xl font-bold text-foreground">{currentPlan.name}</h3>
                  <p className="text-muted-foreground text-sm mt-0.5">{currentPlan.desc}</p>
                  {user.planExpiresAt && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⏰ Berlaku sampai {new Date(user.planExpiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{currentPlan.priceLabel}</p>
                  <p className="text-sm text-muted-foreground">{currentPlan.period}</p>
                </div>
              </div>

              {/* Usage */}
              {currentPlan.maxTxPerMonth !== Infinity && (
                <div className="mt-5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground font-medium">Penggunaan Transaksi Bulan Ini</span>
                    <span className={`font-semibold ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {txThisMonth} / {currentPlan.maxTxPerMonth} ({usagePct}%)
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isAtLimit ? 'bg-destructive' : isNearLimit ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                  {isAtLimit && (
                    <p className="text-xs text-destructive mt-2 font-medium">
                      🚫 Batas transaksi bulan ini tercapai. Upgrade untuk melanjutkan pencatatan.
                    </p>
                  )}
                  {isNearLimit && (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠️ Tersisa {currentPlan.maxTxPerMonth - txThisMonth} transaksi bulan ini.
                    </p>
                  )}
                </div>
              )}
              {currentPlan.maxTxPerMonth === Infinity && (
                <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
                  <span>✓</span>
                  <span className="font-medium">Transaksi tak terbatas — tidak ada batasan penggunaan</span>
                </div>
              )}
            </div>

            {/* Upgrade options */}
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Upgrade Plan</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Untuk upgrade, hubungi admin atau tim KasAI. Perubahan plan akan aktif segera setelah konfirmasi pembayaran.
              </p>

              {/* Personal plans */}
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Personal — 1 Bisnis</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {PLAN_GROUPS.personal.map(plan => {
                    const isCurrent = user.plan === plan.id
                    const isUpgrade = (plan.price > currentPlan.price) || (currentPlan.maxTxPerMonth !== Infinity && plan.maxTxPerMonth === Infinity)
                    return (
                      <div
                        key={plan.id}
                        className={`rounded-xl border p-4 relative ${
                          isCurrent
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-card hover:border-primary/40 transition-colors'
                        }`}
                      >
                        {isCurrent && (
                          <span className="absolute top-3 right-3 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            Aktif
                          </span>
                        )}
                        {plan.badge && !isCurrent && (
                          <span className="absolute top-3 right-3 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            {plan.badge}
                          </span>
                        )}
                        <p className="font-semibold text-foreground text-sm">{plan.name}</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">
                          {plan.priceLabel}<span className="text-xs font-normal text-muted-foreground">{plan.period}</span>
                        </p>
                        <ul className="mt-2 space-y-1">
                          {plan.features.slice(0, 4).map(f => (
                            <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <span className="text-primary">✓</span>{f}
                            </li>
                          ))}
                        </ul>
                        {!isCurrent && (
                          <a
                            href={`mailto:admin@kasai.app?subject=Upgrade Plan ke ${plan.name}&body=Halo, saya ingin upgrade ke plan ${plan.name} (${plan.priceLabel}${plan.period}).`}
                            className="mt-3 block"
                          >
                            <Button size="sm" variant={isUpgrade ? 'default' : 'outline'} className="w-full h-8 text-xs">
                              {isUpgrade ? '↑ Upgrade' : '↓ Downgrade'} ke {plan.name.replace('Personal ', '')}
                            </Button>
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Business plans */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Business — Multi-Bisnis</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {PLAN_GROUPS.business.map(plan => {
                    const isCurrent = user.plan === plan.id
                    return (
                      <div
                        key={plan.id}
                        className={`rounded-xl border p-4 relative ${
                          isCurrent
                            ? 'border-primary bg-primary/5'
                            : plan.highlight
                            ? 'border-primary/50 bg-card shadow-md'
                            : 'border-border bg-card hover:border-primary/40 transition-colors'
                        }`}
                      >
                        {isCurrent && (
                          <span className="absolute top-3 right-3 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            Aktif
                          </span>
                        )}
                        {plan.badge && !isCurrent && (
                          <span className="absolute top-3 right-3 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            {plan.badge}
                          </span>
                        )}
                        <p className="font-semibold text-foreground text-sm">{plan.name}</p>
                        <p className="text-lg font-bold text-foreground mt-0.5">
                          {plan.priceLabel}<span className="text-xs font-normal text-muted-foreground">{plan.period}</span>
                        </p>
                        <ul className="mt-2 space-y-1">
                          {plan.features.slice(0, 4).map(f => (
                            <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <span className="text-primary">✓</span>{f}
                            </li>
                          ))}
                        </ul>
                        {!isCurrent && (
                          <a
                            href={`mailto:admin@kasai.app?subject=Upgrade Plan ke ${plan.name}&body=Halo, saya ingin upgrade ke plan ${plan.name} (${plan.priceLabel}${plan.period}).`}
                            className="mt-3 block"
                          >
                            <Button size="sm" variant="default" className="w-full h-8 text-xs">
                              ↑ Upgrade ke {plan.name.replace('Business ', '')}
                            </Button>
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-muted/50 border border-border p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">💡 Cara Upgrade</p>
                <p>Klik tombol upgrade di atas untuk mengirim email ke tim KasAI, atau hubungi kami langsung. Plan akan diaktifkan dalam 1×24 jam setelah konfirmasi pembayaran.</p>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
