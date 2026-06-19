# KasAI — AI-Powered Accounting for UMKM & Personal Finance

Platform pencatatan keuangan berbasis AI untuk UMKM Indonesia dan keuangan pribadi. Catat transaksi via Telegram, kelola stok, lacak hutang-piutang, dan dapatkan insight keuangan — semua dalam satu aplikasi.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 💬 Telegram Bot | Catat transaksi cukup dengan kirim pesan. AI baca bahasa natural Indonesia. |
| 📷 Scan Struk AI | Foto struk atau bukti transfer → Gemini baca otomatis |
| 🎙️ Input Suara | Dictate transaksi, AI ekstrak nominal & kategori |
| 🤖 AI Chat | Tanya insight keuangan, analisis spending, saran hemat |
| ✏️ Edit & Undo | "Eh salah, harusnya 9.5jt" atau "undo" — AI koreksi langsung |
| 🏢 Multi-Bisnis | Kelola banyak bisnis dari satu akun, switch via `/switch` |
| 👥 Tim Kolaborasi | Undang admin/viewer, role-based access control |
| 🎯 Goals & Budget | Target tabungan dengan progress bar, budget per kategori |
| 💸 Hutang & Piutang | Cicilan, partial payment, alert jatuh tempo |
| 📦 Inventaris | Stok in/out/adjustment, alert stok menipis, riwayat log |
| 📊 Laporan PDF | Export via `/pdf` di Telegram atau dari dashboard |
| ⚙️ Feature Toggle | On/off fitur per bisnis sesuai kebutuhan |
| 🌗 Dark Mode | UI dark/light mode otomatis |

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5.7
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Auth**: Better Auth v1.6 (email/password, session-based)
- **AI**: Google Gemini 2.5 Flash (dengan fallback ke 2.5-flash-lite → 1.5-flash)
- **PDF**: pdf-lib (server-side, Telegram) + jsPDF (client-side, dashboard)
- **UI**: Tailwind CSS v4 + shadcn/ui (Radix UI)
- **Deployment**: Vercel

---

## 💳 Paket & Harga

| Plan | Harga | Bisnis | Tx/bulan | AI Chat/bulan | Multi-User |
|---|---|---|---|---|---|
| Free | Gratis | 1 | 50 | 20 | ✗ |
| Personal Starter | Rp 29.000/bln | 1 | 200 | 100 | ✗ |
| Personal Pro | Rp 49.000/bln | 1 | 500 | 300 | ✗ |
| Personal Max | Rp 79.000/bln | 1 | 1.000 | 1.000 | ✗ |
| Personal Unlimited | Rp 129.000/bln | 1 | ∞ | ∞ | ✗ |
| Business Starter | Rp 149.000/bln | 3 | 2.000 | 500 | ✗ |
| Business Pro | Rp 249.000/bln | 10 | ∞ | ∞ | ✓ (3 admin) |
| Business Enterprise | Rp 499.000/bln | ∞ | ∞ | ∞ | ✓ (∞ member) |

---

## 🗄 Database Schema

18 tabel:

**Auth (Better Auth)**: `user`, `session`, `account`, `verification`

**Bisnis & Tim**: `business`, `business_member`, `user_feature_config`

**Transaksi**: `transaction`, `category`, `transaction_comment`, `business_products`

**Keuangan**: `payable` (hutang), `receivable` (piutang), `goal`, `budget`

**Inventaris**: `inventory_item`, `inventory_log`

**Lainnya**: `ai_chat`, `report`, `onboarding_progress`

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <repository-url>
cd ai-accounting-mvp
npm install
```

### 2. Environment Variables

```bash
cp .env.local.example .env.local
```

Isi semua nilai di `.env.local`:

```env
DATABASE_URL=postgresql://user:pass@host/db
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<min 32 karakter random>
GEMINI_API_KEY=<dari aistudio.google.com>
TELEGRAM_BOT_TOKEN=<dari @BotFather>
TELEGRAM_WEBHOOK_SECRET=<random hex, wajib di production>
ADMIN_SECRET=<secret untuk endpoint admin>
```

### 3. Setup Database

```bash
# Fresh install — jalankan semua migration
psql $DATABASE_URL -f scripts/reset_and_migrate.sql
psql $DATABASE_URL -f scripts/migrate_new_features.sql
```

> ⚠️ `reset_and_migrate.sql` menghapus semua data. Untuk DB yang sudah ada, jalankan hanya `migrate_new_features.sql`.

### 4. Jalankan Dev Server

```bash
npm run dev
```

Buka **http://localhost:3000** 🎉

---

## 📱 Setup Telegram Bot

### Development (dengan ngrok)

```bash
# Install ngrok, expose port 3000
ngrok http 3000

