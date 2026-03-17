/**
 * RoadHouse Capital — Environment Validator
 * ──────────────────────────────────────────
 * Validates all required environment variables at startup.
 * Throws clear, actionable errors rather than silent failures.
 *
 * Import this at the top of any server-side module that needs env vars.
 * Client-side vars (NEXT_PUBLIC_*) are validated separately since they
 * are inlined at build time and cannot be checked server-side the same way.
 */

type EnvVar = {
  key: string
  required: boolean
  description: string
  serverOnly?: boolean  // true = never expose to client
  example?: string
}

const ENV_SCHEMA: EnvVar[] = [
  // ── App ────────────────────────────────────────────────────────────────────
  {
    key: 'NEXT_PUBLIC_APP_URL',
    required: true,
    description: 'Public URL of the deployed app (no trailing slash)',
    example: 'https://roadhouse.capital',
  },

  // ── Solana ─────────────────────────────────────────────────────────────────
  {
    key: 'NEXT_PUBLIC_SOLANA_NETWORK',
    required: true,
    description: 'Solana network: devnet or mainnet-beta',
    example: 'devnet',
  },
  {
    key: 'NEXT_PUBLIC_ROAD_MINT_ADDRESS',
    required: false, // not required until token is deployed
    description: '$ROAD SPL token mint address — set after running npm run mint-token',
    example: 'So1anaAddressHere...',
  },
  {
    key: 'NEXT_PUBLIC_TREASURY_WALLET',
    required: false,
    description: 'Gnosis Safe multisig treasury wallet address',
  },
  {
    key: 'NEXT_PUBLIC_MULTISIG_WALLET',
    required: false,
    description: 'On-chain multisig signer wallet address',
  },

  // ── Stripe (server-side secrets) ───────────────────────────────────────────
  {
    key: 'STRIPE_SECRET_KEY',
    required: true,
    serverOnly: true,
    description: 'Stripe secret key — NEVER expose to client',
    example: 'sk_live_... or sk_test_...',
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    required: true,
    serverOnly: true,
    description: 'Stripe webhook signing secret',
    example: 'whsec_...',
  },
  {
    key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: true,
    description: 'Stripe publishable key — safe for client',
    example: 'pk_live_... or pk_test_...',
  },

  // ── Stripe Price IDs ───────────────────────────────────────────────────────
  { key: 'NEXT_PUBLIC_STRIPE_SUB_REGULAR',           required: false, description: 'Stripe price ID — Regular subscription' },
  { key: 'NEXT_PUBLIC_STRIPE_SUB_RANCH',             required: false, description: 'Stripe price ID — Ranch Hand subscription' },
  { key: 'NEXT_PUBLIC_STRIPE_SUB_PARTNER',           required: false, description: 'Stripe price ID — Partner subscription' },
  { key: 'NEXT_PUBLIC_STRIPE_PRICE_TEE',             required: false, description: 'Stripe price ID — Tee' },
  { key: 'NEXT_PUBLIC_STRIPE_PRICE_HAT',             required: false, description: 'Stripe price ID — Hat' },
  { key: 'NEXT_PUBLIC_STRIPE_PRICE_HOODIE',          required: false, description: 'Stripe price ID — Hoodie' },
  { key: 'NEXT_PUBLIC_STRIPE_PRICE_STICKERS',        required: false, description: 'Stripe price ID — Sticker pack' },
  { key: 'NEXT_PUBLIC_STRIPE_PRICE_GLASS',           required: false, description: 'Stripe price ID — Glass' },
  { key: 'NEXT_PUBLIC_STRIPE_PRICE_PHONE',           required: false, description: 'Stripe price ID — Phone case' },
  { key: 'NEXT_PUBLIC_STRIPE_PRICE_SKMT',            required: false, description: 'Stripe price ID — SK Meetup ticket' },
  { key: 'NEXT_PUBLIC_STRIPE_PRICE_SUMMIT',          required: false, description: 'Stripe price ID — Summit ticket' },
  { key: 'NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_TB',      required: false, description: 'Stripe price ID — Trail Blazer sponsorship' },
  { key: 'NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_FR',      required: false, description: 'Stripe price ID — Frontier sponsorship' },
  { key: 'NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_PR',      required: false, description: 'Stripe price ID — Praetor sponsorship' },

  // ── Contact ────────────────────────────────────────────────────────────────
  {
    key: 'NEXT_PUBLIC_CONTACT_EMAIL',
    required: true,
    description: 'Primary business contact email',
    example: 'roadhousesyndicate@gmail.com',
  },
  {
    key: 'NEXT_PUBLIC_FOUNDER_EMAIL',
    required: true,
    description: 'Founder direct contact email',
    example: 'daltonellscheid@gmail.com',
  },

  // ── Email (Resend) ─────────────────────────────────────────────────────────
  { key: 'RESEND_API_KEY',    required: false, serverOnly: true, description: 'Resend API key — enables the contact form POST endpoint', example: 're_...' },
  { key: 'RESEND_FROM_EMAIL', required: false, serverOnly: true, description: 'Verified sender address in Resend (default: noreply@roadhouse.capital)', example: 'noreply@roadhouse.capital' },

  // ── Discord ─────────────────────────────────────────────────────────────────
  { key: 'DISCORD_BOT_TOKEN',       required: false, serverOnly: true, description: 'Discord bot token for role automation' },
  { key: 'DISCORD_APP_ID',         required: false, description: 'Discord Application ID (from Developer Portal)' },
  { key: 'DISCORD_PUBLIC_KEY',     required: false, serverOnly: true, description: 'Discord app public key for verifying interaction signatures' },
  { key: 'DISCORD_GUILD_ID',       required: false, description: 'Discord server (guild) ID' },
  { key: 'DISCORD_ROLE_REGULAR',   required: false, description: 'Discord role ID for Regular tier' },
  { key: 'DISCORD_ROLE_RANCH_HAND',required: false, description: 'Discord role ID for Ranch Hand tier' },
  { key: 'DISCORD_ROLE_PARTNER',   required: false, description: 'Discord role ID for Partner tier' },
  { key: 'DISCORD_VERIFY_SECRET',  required: false, serverOnly: true, description: 'Random secret for signing Discord /verify magic link tokens (min 32 chars)' },
  { key: 'DISCORD_ADMIN_SECRET',   required: false, serverOnly: true, description: 'Shared secret for /api/discord/assign-role and /api/discord/revoke-role admin endpoints' },
]

