# KasAI — AI-Powered Accounting for UMKM & Personal Finance

Platform pencatatan keuangan berbasis AI yang dirancang khusus untuk UMKM Indonesia dan pengelolaan keuangan pribadi. Catat transaksi, kelola stok, lacak hutang-piutang, dan dapatkan insight keuangan — semua dalam satu aplikasi.

## ✨ Fitur Utama

### 🔐 Multi-User & Multi-Bisnis
- Autentikasi aman dengan Better Auth (email/password)
- Satu akun untuk kelola banyak bisnis
- **Team Management**: Undang anggota tim dengan role (Owner, Admin, Viewer)
- **Account Type**: Pembeda jelas antara Personal dan Business
- **Feature Toggle**: Aktifkan/nonaktifkan fitur sesuai kebutuhan bisnis

### 💼 Manajemen Bisnis
- Buat dan kelola multiple bisnis (Florist, Laundry, Cafe, Retail, dll)
- Onboarding wizard 3 langkah: Pilih jenis → Info bisnis → Pilih fitur
- Dashboard per bisnis dengan metrics real-time
- Konfigurasi fitur per bisnis (toggle inventaris, hutang-piutang, dll)

### 📊 Pencatatan Transaksi
- **Manual Input**: Form cepat dengan kategori otomatis & custom
- **Voice Input**: Dictation langsung dari browser
- **Telegram Bot**: Catat transaksi dari chat Telegram `/catat`, `/laporan`, `/pdf`
- **Multi-Source**: Manual, Telegram, Voice Note, Receipt Image, API
- **Custom Categories**: Input kategori bebas atau pakai kategori default

### 🤖 AI Features (Gemini 2.0 Flash)
- **Natural Language Processing**: "Beli kopi 50rb" → Auto-extract amount, category, desc
- **AI Chat Assistant**: Tanya spending insight, trend, rekomendasi
- **Smart Categorization**: Deteksi otomatis kategori transaksi
- **AI Persona**: Pilih gaya AI (Professional, Sahabat, Coach, Santai)
- **Plan Limits**: Free (20 chat/bulan), Starter (100), Growth (500), Business (Unlimited)

### 💸 Hutang & Piutang
- Catat siapa yang berhutang ke Anda (Piutang) dan sebaliknya (Hutang)
- **Partial Payment**: Bayar cicilan, track sisa otomatis
- **Jatuh Tempo**: Notifikasi overdue & segera jatuh tempo
- **Progress Bar**: Visualisasi pembayaran real-time
- Summary cards: Total piutang, total hutang, tagihan terlambat

### 📦 Inventaris Stok
- Kelola stok barang masuk/keluar/koreksi
- **Stock Alert**: Notifikasi otomatis jika stok di bawah minimum
- **Riwayat Log**: Track setiap pergerakan stok dengan timestamp
- Support SKU, unit custom, harga beli/jual, margin calculation
- Link stok dengan transaksi (auto adjust stock saat ada penjualan)

### 🎯 Goals & Target
- Set target finansial dengan deadline
- **Manual Contribution**: Tambah tabungan manual ke goal
- Auto-track dari transaksi income
- Progress bar dengan visualisasi sisa target

### 📈 Laporan Keuangan
- **Period Filter**: Per bulan (weekly breakdown), per tahun (12 bulan), atau semua
- Shortcut: "Bulan ini", "Bulan lalu", "Tahun ini"
- Export PDF dengan grafik dan table (via jsPDF)
- Real-time metrics: Income, expense, profit, balance

### 📱 Telegram Integration
- **Multi-Business**: Command `/switch` untuk ganti bisnis aktif
- `/catat` — Tambah transaksi via chat
- `/status` — Lihat saldo & summary
- `/laporan` — Kirim laporan text
- `/pdf` — Generate & kirim PDF report
- Auto-detect bisnis aktif (`activeTelegramBusinessId`)

### �️ Custom Categories
- Input kategori bebas langsung dari form
- Kategori bisnis (dari DB) + Kategori umum (default) + Custom
- Simpan `categoryName` di transaction untuk human-readable
- Voice input tetap detect kategori otomatis

### 💳 Paket & Pricing
- **Free**: 10 transaksi/bulan, 20 AI chat, 1 bisnis
- **Starter (Rp 49k/bulan)**: 100 transaksi, 100 AI chat, 3 bisnis, Telegram
- **Growth (Rp 149k/bulan)**: 1000 transaksi, 500 AI chat, Unlimited bisnis, Team (5 member)
- **Business (Rp 349k/bulan)**: Unlimited transaksi & chat, Unlimited bisnis & team, Priority support

