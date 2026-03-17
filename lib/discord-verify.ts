/**
 * RoadHouse Capital — Discord Verify Token Helpers
 * ──────────────────────────────────────────────────
 * Creates and validates short-lived HMAC-SHA256 tokens for the
 * Discord /verify magic link flow.
 *
 * Token format (base64url): `<discordUserId>.<expires>.<hmac>`
 * TTL: 15 minutes
 *
 * Required env var: DISCORD_VERIFY_SECRET
 */

import { requireEnv } from '@/lib/env'

const TTL_MS = 15 * 60 * 1000 // 15 minutes

function base64url(buf: ArrayBuffer): string {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return base64url(sig)
}

export async function createVerifyToken(discordUserId: string): Promise<string> {
  const secret  = requireEnv('DISCORD_VERIFY_SECRET')
  const expires = Date.now() + TTL_MS
  const payload = `${discordUserId}.${expires}`
  const sig     = await hmac(secret, payload)
  // Return as a single base64url-safe string
  return `${Buffer.from(payload).toString('base64url')}.${sig}`
}

export interface VerifyTokenResult {
  valid:         boolean
  discordUserId: string
  error?:        string
}

export async function verifyToken(token: string): Promise<VerifyTokenResult> {
  let secret: string
  try {
    secret = requireEnv('DISCORD_VERIFY_SECRET')
  } catch {
    return { valid: false, discordUserId: '', error: 'Not configured' }
  }

  const parts = token.split('.')
  // token = base64url(payload) + '.' + sig
  // payload itself contains a dot: discordUserId.expires
  // So parts.length >= 3, last part is sig, rest is encoded payload
  if (parts.length < 2) {
    return { valid: false, discordUserId: '', error: 'Malformed token' }
  }

  const sig            = parts[parts.length - 1]
  const encodedPayload = parts.slice(0, parts.length - 1).join('.')

  let payload: string
  try {
    payload = Buffer.from(encodedPayload, 'base64url').toString()
  } catch {
    return { valid: false, discordUserId: '', error: 'Malformed token' }
  }

  const [discordUserId, expiresStr] = payload.split('.')
  if (!discordUserId || !expiresStr) {
    return { valid: false, discordUserId: '', error: 'Malformed payload' }
  }

  const expectedSig = await hmac(secret, payload)
  if (sig !== expectedSig) {
    return { valid: false, discordUserId: '', error: 'Invalid signature' }
  }

  if (Date.now() > parseInt(expiresStr, 10)) {
    return { valid: false, discordUserId: '', error: 'Token expired' }
  }

  return { valid: true, discordUserId }
}
