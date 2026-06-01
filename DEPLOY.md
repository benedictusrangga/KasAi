# Deploy ke Vercel

## 1. Push ke GitHub
```bash
git add .
git commit -m "update"
git push origin main
```

## 2. Import di Vercel
- Buka https://vercel.com/new
- Import repository GitHub: `benedictusrangga/KasAi`
- Framework: Next.js (auto-detect)

## 3. Environment Variables di Vercel
Buka Settings → Environment Variables dan tambahkan:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Connection string Neon Anda |
| `BETTER_AUTH_URL` | `https://YOUR-APP.vercel.app` |
| `BETTER_AUTH_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `GEMINI_API_KEY` | API key dari Google AI Studio |
| `TELEGRAM_BOT_TOKEN` | Token dari @BotFather |
| `ADMIN_SECRET` | String random yang kuat |

## 4. Setelah deploy — Set Telegram Webhook
```bash
node scripts/set_webhook.js https://YOUR-APP.vercel.app
```

## 5. Verifikasi
- Buka https://YOUR-APP.vercel.app
- Daftar akun baru
- Test chat ke @Aiaccountingsbot di Telegram
