/**
 * RoadHouse Capital — Site Config
 * ─────────────────────────────────
 * Single source of truth for all public configuration values.
 * Components import from here — never read process.env directly in JSX.
 *
 * NEXT_PUBLIC_* vars are inlined at build time by Next.js.
 * They must be set in .env.local before running `next build`.
 */

export const siteConfig = {
  // ── App ────────────────────────────────────────────────────────────────────
  name: 'RoadHouse Capital',
  tagline: 'Where Standards Matter',
  description: 'A creator-owned ecosystem at the intersection of streaming, community, and culture.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? '',

  // ── Contact ────────────────────────────────────────────────────────────────
  // Set NEXT_PUBLIC_CONTACT_EMAIL and NEXT_PUBLIC_FOUNDER_EMAIL in .env.local
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '',
  founderEmail: process.env.NEXT_PUBLIC_FOUNDER_EMAIL ?? '',

  // ── Social ─────────────────────────────────────────────────────────────────
  // Hardcoded intentionally — public-facing social handles are not secrets
  social: {
    x:             'https://x.com/dollywooddole',
    kick:          'https://kick.com/dollywooddole',
    tiktokBrand:   'https://www.tiktok.com/@roadhousesyndicate',
    tiktokPersonal:'https://www.tiktok.com/@dollywooddole',
    discord:       'https://discord.gg/wwhhKcnQJ3',
    youtube:       '',  // add when live
  },

  // ── Solana ─────────────────────────────────────────────────────────────────
  solana: {
    network:        process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? 'devnet',
    rpc:            process.env.NEXT_PUBLIC_SOLANA_RPC ?? '',
    roadMint:       process.env.NEXT_PUBLIC_ROAD_MINT_ADDRESS ?? '',
    treasuryWallet: process.env.NEXT_PUBLIC_TREASURY_WALLET ?? '',
    multisigWallet: process.env.NEXT_PUBLIC_MULTISIG_WALLET ?? '',
    nft: {
      founding: process.env.NEXT_PUBLIC_NFT_FOUNDING_COLLECTION ?? '',
      regular:  process.env.NEXT_PUBLIC_NFT_REGULAR_COLLECTION ?? '',
      ranch:    process.env.NEXT_PUBLIC_NFT_RANCH_COLLECTION ?? '',
      partner:  process.env.NEXT_PUBLIC_NFT_PARTNER_COLLECTION ?? '',
    },
  },

  // ── Stripe Price IDs ───────────────────────────────────────────────────────
  // null = product not yet configured in Stripe; UI will show "Coming Soon"
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
    subscriptions: {
      regular: process.env.NEXT_PUBLIC_STRIPE_SUB_REGULAR ?? null,
      ranch:   process.env.NEXT_PUBLIC_STRIPE_SUB_RANCH ?? null,
      partner: process.env.NEXT_PUBLIC_STRIPE_SUB_PARTNER ?? null,
    },
    merch: {
      tee:      process.env.NEXT_PUBLIC_STRIPE_PRICE_TEE ?? null,
      hat:      process.env.NEXT_PUBLIC_STRIPE_PRICE_HAT ?? null,
      hoodie:   process.env.NEXT_PUBLIC_STRIPE_PRICE_HOODIE ?? null,
      stickers: process.env.NEXT_PUBLIC_STRIPE_PRICE_STICKERS ?? null,
      glass:    process.env.NEXT_PUBLIC_STRIPE_PRICE_GLASS ?? null,
      phone:    process.env.NEXT_PUBLIC_STRIPE_PRICE_PHONE ?? null,
    },
    events: {
      skMeetup:  process.env.NEXT_PUBLIC_STRIPE_PRICE_SKMT       ?? null,
      summit:    process.env.NEXT_PUBLIC_STRIPE_PRICE_SUMMIT     ?? null,
      summitVip: process.env.NEXT_PUBLIC_STRIPE_PRICE_SUMMIT_VIP ?? null,
    },
    sponsorships: {
      trailBlazer: process.env.NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_TB ?? null,
      frontier:    process.env.NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_FR ?? null,
      praetor:     process.env.NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_PR ?? null,
    },
    adventures: {
      lake: process.env.NEXT_PUBLIC_STRIPE_PRICE_ADV_LAKE ?? null,
      ski:  process.env.NEXT_PUBLIC_STRIPE_PRICE_ADV_SKI  ?? null,
      med:  process.env.NEXT_PUBLIC_STRIPE_PRICE_ADV_MED  ?? null,
    },
  },

  // ── Discord ────────────────────────────────────────────────────────────────
  discord: {
    inviteUrl:  'https://discord.gg/wwhhKcnQJ3',
    guildId:    process.env.DISCORD_GUILD_ID       ?? '',
    roles: {
      regular:  process.env.DISCORD_ROLE_REGULAR   ?? '',
      ranch:    process.env.DISCORD_ROLE_RANCH_HAND ?? '',
      partner:  process.env.DISCORD_ROLE_PARTNER   ?? '',
    },
  },
} as const

// ── Runtime availability checks ───────────────────────────────────────────────
// Use these in components to conditionally render features

export const featureFlags = {
  stripeReady: Boolean(siteConfig.stripe.publishableKey),
  solanaReady: Boolean(siteConfig.solana.roadMint),
  nftReady:    Boolean(siteConfig.solana.nft.founding),
  discordBot:  Boolean(siteConfig.discord.guildId),
} as const