### 🎨 Design System
- Modern glassmorphism UI dengan dark mode support
- Responsive mobile-first design
- Smooth animations dan micro-interactions
- Accessible components (WCAG compliant)

---

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library with Server Components
- **TypeScript** - Type safety end-to-end
- **Tailwind CSS v4** - Utility-first CSS
- **shadcn/ui** - Radix UI components

### Backend & Database
- **Neon PostgreSQL** - Serverless Postgres
- **Drizzle ORM** - Type-safe database queries & relations
- **Better Auth** - Modern auth with sessions

### AI & External Services
- **Google Gemini 2.0 Flash** - Free tier for AI features
  - Natural language extraction
  - Smart categorization
  - Chat intelligence
- **Telegram Bot API** - Multi-business bot integration
- **jsPDF** - PDF report generation

### Infrastructure
- **Vercel** - Deployment, Edge Functions, Analytics
- **Vercel Blob** - File storage (receipt images)
- **Environment Variables** - Secure config management

## 📁 Project Structure

```
app/
├── api/
│   ├── auth/[...all]/route.ts         # Better Auth handler
│   ├── admin/                         # Admin endpoints (create user, list users)
│   ├── onboarding/status/route.ts     # Onboarding progress check
│   ├── report/pdf/route.ts            # PDF generation endpoint
│   └── telegram/route.ts              # Telegram webhook
├── actions/
│   ├── business.ts                    # Business CRUD, members
│   ├── transaction.ts                 # Transaction CRUD with categoryName
│   ├── ai-chat.ts                     # AI chat with plan limits
│   ├── telegram.ts                    # Telegram bot (/switch, /catat, /status, /pdf)
│   ├── payables.ts                    # Hutang & piutang management
│   ├── inventory.ts                   # Inventaris management
│   ├── goals.ts                       # Goals with manual contribution
│   ├── features.ts                    # Feature config per bisnis
│   ├── members.ts                     # Team member management
│   └── onboarding.ts                  # Onboarding wizard
├── dashboard/
│   ├── page.tsx                       # List semua bisnis
│   ├── layout.tsx                     # Sidebar with dynamic nav
│   └── [businessId]/
│       ├── page.tsx                   # Dashboard overview
│       ├── add-expense/page.tsx       # Add transaction with voice & custom category
│       ├── transactions/page.tsx      # Transaction list with filters & comments
│       ├── ai-chat/page.tsx           # AI assistant chat
│       ├── goals/page.tsx             # Goals with manual contribution
│       ├── payables/page.tsx          # Hutang & Piutang split view
│       ├── inventory/page.tsx         # Inventaris with stock log
│       ├── reports/page.tsx           # Reports with period filter
│       └── settings/page.tsx          # Settings with feature toggle
├── onboarding/
│   ├── account-type/page.tsx          # Step 1: Personal vs Business
│   ├── business-setup/page.tsx        # Step 2: Business info + feature selection
│   └── personal-setup/page.tsx        # Step 2 (personal): Quick setup
├── invite/[token]/page.tsx            # Team member invite acceptance
├── admin/page.tsx                     # Admin panel (user management)
├── setup/page.tsx                     # Legacy setup redirect
├── sign-in/page.tsx                   # Sign in page
├── sign-up/page.tsx                   # Sign up page
└── page.tsx                           # Landing page

components/
├── landing/                           # Landing page sections (hero, features, pricing, etc.)
├── add-expense-form.tsx               # Voice + custom category form
├── ai-chat.tsx                        # AI chat with plan limit display
├── goals-panel.tsx                    # Goals with contribution modal
├── payables-panel.tsx                 # Hutang/piutang with tabs & payment modal
├── inventory-panel.tsx                # Inventaris with stock adjust modal
├── report-period-filter.tsx           # Period filter (month/year/all)
├── settings-panel.tsx                 # Settings with feature config tab
├── dashboard-metrics.tsx              # Dashboard cards & charts
└── ui/                                # shadcn/ui components

lib/
├── auth.ts                            # Better Auth config
├── auth-client.ts                     # Better Auth client hooks
├── gemini.ts                          # Gemini AI utilities
├── pdf-server.ts                      # jsPDF report generation
├── plan-limits.ts                     # Plan limits constants & check functions
└── db/
    ├── index.ts                       # Drizzle client
    └── schema.ts                      # Full schema (18 tables)

scripts/
├── migrate_multiuser.sql              # Multi-user migration (team, comments)
├── migrate_new_features.sql           # New features migration (payables, inventory, feature config)
└── reset_and_migrate.sql              # Full reset + fresh migration
```

## 🗄 Database Schema

### Auth Tables (Better Auth)
- **user** - User accounts (+ activeTelegramBusinessId, accountType, plan, aiPersona)
- **session** - Active sessions
- **account** - OAuth accounts & password
- **verification** - Email verification tokens

