/**
 * RoadHouse Capital — Discord Interactions Endpoint
 * ───────────────────────────────────────────────────
 * Receives and verifies Discord slash command interactions.
 * Currently handles: /verify
 *
 * Discord requires:
 *   1. Ed25519 signature verification on every request
 *   2. Immediate PONG response to type=1 (ping)
 *   3. Response within 3 seconds for type=2 (application command)
 *
 * Set this URL in Discord Developer Portal → Your App → Interactions Endpoint URL:
 *   https://roadhouse.capital/api/discord/interactions
 *
 * Required env vars:
 *   DISCORD_PUBLIC_KEY        — from Developer Portal (not the bot token)
 *   DISCORD_VERIFY_SECRET     — random secret for signing magic link tokens
 *   NEXT_PUBLIC_APP_URL       — e.g. https://roadhouse.capital
 */

import { NextRequest, NextResponse } from 'next/server'
import { optionalEnv } from '@/lib/env'
import { createVerifyToken } from '@/lib/discord-verify'

// ── Ed25519 signature verification ────────────────────────────────────────────

async function verifySignature(
  publicKey: string,
  signature: string,
  timestamp: string,
  rawBody: string
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      hexToBytes(publicKey),
      { name: 'Ed25519' },
      false,
      ['verify']
    )
    const encoder = new TextEncoder()
    return await crypto.subtle.verify(
      'Ed25519',
      key,
      hexToBytes(signature),
      encoder.encode(timestamp + rawBody)
    )
  } catch {
    return false
  }
}

function hexToBytes(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes.buffer as ArrayBuffer
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const publicKey = optionalEnv('DISCORD_PUBLIC_KEY')
  if (!publicKey) {
    console.error(JSON.stringify({ evt: 'discord.interactions.no_public_key' }))
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const signature = req.headers.get('x-signature-ed25519') ?? ''
  const timestamp = req.headers.get('x-signature-timestamp') ?? ''
  const rawBody   = await req.text()

  const valid = await verifySignature(publicKey, signature, timestamp, rawBody)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid request signature' }, { status: 401 })
  }

  let body: any
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ── Type 1: Ping (Discord verifies the endpoint URL) ──────────────────────
  if (body.type === 1) {
    return NextResponse.json({ type: 1 })
  }

  // ── Type 2: Application command ───────────────────────────────────────────
  if (body.type === 2) {
    const commandName  = body.data?.name as string
    const discordUserId = body.member?.user?.id ?? body.user?.id ?? ''

    if (commandName === 'verify') {
      return handleVerifyCommand(discordUserId)
    }

    return NextResponse.json({
      type: 4,
      data: { content: 'Unknown command.', flags: 64 },
    })
  }

  return NextResponse.json({ type: 1 })
}

// ── /verify command ───────────────────────────────────────────────────────────

async function handleVerifyCommand(discordUserId: string): Promise<NextResponse> {
  if (!discordUserId) {
    return NextResponse.json({
      type: 4,
      data: {
        content: 'Could not identify your Discord user. Please try again.',
        flags: 64,
      },
    })
  }

  let token: string
  try {
    token = await createVerifyToken(discordUserId)
  } catch (err) {
    console.error(JSON.stringify({ evt: 'discord.verify.token_error', error: String(err) }))
    return NextResponse.json({
      type: 4,
      data: {
        content: '⚠️ Verification service is not configured. Contact the team.',
        flags: 64,
      },
    })
  }

  const appUrl    = optionalEnv('NEXT_PUBLIC_APP_URL') || 'https://roadhouse.capital'
  const verifyUrl = `${appUrl}/api/discord/verify?t=${token}&id=${discordUserId}`

  return NextResponse.json({
    type: 4,
    data: {
      // flags: 64 = EPHEMERAL — only visible to the user who ran the command
      flags: 64,
      content: [
        '**Link your RoadHouse membership to Discord**',
        '',
        'Click the link below and enter the email address you used to subscribe.',
        'The link expires in **15 minutes**.',
        '',
        verifyUrl,
        '',
        '_If you haven\'t subscribed yet, visit roadhouse.capital to join._',
      ].join('\n'),
    },
  })
}
