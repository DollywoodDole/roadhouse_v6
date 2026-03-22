# RoadHouse v6 — Claude Code Operating Instructions

> Praetorian Holdings Corp. · Saskatchewan, Canada · roadhouse.capital
> Founder: Dalton Ellscheid (DollywoodDole) · daltonellscheid@gmail.com
> Repo: github.com/DollywoodDole/roadhouse_v6

---

## What This Project Is

RoadHouse is a creator-owned ecosystem converting streaming attention into community capital and investable IP. The stack is Next.js 16 + Solana SPL + Stripe + Vercel. The site is live at roadhouse.capital.

**The mandate in priority order:**
1. Web2 perfect — Stripe flows, Discord gating, email, member portal
2. Web3 architecture — design only, no mainnet deploy until legal is locked
3. Adventure NFTs — three real-world experiences as on-chain credentials
4. Claude agent team — orchestrator + specialist agents, all moderated through the site

---

## Tech Stack

```
Framework:     Next.js 16 (App Router) — next dev --webpack for local
Language:      TypeScript (strict mode)
Styling:       Tailwind CSS — custom tokens only (no arbitrary values)
Payments:      Stripe (subscriptions + one-time + webhooks)
Blockchain:    Solana — @solana/web3.js, @metaplex-foundation/umi, @solana/spl-token
Wallet:        Phantom + Solflare via @solana/wallet-adapter-react
Email:         Resend — from roadhousesyndicate@gmail.com
Discord:       Bot via REST API — role gating by Stripe tier
Storage:       Vercel KV — off-chain $ROAD balance tracking
Deploy:        Vercel (iad1 region) — vercel.json configured
Domain:        https://roadhouse.capital (canonical)
```

---

## Brand Tokens (Never Deviate)

```ts
// tailwind.config.js — use these, never hardcode hex
colors: {
  gold: {
    DEFAULT: '#C9922A',
    light:   '#F0C060',
    dark:    '#8B6318',
    pale:    '#E8D5A0',
    muted:   '#6B4E1A',
  },
  rh: {
    black:    '#0A0806',
    surface:  '#111009',
    card:     '#1A1712',
    elevated: '#242016',
    border:   '#2A2318',
    text:     '#E8DCC8',
    muted:    '#8A7D6A',
    faint:    '#4A4238',
  },
}

fonts: {
  cormorant: ['var(--font-cormorant)', 'Georgia', 'serif'],
  mono:      ['var(--font-dm-mono)', 'Courier New', 'monospace'],
}
```

**Brand voice:** Direct. Unfiltered. High-standard. No filler. No hype. No urgency tactics.
**Tagline:** "Where Standards Matter."
**Core line:** "Discretion isn't a rule — it's a reflex."

---

## File Structure

```
/app
  /api
    /webhooks/stripe/route.ts   ← Stripe webhook handler (signature verified)
    /contact/route.ts           ← Contact form → Resend
    /discord/assign-role/       ← POST: assign Discord role after subscription
    /discord/revoke-role/       ← POST: revoke Discord role after cancellation
    /road/balance/route.ts      ← GET: member's off-chain $ROAD balance
    /road/accrue/route.ts       ← POST: monthly $ROAD accrual (cron)
    /wallet/register/route.ts   ← POST: register wallet address for airdrop
    /portal/session/route.ts    ← Stripe Customer Portal session
    /agents/run/route.ts        ← Agent orchestrator trigger
    /agents/status/route.ts     ← Agent job status + approval queue
  /portal/page.tsx              ← Member portal (/portal)
  /adventures/
    page.tsx                    ← Adventure NFT hub
    /lake-trip/page.tsx         ← Adventure #001
    /ski-trip/page.tsx          ← Adventure #002
    /mediterranean/page.tsx     ← Adventure #003 (waitlist, Ranch Hand+ gated)
  /dao/page.tsx                 ← DAO governance
  /guilds/page.tsx              ← Four guilds + applications

/agents
  orchestrator.ts
  registry.ts
  content/index.ts
  sponsorship/index.ts
  community/index.ts
  treasury/index.ts
  adventure/index.ts
  tools/
    web-search.ts
    discord-post.ts
    stripe-query.ts
    drive-read.ts
  prompts/
    orchestrator.md
    brand-voice.md
    sponsorship.md

/lib
  stripe.ts           ← Stripe singleton client
  membership.ts       ← Tier logic, role mapping
  discord.ts          ← Discord REST API client
  email.ts            ← Resend send() wrapper
  road-balance.ts     ← Vercel KV $ROAD accrual
  treasury.ts         ← Squads multisig balance fetch
  nft-mint.ts         ← NFT mint helper (called by webhook)
  wallet.ts           ← Wallet connect helpers

/emails              ← React Email templates
/scripts
  create-stripe-prices.ts ← Run once to generate all Stripe price IDs
  mint-road-token.ts      ← npm run mint-token
  add-road-metadata.ts    ← npm run add-metadata

/docs
  stripe-products.md  ← All Stripe product + price ID documentation
  tokenomics.md       ← Public $ROAD tokenomics paper
  governance-spec.md  ← DAO governance architecture
  env-guide.md        ← Env var documentation (no values)
```