### Business & Team
- **business** - Business info (name, type, description, logo)
- **business_member** - Team members (role: owner/admin/viewer, status: pending/active/removed)
- **user_feature_config** - Feature toggle per bisnis (enableInventory, enablePayables, etc)

### Transactions & Categories
- **category** - Custom categories per bisnis
- **transaction** - Transaksi dengan categoryName, source, receipt_url
- **transaction_comment** - Komentar per transaksi (team collaboration)

### Financial Tracking
- **payable** - Hutang (kita berhutang ke orang lain)
- **receivable** - Piutang (orang lain berhutang ke kita)
- **goal** - Target finansial dengan manual contribution
- **budget** - Budget per kategori

### Inventory
- **inventory_item** - Barang (SKU, unit, currentStock, minStock, buyPrice, sellPrice)
- **inventory_log** - Riwayat pergerakan stok (in/out/adjustment)

### Reporting & AI
- **report** - Generated reports (PDF, JSON data)
- **ai_chat** - Chat conversation history
- **business_products** - Produk/jasa bisnis (opsional)
- **onboarding_progress** - Onboarding wizard progress

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (recommend 20.x)
- **pnpm** (or npm/yarn)
- **Neon PostgreSQL** database
- **Google Gemini API** key (free tier)
- **Telegram Bot Token** (optional, for bot integration)

### Installation

1. **Clone repository:**
```bash
git clone <repository-url>
cd ai-accounting-mvp
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Set up environment variables:**
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Auth (generate: openssl rand -base64 32)
BETTER_AUTH_SECRET=your_32_char_secret
BETTER_AUTH_URL=http://localhost:3000

# AI
GEMINI_API_KEY=your_gemini_api_key

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_SECRET=random_secret_for_webhook_validation

# Admin (optional)
ADMIN_SECRET=admin_secret_for_create_user
```

4. **Run migration:**
```bash
# Connect to your Neon database
psql $DATABASE_URL -f scripts/migrate_new_features.sql
```

5. **Start development server:**
```bash
pnpm dev
```

Visit **http://localhost:3000** 🎉

---

## 📖 Usage Guide

### 1. Sign Up & Onboarding
1. Buat akun dengan email/password
2. Pilih tipe akun: **Personal** atau **Business**
3. Isi info bisnis (nama, jenis usaha)
4. Pilih fitur yang dibutuhkan (Inventaris, Hutang-Piutang, dll)
5. Selesai! Dashboard siap digunakan

### 2. Catat Transaksi
**Manual:**
- Klik "Tambah Transaksi"
- Isi amount, deskripsi, kategori (atau ketik custom)
- Klik Simpan

**Voice:**
- Klik icon mic di form
- Dictate: "Beli bahan kue lima puluh ribu"
- Auto-extract ke form

**Telegram:**
```
/catat Beli kopi 25000
```

### 3. Kelola Stok (jika aktif)
- Masuk ke menu **Inventaris**
- Tambah barang (nama, SKU, stok awal, min. stock)
- Klik "Kelola Stok" untuk in/out/adjustment
- Lihat log pergerakan di tab Riwayat

### 4. Hutang & Piutang (jika aktif)
- Masuk ke menu **Hutang/Piutang**
- Tab **Piutang**: Orang lain berhutang ke Anda
- Tab **Hutang**: Anda berhutang ke orang lain
- Klik "Bayar" untuk partial payment
- Track progress dengan progress bar

### 5. Set Goals
- Masuk ke menu **Goals**
- Klik "Tambah Goal"
- Set target amount & deadline
- Klik "+ Kontribusi" untuk tambah tabungan manual
- Auto-track dari transaksi income (jika linked)

### 6. Lihat Laporan
- Masuk ke menu **Laporan**
- Pilih periode: Per bulan / Per tahun / Semua
- Gunakan shortcut: "Bulan ini", "Bulan lalu", "Tahun ini"
- Klik "Download PDF" untuk export

### 7. Telegram Bot Multi-Business
```bash
/switch              # Ganti bisnis aktif
/catat <deskripsi>   # Catat transaksi
/status              # Lihat saldo & summary
/laporan             # Kirim laporan text
/pdf                 # Generate PDF & kirim
```

### 8. Team Management (Growth/Business plan)
- Masuk ke Settings → Tim
- Klik "Undang Anggota"
- Pilih role: Admin (bisa input) atau Viewer (read-only)
- Member terima email invite dengan link
- Owner bisa remove member kapan saja

### 9. Feature Toggle
- Masuk ke Settings → **Fitur Aktif**
- Toggle on/off:
  - 📦 Inventaris
  - 💸 Hutang & Piutang
  - 🎯 Goals
  - 💰 Budget
  - 📱 Telegram
  - 👥 Team
