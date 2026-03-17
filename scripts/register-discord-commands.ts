/**
 * RoadHouse Capital — Discord Slash Command Registration
 * ───────────────────────────────────────────────────────
 * Registers application commands with Discord's API.
 * Run once after creating the Discord application, and again after any
 * command changes.
 *
 * Usage:
 *   npx ts-node --project tsconfig.node.json scripts/register-discord-commands.ts
 *
 * Required env vars (set in .env.local or shell):
 *   DISCORD_APP_ID         — Application ID from Developer Portal
 *   DISCORD_BOT_TOKEN      — Bot token (not the public key)
 *   DISCORD_GUILD_ID       — (Optional) Register as guild commands for instant
 *                            propagation. Omit to register globally (up to 1hr delay).
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const APP_ID   = process.env.DISCORD_APP_ID
const TOKEN    = process.env.DISCORD_BOT_TOKEN
const GUILD_ID = process.env.DISCORD_GUILD_ID

if (!APP_ID || !TOKEN) {
  console.error('❌  DISCORD_APP_ID and DISCORD_BOT_TOKEN are required.')
  process.exit(1)
}

const commands = [
  {
    name:        'verify',
    description: 'Link your RoadHouse membership to Discord and receive your role',
  },
]

async function register() {
  const url = GUILD_ID
    ? `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`
    : `https://discord.com/api/v10/applications/${APP_ID}/commands`

  console.log(`Registering ${commands.length} command(s) ${GUILD_ID ? `to guild ${GUILD_ID}` : 'globally'}…`)

  const res = await fetch(url, {
    method:  'PUT',
    headers: {
      Authorization:  `Bot ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`❌  Discord API error ${res.status}:`, err)
    process.exit(1)
  }

  const data = await res.json() as { id: string; name: string }[]
  console.log('✓  Commands registered:')
  data.forEach(cmd => console.log(`   /${cmd.name}  (id: ${cmd.id})`))

  if (!GUILD_ID) {
    console.log('\nℹ️  Global commands can take up to 1 hour to propagate.')
    console.log('   Set DISCORD_GUILD_ID for instant updates during development.')
  }
}

register().catch(err => {
  console.error('❌  Registration failed:', err)
  process.exit(1)
})