---

## Commands

```bash
npm run dev          # Next.js dev server (webpack mode)
npm run build        # Production build
npm run lint         # ESLint
npm run mint-token   # Deploy $ROAD SPL token (devnet)
npm run add-metadata # Add Metaplex metadata to $ROAD

# Generate all Stripe products + price IDs (run once)
STRIPE_SECRET_KEY=sk_live_... npx ts-node --project tsconfig.scripts.json scripts/create-stripe-prices.ts

# Stripe webhook local testing
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Vercel env
vercel env add VAR_NAME   # Never commit secrets
vercel env pull           # Pull to .env.local for local dev
```

---

## Environment Variables

**Never commit secrets. Never log them. Set all in Vercel dashboard.**

### Required for web2 (M1 — must work before web3):
```
NEXT_PUBLIC_APP_URL
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
FROM_EMAIL=hello@roadhouse.capital
DISCORD_BOT_TOKEN
DISCORD_GUILD_ID
DISCORD_ROLE_REGULAR
DISCORD_ROLE_RANCH_HAND
DISCORD_ROLE_PARTNER
```

### Stripe Price IDs (all required — run scripts/create-stripe-prices.ts to generate):
```
# Memberships
NEXT_PUBLIC_STRIPE_SUB_REGULAR          # $19.99/mo CAD
NEXT_PUBLIC_STRIPE_SUB_RANCH            # $99.99/mo CAD
NEXT_PUBLIC_STRIPE_SUB_PARTNER          # $199.98/mo CAD

# Merch
NEXT_PUBLIC_STRIPE_PRICE_TEE
NEXT_PUBLIC_STRIPE_PRICE_HAT
NEXT_PUBLIC_STRIPE_PRICE_HOODIE
NEXT_PUBLIC_STRIPE_PRICE_STICKERS
NEXT_PUBLIC_STRIPE_PRICE_GLASS
NEXT_PUBLIC_STRIPE_PRICE_PHONE

# Digital Products
NEXT_PUBLIC_STRIPE_PRICE_PLAYBOOK       # $129.99 CAD
NEXT_PUBLIC_STRIPE_PRICE_TOOLKIT        # $295.99 CAD

# Events
NEXT_PUBLIC_STRIPE_PRICE_SKMT           # $999 CAD
NEXT_PUBLIC_STRIPE_PRICE_SUMMIT         # $1,599 CAD
NEXT_PUBLIC_STRIPE_PRICE_SUMMIT_VIP     # $299 CAD

# Adventures
NEXT_PUBLIC_STRIPE_PRICE_ADV_LAKE       # $199 CAD deposit
NEXT_PUBLIC_STRIPE_PRICE_ADV_SKI        # $299 CAD deposit (opens after Snapshot vote)
NEXT_PUBLIC_STRIPE_PRICE_ADV_MED        # $1,000 CAD hold ($500 non-refundable within 14 days)

# Sponsorships
NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_TB     # $1,000/mo CAD
NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_FR     # $2,500/mo CAD
NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_PR     # $10,000/mo CAD
```

### Feature Flags:
```
NEXT_PUBLIC_SKI_VOTE_RESOLVED=false     # Set true to open Ski Trip deposits after Snapshot vote
```

