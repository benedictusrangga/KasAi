/**
 * Check which database Vercel is using and run migration if needed
 * Run: node scripts/check_vercel_db.js <VERCEL_TOKEN>
 */
const TOKEN = process.argv[2]
if (!TOKEN) {
  console.log('Usage: node scripts/check_vercel_db.js <VERCEL_TOKEN>')
  process.exit(1)
}

const PROJECT_ID = 'v0-ai-accounting-mvp'
const TEAM_SLUG = 'benedictusranggas-projects'

async function main() {
  // Get team ID
  const teamsRes = await fetch('https://api.vercel.com/v2/teams', {
    headers: { Authorization: `Bearer ${TOKEN}` },
  })
  const teamsData = await teamsRes.json()
  const team = teamsData.teams?.find(t => t.slug === TEAM_SLUG)
  if (!team) { console.error('Team not found'); process.exit(1) }

  // Get env vars
  const envRes = await fetch(
    `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${team.id}&decrypt=true`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  )
  const envData = await envRes.json()
  const dbUrl = envData.envs?.find(e => e.key === 'DATABASE_URL')
  console.log('DATABASE_URL host:', dbUrl?.value?.match(/@([^/]+)\//)?.[1] || 'not found')

  // Add BETTER_AUTH_URL correctly
  const addRes = await fetch(
    `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${team.id}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'BETTER_AUTH_URL',
        value: 'https://v0-ai-accounting-mvp.vercel.app',
        type: 'encrypted',
        target: ['production', 'preview'],
      }),
    }
  )
  const addData = await addRes.json()
  if (addRes.ok) console.log('✅ BETTER_AUTH_URL added')
  else console.log('BETTER_AUTH_URL result:', addData.error?.message)
}

main().catch(console.error)