# Register webhook
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -d url=https://<ngrok-url>/api/telegram \
  -d secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

### Production (Vercel)

```bash
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -d url=https://yourdomain.vercel.app/api/telegram \
  -d secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

> `TELEGRAM_WEBHOOK_SECRET` **wajib** diset agar webhook tidak bisa dipalsukan.

---

## 🔒 Security Notes

- Telegram webhook divalidasi dengan `X-Telegram-Bot-Api-Secret-Token` — request tanpa secret ditolak 401
- Password user di-hash menggunakan Better Auth's native `hashPassword` (node:crypto scrypt) — kompatibel penuh dengan proses login
- `planExpiresAt` di-enforce setiap kali user membuat transaksi dan load dashboard — plan expired otomatis di-downgrade ke Free
- Plan `maxBusinesses` di-enforce untuk semua tipe akun, bukan hanya personal
- Role-based access (owner/admin/viewer) konsisten di semua server actions
- Tidak ada secret di client-side — semua API key server-only

---

## 🛠 Scripts & Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run db:apply     # Apply schema via scripts/apply_schema.js
npm run admin:create # Create admin user via scripts/create_admin.js
```

---

## 📁 Project Structure

```
app/
├── api/
│   ├── auth/[...all]/         # Better Auth handler
│   ├── auth/set-password/     # Set password untuk invited users
│   ├── admin/create-user/     # Admin: buat user + invite link
│   ├── admin/users/           # Admin: list users
│   ├── telegram/              # Telegram webhook (with secret validation)
│   ├── report/pdf/            # Report data endpoint
│   ├── onboarding/status/     # Onboarding check
│   └── user/me/               # Current user info + plan enforcement
├── actions/                   # Server actions (semua pakai shared session utility)
│   ├── business.ts            # Business CRUD (enforce plan maxBusinesses)
│   ├── transaction.ts         # Transaction CRUD (enforce plan + expiry)
│   ├── ai-chat.ts             # AI chat pipeline
│   ├── telegram.ts            # Telegram bot handler
│   ├── payables.ts            # Hutang & piutang
│   ├── inventory.ts           # Inventaris
│   ├── goals.ts               # Goals & budget
│   ├── features.ts            # Feature config per bisnis
│   ├── members.ts             # Team management
│   ├── comments.ts            # Transaction comments
│   └── onboarding.ts          # Onboarding wizard
├── dashboard/                 # Dashboard pages
├── set-password/              # Halaman set password untuk invited users
├── invite/[token]/            # Accept team invite
├── onboarding/                # 3-step wizard
├── sign-in/ sign-up/          # Auth pages
└── admin/                     # Admin panel

lib/
├── session.ts                 # Shared getSessionUserId() utility
├── plan-enforcement.ts        # planExpiresAt enforcement + auto-downgrade
├── plan-limits.ts             # Plan definitions & check functions
├── auth.ts                    # Better Auth config
├── gemini.ts                  # Gemini AI (with model fallback chain)
└── pdf-server.ts              # Server-side PDF generation (pdf-lib)
```

---

## 🌐 Deployment ke Vercel

1. Push ke GitHub
2. Import project di vercel.com
3. Set semua environment variables di Vercel dashboard
4. Deploy
5. Register Telegram webhook dengan URL production

---

## 📅 Roadmap

### ✅ Done
- Multi-user auth & team management
- Telegram bot + AI (Gemini 2.5 Flash)
- Receipt OCR, voice input, AI chat
- Hutang/piutang, inventaris, goals, budget
- PDF export (server + client)
- Feature toggle per bisnis
- Plan limits enforcement (tx/bulan + expiry)
- Telegram webhook security

### 🚧 Coming Soon
- Payment gateway (Xendit/Midtrans)
- Email notifications (invite link delivery)
- OAuth (Google login)
- Recurring transactions
- Cron job untuk reminder overdue
- Export Excel/CSV

---

**Built with ❤️ for Indonesian UMKM**