### Web3 (set when contracts deploy — devnet first):
```
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC
NEXT_PUBLIC_ROAD_MINT_ADDRESS
NEXT_PUBLIC_NFT_FOUNDING_COLLECTION
NEXT_PUBLIC_NFT_REGULAR_COLLECTION
NEXT_PUBLIC_NFT_RANCH_COLLECTION
NEXT_PUBLIC_NFT_PARTNER_COLLECTION
NEXT_PUBLIC_TREASURY_WALLET
NEXT_PUBLIC_MULTISIG_WALLET
```

### Agents:
```
ANTHROPIC_API_KEY
```

---

## Current GitHub Issues — Priority Order

Fix in this exact order. Do not skip ahead.

### 🔴 HOTFIX — Fix immediately (live site broken)
- **#1** — `{siteConfig.contactEmail}` and `{siteConfig.founderEmail}` rendering as raw text in DOM
  - Fix: replace all occurrences with backtick template literals — `` href={`mailto:${siteConfig.contactEmail}`} ``
  - Affected: Rare Talent section, Coconut Cowboy FAQ, footer contact links
- **#2** — Founding NFT section shows dev placeholder text to the public
  - Fix: replace with pre-launch waitlist CTA linking to `NEXT_PUBLIC_STRIPE_SUB_REGULAR` checkout
- **#3** — Contact form has no POST endpoint
  - Fix: build `/app/api/contact/route.ts` — Resend to roadhousesyndicate@gmail.com, auto-reply to submitter, rate limit 3/IP/hr, honeypot field

### 🟠 M1 — Web2 Perfect (April)
- **#4** — Create all Stripe products + populate all price ID env vars (run `scripts/create-stripe-prices.ts`)
- **#5** — Stripe webhook handler: all lifecycle events (sub created/updated/deleted, payment failed, checkout completed)
- **#6** — Discord bot: assign/revoke roles via Stripe webhooks, `/verify` command
- **#7** — Transactional emails via Resend: welcome, upgrade, cancellation, merch, event, adventure, sponsor, contact
- **#8** — Member portal at `/portal`: tier display, $ROAD balance, Stripe Customer Portal link
- **#9** — Merch checkout: capture size in Stripe metadata, fulfillment email to Dalton
- **#10** — Legal: Incorporate Praetorian Holdings Corp. (SK) — tracked here for SR&ED hour logging
- **#11** — Agent: Sponsorship prospecting pipeline — 20 qualified prospects + email drafts

### 🟡 M2 — Web3 Architecture (May — design only, no mainnet)
- **#12** — $ROAD tokenomics spec locked + legal opinion documented
- **#13** — Off-chain $ROAD balance tracking in Vercel KV (web2 bridge)
- **#14** — Wallet connect polished: Phantom + Solflare devnet, register wallet → KV
- **#15** — Squads multisig: architecture spec + devnet deploy
- **#16** — DAO governance spec: Snapshot + Aragon, `/docs/governance-spec.md`
- **#17** — Founding NFT: Candy Machine v3 spec + art brief (500 supply, 3 SOL, soul-bound 12mo, undisclosed $ROAD airdrop at mainnet)

### 🟢 M3 — Adventure NFTs + DAO (June)
- **#18** — Adventure #001: Lake Trip (BC/AB, summer 2026, `/adventures/lake-trip`, $199 deposit)
- **#19** — Adventure #002: Ski Trip (Panorama or Whitefish, winter 2026/27, community vote, deposits open post-vote)
- **#20** — Adventure #003: Mediterranean (2027, Ranch Hand+ gated, $1,000 hold, $500 non-refundable within 14 days of event)
- **#21** — `/adventures` hub page: all three cards + philosophy + FAQ
- **#22** — Four guilds activated in Discord + `/guilds` page with live application links
- **#23** — Claude orchestrator agent: dispatches all agents, approval queue, daily Discord digest

### ⚙️ Infra (ongoing)
- **#24** — Vercel env audit: every secret populated + documented
- **#25** — GitHub Pages community dashboard: treasury + member count + $ROAD + guilds

---

