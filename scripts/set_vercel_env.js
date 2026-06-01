/**
 * Set environment variables ke Vercel project via API
 * Usage: node scripts/set_vercel_env.js <VERCEL_TOKEN>
 *
 * Cara dapat token: https://vercel.com/account/tokens
 */

const TOKEN = process.argv[2]
if (!TOKEN) {
  console.log('Usage: node scripts/set_vercel_env.js <VERCEL_TOKEN>')
  console.log('Get token at: https://vercel.com/account/tokens')
  process.exit(1)
}

const PROJECT_ID = 'v0-ai-accounting-mvp'
const TEAM_SLUG = 'benedictusranggas-projects'

const ENV_VARS = [
  {
    key: 'BETTER_AUTH_URL',
    value: 'https://v0-ai-accounting-mvp.vercel.app',
    target: ['production', 'preview'],
  },
  {
    key: 'BETTER_AUTH_SECRET',
    value: 'POLNU6pWM0vrGuQ75UHo4oCwU5kVoZzVTyzTo1RrG/w=',
    target: ['production', 'preview', 'development'],
  },
  {
    key: 'GEMINI_API_KEY',
    value: process.env.GEMINI_API_KEY || 'REPLACE_WITH_YOUR_GEMINI_KEY',
    target: ['production', 'preview', 'development'],
  },
  {
    key: 'TELEGRAM_BOT_TOKEN',
    value: process.env.TELEGRAM_BOT_TOKEN || 'REPLACE_WITH_YOUR_BOT_TOKEN',
    target: ['production', 'preview', 'development'],
  },
  {
    key: 'ADMIN_SECRET',
    value: 'kasai_admin_' + Math.random().toString(36).slice(2),
    target: ['production', 'preview', 'development'],
  },
]

async function getTeamId() {
  const res = await fetch('https://api.vercel.com/v2/teams', {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  const data = await res.json()
  const team = data.teams?.find(t => t.slug === TEAM_SLUG)
  return team?.id
}

async function setEnvVar(teamId, envVar) {
  const url = `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${teamId}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: envVar.key,
      value: envVar.value,
      type: 'encrypted',
      target: envVar.target,
    }),
  })
  const data = await res.json()
  if (res.ok) {
    console.log(`✅ ${envVar.key}`)
  } else {
    // Kalau sudah ada, update
    if (data.error?.code === 'ENV_ALREADY_EXISTS') {
      console.log(`⚠️  ${envVar.key} sudah ada, skip`)
    } else {
      console.log(`❌ ${envVar.key}: ${data.error?.message || JSON.stringify(data)}`)
    }
  }
}

async function main() {
  console.log('🔍 Getting team ID...')
  const teamId = await getTeamId()
  if (!teamId) {
    console.error('❌ Team tidak ditemukan:', TEAM_SLUG)
    process.exit(1)
  }
  console.log('✅ Team ID:', teamId)
  console.log('\n📝 Setting environment variables...\n')

  for (const envVar of ENV_VARS) {
    await setEnvVar(teamId, envVar)
  }

  console.log('\n🎉 Selesai! Sekarang trigger redeploy:')
  console.log('   npx vercel --prod')
}

main().catch(console.error)