- Sidebar otomatis hide menu yang disabled

---

## 🔒 Security

- **Better Auth** with secure session management
- **Password hashing** with bcrypt (via Better Auth)
- **CSRF protection** via Better Auth middleware
- **Environment variables** for sensitive data
- **Type-safe queries** via Drizzle ORM (SQL injection prevention)
- **Role-based access control** (Owner, Admin, Viewer)
- **Telegram webhook validation** with secret token
- **No client-side secrets** — all API keys server-side only

---

## 🌐 Deployment

### Vercel (Recommended)

1. **Push to GitHub:**
```bash
git add .
git commit -m "feat: ready for deploy"
git push origin main
```

2. **Connect to Vercel:**
- Import project from GitHub
- Set environment variables di Vercel dashboard
- Deploy!

3. **Set up Telegram webhook (jika pakai bot):**
```bash
curl -X POST https://api.telegram.org/bot<BOT_TOKEN>/setWebhook \
  -d url=https://your-domain.vercel.app/api/telegram \
  -d secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

4. **Run migration on production:**
```bash
psql $DATABASE_URL -f scripts/migrate_new_features.sql
```

### Build Locally
```bash
pnpm run build
pnpm start
```

---

## 💡 Roadmap & Future Enhancements

### ✅ Implemented (MVP Complete)
- [x] Multi-user auth & multi-business
- [x] Team management with roles
- [x] Custom categories & voice input
- [x] Hutang & piutang management
- [x] Inventaris with stock log
- [x] Goals with manual contribution
- [x] Report period filter (month/year/all)
- [x] Telegram bot with multi-business
- [x] Feature toggle per bisnis
- [x] AI chat with plan limits
- [x] PDF report generation
- [x] Onboarding wizard
- [x] Personal vs Business account type

### 🚧 In Progress
- [ ] Receipt OCR (image → text → transaction)
- [ ] WhatsApp Business API integration
- [ ] Recurring transactions (tagihan berulang)
- [ ] Budget vs actual tracking

### 📅 Planned (Phase 2)
- [ ] Mobile app (React Native / Flutter)
- [ ] Payment gateway (Midtrans / Xendit)
- [ ] Export Excel/CSV
- [ ] Email notifications (SMTP)
- [ ] Cron job untuk reminder jatuh tempo
- [ ] Integration dengan e-commerce (Tokopedia, Shopee)
- [ ] Subscription management di app (bukan manual)
- [ ] Webhook for external integrations

### 🌟 Ideas for Phase 3
- [ ] Invoice generation & management
- [ ] Customer relationship management (CRM lite)
- [ ] Supplier management
- [ ] Multi-currency support
- [ ] Tax calculation & reporting
- [ ] Profit margin analysis per product
- [ ] Employee payroll tracking
- [ ] Integration with accounting software (Accurate, Jurnal)

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow existing code style (TypeScript strict mode)
- Write meaningful commit messages (conventional commits)
- Test locally before PR
- Update README if adding new features
- Keep components small and focused

---

## 📄 License

MIT License — See [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/kasai/issues)
- **Email**: support@kasai.id
- **Telegram**: [@kasai_support](https://t.me/kasai_support)
- **Documentation**: [docs.kasai.id](https://docs.kasai.id)

---

## 🙏 Acknowledgments

- **Better Auth** — Modern auth solution
- **Neon** — Serverless Postgres
- **Google Gemini** — Free AI API
- **shadcn/ui** — Beautiful components
- **Vercel** — Seamless deployment
- **Drizzle ORM** — Type-safe database queries

---

## 📊 Project Stats

- **Lines of Code**: ~15,000+
- **Components**: 40+
- **Database Tables**: 18
- **API Routes**: 10+
- **Server Actions**: 100+
- **Features**: 20+

---

**Built with ❤️ for Indonesian UMKM**

---

## 📸 Screenshots

> TODO: Add screenshots of:
> - Landing page
> - Dashboard
> - Hutang/Piutang view
> - Inventaris panel
> - AI Chat
> - Reports with period filter
> - Settings with feature toggle
> - Telegram bot interaction

---

## 🎯 Target Users

- **UMKM** (Usaha Mikro Kecil Menengah)
  - Warung makan, cafe, laundry, toko retail, dll
- **Freelancers & Professionals**
  - Designer, developer, consultant
- **Personal Finance**
  - Individu yang ingin track pengeluaran
- **Small Teams**
  - Tim kecil yang butuh kolaborasi pencatatan

---

## 🌍 Localization

Currently supports **Bahasa Indonesia** only. English localization coming soon.

---

**⭐ If this project helps you, consider giving it a star!**