## Membership Tiers + Discord Role Map

| Stripe Product | $ROAD/mo | Discord Env Var | Key Gate |
|---|---|---|---|
| Regular ($19.99/mo) | 100 | `DISCORD_ROLE_REGULAR` | Community chat |
| Ranch Hand ($99.99/mo) | 500 | `DISCORD_ROLE_RANCH_HAND` | Guild access + VOD |
| Partner ($199.98/mo) | 2,000 | `DISCORD_ROLE_PARTNER` | Leadership + group call (max 8) |
| Steward (invite-only) | 10,000 | Manual | Multisig co-signer |
| Praetor (invite-only) | 50,000 | Manual | Board advisory |

---

## Stripe Webhook Handler Contract

File: `/app/api/webhooks/stripe/route.ts`

```ts
// ALWAYS verify signature first — reject anything that fails
const sig = headers().get('stripe-signature')
const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)

// Handle these events — nothing else
switch (event.type) {
  case 'checkout.session.completed':     // membership → Discord role + welcome email
  case 'checkout.session.completed':     // merch → fulfillment email to Dalton
  case 'checkout.session.completed':     // adventure → confirmation + POAP queue
  case 'customer.subscription.updated':  // tier change → update Discord role
  case 'customer.subscription.deleted':  // cancel → revoke Discord role + offboarding email
  case 'invoice.payment_failed':         // → retry email with Customer Portal link
}

// Always return 200 to Stripe — never let errors propagate
// Log everything as structured JSON — never log full card data
// Idempotent — duplicate events must not double-fire
```

---

## $ROAD Off-Chain Balance (Web2 Bridge)

**DO NOT mint $ROAD yet.** Track balances in Vercel KV. Members who connect a wallet get snapshotted at mainnet launch and receive an airdrop.

```ts
// lib/road-balance.ts
interface RoadBalance {
  email: string
  stripeCustomerId: string
  walletAddress?: string        // registered pre-launch for airdrop
  balance: number               // total accrued $ROAD (off-chain)
  tier: 'guest' | 'regular' | 'ranch' | 'partner' | 'steward' | 'praetor'
  history: { date: string; amount: number; reason: string }[]
}

// Monthly accrual rates
const ACCRUAL = { regular: 100, ranch: 500, partner: 2000 }
```

---

## Founding NFT

- **Supply:** 500
- **Price:** 3 SOL
- **Soul-bound:** 12 months post-mint (non-transferable)
- **$ROAD airdrop:** Founding holders qualify for an undisclosed allocation at mainnet launch. Amount is not public. Will be announced at launch.
- **No CAD price shown on site** — SOL only
- **Revenue split:** 70% treasury · 20% operations · 10% founder

---

## Adventure NFTs

Three products. Real trips. On-chain credential + POAP on attendance.

| # | Experience | Season | Deposit | Refund Policy | Supply | Eligibility |
|---|---|---|---|---|---|---|
| 001 | Lake Trip — BC/AB | Summer 2026 | $199 CAD | Full refund 30+ days out | Group cap | All tiers |
| 002 | Ski Trip — Panorama or Whitefish | Winter 2026/27 | $299 CAD | Opens after Snapshot vote | Group cap | All tiers |
| 003 | Mediterranean | Summer 2027 | $1,000 CAD | $500 non-refundable within 14 days of event | ~25 (scarce) | Ranch Hand+ |

- NFTs are transferable — spot is the token, sell if you can't attend
- 5% royalty on secondary → community treasury
- Ski trip location decided by community Snapshot vote (Panorama vs Whitefish)
- Ski trip deposits gated behind `NEXT_PUBLIC_SKI_VOTE_RESOLVED=true`
- Mediterranean gated: require active Ranch Hand+ subscription at checkout

---

## Agent Architecture

```
OrchestratorAgent (Claude Sonnet — /agents/orchestrator.ts)
  ├── ContentAgent     — daily: 3 tweet drafts + 1 TikTok script
  ├── SponsorAgent     — weekly: 5 prospects + email drafts per tier
  ├── CommunityAgent   — on-event: Discord DMs + guild routing
  ├── TreasuryAgent    — monthly 1st: $ROAD accrual + Squads balance report
  └── AdventureAgent   — on-purchase: confirmation + trip brief + POAP queue

Trigger: GitHub Actions cron → POST /api/agents/run
Approval queue: /api/agents/status → simple admin page for Dalton
```