// ── Server-side validator ─────────────────────────────────────────────────────

export function validateServerEnv(): void {
  const missing: string[] = []
  const warnings: string[] = []

  for (const { key, required, description, example } of ENV_SCHEMA) {
    const value = process.env[key]
    const isEmpty = !value || value.trim() === ''

    if (required && isEmpty) {
      missing.push(`  ✗ ${key}\n    → ${description}${example ? `\n    → Example: ${example}` : ''}`)
    } else if (!required && isEmpty) {
      warnings.push(`  ⚠  ${key} — ${description} (optional, feature will be disabled)`)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `\n\n❌ RoadHouse: Missing required environment variables:\n\n${missing.join('\n\n')}\n\n` +
      `Copy .env.example → .env.local and fill in the required values.\n`
    )
  }

  if (warnings.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(`\n⚠  RoadHouse: Optional env vars not set (features disabled):\n${warnings.join('\n')}\n`)
  }
}

// ── Safe env getters ──────────────────────────────────────────────────────────
// Use these instead of process.env directly — they throw clearly if a
// required var is accessed but missing, rather than returning undefined.

export function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value || value.trim() === '') {
    throw new Error(
      `RoadHouse: Required environment variable "${key}" is not set.\n` +
      `Check .env.local and ensure it is defined.`
    )
  }
  return value
}

export function optionalEnv(key: string, fallback = ''): string {
  return process.env[key]?.trim() || fallback
}

// ── Client-side env (inlined at build time) ───────────────────────────────────
// These are validated at component render rather than startup.

export function requirePublicEnv(key: string): string {
  // @ts-ignore — dynamic access of NEXT_PUBLIC_ vars
  const value = process.env[key]
  if (!value || value.trim() === '') {
    throw new Error(
      `RoadHouse: Required public env var "${key}" is not set. ` +
      `This is inlined at build time — ensure it is set in .env.local before building.`
    )
  }
  return value
}

export function optionalPublicEnv(key: string): string | null {
  // @ts-ignore
  const value = process.env[key]
  return value?.trim() || null
}