### Human-in-the-Loop Gates — NEVER auto-fire these:
- Posting to any social platform (X, TikTok, Kick)
- Sending outbound emails to external contacts
- Any Stripe action (charge, refund, subscription modify)
- Any on-chain transaction (transfer, mint, multisig)
- Discord #general or #announcements posts
- Any document signing or legal filing

---

## Four Guilds

| Guild | Domain | KPI | Discord Channel |
|---|---|---|---|
| Media Guild | Content, streaming, VOD, social | Monthly Reach | #media-guild |
| Builder Guild | Platform, tokenomics, on-chain infra | Uptime & DAU | #builder-guild |
| Frontier Guild | Events, compound, merch | Event Revenue | #frontier-guild |
| Venture Guild | Treasury, investments, grants | Portfolio IRR | #venture-guild |

Guild leads are elected annually. They become multisig co-signers (Squads 3-of-5).
Any Regular+ member can apply. Applications at `/guilds`.

---

## Canva Workspace (canva.com/folder/FAHEIwJ9L3A)

| Folder | Use For |
|---|---|
| 01 — Brand Identity | Logos, palettes, typography |
| 02 — Marketing & Social | Post templates, ad creative |
| 03 — Adventure NFTs | Lake/ski/med art + marketing |
| 04 — Sponsorship & Investor | Sponsor decks, investor memos |
| 05 — Legal & Compliance | Compliance docs, SR&ED, IRAP |
| 06 — Agent Outputs | Draft content, prospect lists, digests |
| 07 — Web3 & Tokenomics | Tokenomics visuals, NFT art briefs |

---

## Code Standards

- **TypeScript strict** — no `any`, no `ts-ignore` without comment
- **Never commit secrets** — all env vars via Vercel, never in code
- **API routes** — always return structured JSON, always handle errors, always log
- **Stripe** — always verify webhook signature, always return 200, always idempotent
- **Solana** — devnet only until mainnet is explicitly authorized by Dalton
- **No inline styles** — Tailwind classes only, brand tokens only
- **Mobile-first** — all new pages must be responsive before merging
- **No `console.log` in production** — use structured logging (`console.error` for errors only)

---

## Sponsorship Tiers

| Tier | Rate | Reach | Key Deliverable |
|---|---|---|---|
| Trail Blazer | $1,000 CAD/mo | ~5k/mo | Stream overlay + social shoutout + monthly analytics |
| Frontier | $2,500 CAD/mo | ~20k/mo | 5-min stream segment/week + 2x TikTok/mo + co-branded event |
| Praetor | $10,000 CAD/mo | ~100k+/mo | IP licensing + Summit presenting sponsor + custom series + monthly founder call |

Payment: Stripe or e-transfer. Contact: roadhousesyndicate@gmail.com

---

## Digital Products

| Product | Price | Description |
|---|---|---|
| Creator Playbook | $129.99 CAD | Stream-to-capital framework. PDF + Notion template pack. |
| Strategy Toolkit | $295.99 CAD | Canvases, calculators, scenario tools for creator economy operators. |

---

## Grant Targets (log R&D hours from day 1)

| Grant | Potential | Timeline |
|---|---|---|
| SR&ED | $40k–$80k | Annual with T2 |
| IRAP (NRC) | $50k–$100k | Rolling — pre-screen Q2 |
| SaskInnovates | $25k–$50k | Q3 2026 |
| Mitacs (U of S) | $15k–$40k | Q3 2026 |
| CMF Experimental | $100k–$500k | Q4 2026 |

**Log all agent development work with dates and hours — eligible SR&ED activity.**

---

## Contact

- Founder: Dalton Ellscheid — daltonellscheid@gmail.com
- Brand: roadhousesyndicate@gmail.com
- X: @dollywooddole
- Kick: kick.com/dollywooddole
- Discord: discord.gg/wwhhKcnQJ3
- Entity: Praetorian Holdings Corp. — Saskatchewan CCPC