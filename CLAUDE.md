# RoadHouse v6 — Claude Code Operating Instructions

> Praetorian Holdings Corp. · Saskatchewan, Canada · roadhouse.capital
> Founder: Dalton Ellscheid (DollywoodDole) · daltonellscheid@gmail.com
> Repo: github.com/DollywoodDole/roadhouse_v6
> Entity note: Praetorian Holdings Corp. owns all IP. Dalton Ellscheid holds permanent Class B voting control.

---

## What This Project Is

RoadHouse is a creator-owned ecosystem converting streaming attention into community capital and investable IP. The stack is Next.js 16 + Solana SPL + Stripe + Vercel. The site is live at roadhouse.capital.

Two additive layers sit on top of the core platform:
- **Internal Economy (DeSci-adjacent)** — closed-loop economy where member activity generates $ROAD, which gates access, guild roles, and governance weight. Not speculative; utility/governance only.
- **DeSci / Living Laboratory** — RoadHouse as a decentralized science testbed: community-directed research mandates, on-chain data provenance, and reproducible outcomes funded by the treasury.

Both layers are **additive** — they extend the platform without replacing any existing v6 components.

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

### Dashboard / Standalone Component Design System (RoadHouse.jsx layer)

When working on the `RoadHouse.jsx` dashboard component or any UI derived from it, use this design system — it is separate from the Tailwind token system above and must not be merged into it:

```css
/* CSS variables — do not inline hex values */
--bg:      #0a0a08   /* near-black background */
--accent:  #e8c84a   /* gold */
--accent2: #ff5c35   /* red */
--accent3: #4af0c8   /* teal */

/* Fonts — all three must be loaded */
Space Mono     /* body / data / mono */
Bebas Neue     /* display headings */
Syne           /* sub-headings / labels */
```

Rules for this layer:
- Preserve the grain texture overlay on all dashboard UI.
- Use CSS variables (`var(--accent)` etc.), never hardcode hex values.
- All three fonts must remain loaded and applied per their roles above.
- Do not backport these tokens into `tailwind.config.js` — the two systems coexist independently.

---

## File Structure

```
/app
  /api
    /webhooks/stripe/route.ts   ← Stripe webhook handler (signature verified)
    /contact/route.ts           ← Contact form → Resend
    /discord/interactions/      ← POST: Ed25519-verified Discord slash commands (/verify)
    /discord/verify/            ← GET/POST: magic link flow → Stripe lookup → role grant
    /discord/assign-role/       ← POST: admin endpoint — assign Discord role manually
    /discord/revoke-role/       ← POST: admin endpoint — revoke Discord role manually
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
/.github
  /workflows
    ci.yml                   ← Lint + build + Vercel deploy on push to main
    road-accrual.yml         ← Monthly $ROAD accrual cron (1st of month, 00:00 UTC)

/scripts
  create-stripe-prices.ts       ← Run once to generate all Stripe price IDs
  mint-road-token.ts            ← npm run mint-token
  add-road-metadata.ts          ← npm run add-metadata
  register-discord-commands.ts  ← npm run register-commands (run once)
  test-e2e.ts                   ← npm run test-e2e — full webhook + KV smoke test

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

### Discord + Cron:
```
DISCORD_PUBLIC_KEY        # From Discord Developer Portal → App → General Information
DISCORD_APP_ID            # From Discord Developer Portal → App → General Information
DISCORD_BOT_TOKEN         # Bot token — not the public key
DISCORD_VERIFY_SECRET     # Random secret for /verify magic link tokens — openssl rand -base64 32
DISCORD_ADMIN_SECRET      # Protects /api/discord/assign-role and /api/discord/revoke-role
CRON_SECRET               # Authenticates POST /api/road/accrue from GitHub Actions cron
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

### ✅ HOTFIX — Complete
- ✅ **#1** — `{siteConfig.contactEmail}` / `{siteConfig.founderEmail}` raw text in DOM — fixed
- ✅ **#2** — Founding NFT section dev placeholder — replaced with pre-launch waitlist CTA
- ✅ **#3** — Contact form POST endpoint — `/app/api/contact/route.ts` built (Resend, auto-reply, rate limit, honeypot)

### ✅ M1 — Web2 Perfect (April)
- ✅ **#4** — Create all Stripe products + populate all price ID env vars (run `scripts/create-stripe-prices.ts`)
- ✅ **#5** — Stripe webhook handler: all lifecycle events (sub created/updated/deleted, payment failed, checkout completed)
- ✅ **#6** — Discord bot: assign/revoke roles via Stripe webhooks, `/verify` command
  - ⚠️ Still required in Vercel: `DISCORD_PUBLIC_KEY`, `DISCORD_APP_ID`, `DISCORD_BOT_TOKEN`, `DISCORD_VERIFY_SECRET`, `DISCORD_ADMIN_SECRET`
  - ⚠️ Run once after setting those vars: `npm run register-commands` (registers `/verify` slash command)
  - ⚠️ Set Interactions Endpoint URL in Discord Developer Portal: `https://roadhouse.capital/api/discord/interactions`
- ✅ **#7** — Transactional emails via Resend: welcome, upgrade, cancellation, merch, event, adventure, sponsor, contact
- ✅ **#8** — Member portal at `/portal`: tier display, $ROAD balance, Stripe Customer Portal link
- ✅ **#9** — Merch checkout: capture size in Stripe metadata, fulfillment email to Dalton
- **#10** — Legal: Incorporate Praetorian Holdings Corp. (SK) — tracked here for SR&ED hour logging
- **#11** — Agent: Sponsorship prospecting pipeline — 20 qualified prospects + email drafts

### 🟡 M2 — Web3 Architecture (May — design only, no mainnet)
- **#12** — $ROAD tokenomics spec locked + legal opinion documented
- ✅ **#13** — Off-chain $ROAD balance tracking in Vercel KV (web2 bridge)
- ✅ **#14** — Wallet connect polished: Phantom + Solflare devnet, register wallet → KV
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

## $ROAD Token

- **Standard:** Solana SPL
- **Total Supply:** FIXED at 100,000,000 (100M) — NOT 1B, never inflationary
- **Why 100M:** Preserves tier exclusivity at scale. Praetor (50k tokens) = 0.05%
  of supply — meaningful and scarce. At 1B this collapses to 0.005%.
- **Allocation:**
  - Founder 18% (18M, 4yr vest 1yr cliff)
  - Creator 22% (22M merit-based)
  - Community 25% (25M earned via accrual)
  - Treasury 25% (25M DAO-controlled)
  - Partners 10% (10M vested)
- **Burn:** 3% NFT royalties + 2% event ticket revenue → quarterly burn.
  Utility-triggered, not scheduled. No fixed burn % ever communicated publicly.
- **Utility only:** membership gating, governance voting (advisory scope only),
  contributor rewards, staking multiplier (1.2x at 90 days)
- **NOT a security** — no APY, no profit expectation, no equity, no inflation
- **Mint pubkey:** [TO BE ADDED at deployment]
- **$LUX is fully deprecated** — use $ROAD in all references, code, and docs
- **DO NOT mint yet** — track balances in Vercel KV; wallet snapshot at mainnet launch

---

## Tier Thresholds (do not change without founder approval)

| Tier | $ROAD Required |
|---|---|
| Guest | 0 |
| Regular | 100 |
| Ranch Hand | 500 |
| Partner | 2,000 |
| Steward | 10,000 |
| Praetor | 50,000 |

These thresholds are calibrated for 100M fixed supply. Changing supply requires
re-validating all thresholds before any contract or UI update.

---

## MemberGate Tier Logic (pending implementation)

- `lib/solana.ts` → `ROAD_MINT_PUBKEY`, `getTierFromBalance`, `getConnection`
- `RoadHouseDashboard.jsx` → replace hardcoded `"founding"` with live balance fetch
- Trigger: `publicKey` available after Phantom connect
- Burn logic: `lib/burn.ts` → `burnFromRoyalties()`, `burnFromEvents()` — build at
  NFT launch, not before

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

## IP, Governance, and Token Rules — Non-Negotiable

- **Never suggest changes that transfer IP or equity to DAO participants, token holders, or any community structure.** All IP is owned by Praetorian Holdings Corp. This is a hard line — do not soften it in code comments, UI copy, or docs.
- **$ROAD is utility/governance only.** Never add speculative financial language, yield promises, investment framing, or securities-adjacent claims to $ROAD descriptions anywhere in the codebase, docs, or UI.
- **Founder authority is permanent.** Dalton Ellscheid holds Class B voting control. Do not architect governance flows that could dilute or override this.
- **DeSci and Internal Economy layers are additive.** Do not refactor existing v6 components to accommodate them unless Dalton explicitly asks. Extend, never replace.

---

## Web3 Constraints

- **Solana only** — no EVM, no Ethereum, no Polygon, no L2s.
- **SPL standard** for all fungible tokens ($ROAD).
- **Metaplex** for all NFT minting, metadata, and Candy Machine flows.
- **Phantom + Solflare** via `@solana/wallet-adapter-react` — no other wallet adapters.
- **Devnet only** until Dalton explicitly authorizes mainnet deployment in writing.

---

## Code Standards

- **TypeScript strict** — no `any`, no `ts-ignore` without comment
- **Never commit secrets** — all env vars via Vercel, never in code
- **API routes** — always return structured JSON, always handle errors, always log
- **Stripe** — always verify webhook signature, always return 200, always idempotent
- **Solana** — devnet only until mainnet is explicitly authorized by Dalton
- **No inline styles** — Tailwind classes only, brand tokens only (exception: `RoadHouse.jsx` layer uses CSS variables — see Dashboard Design System above)
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

---

## M2 Sprint — Dashboard Activation

Sprint window: Late March → End of April 2026
Status: In progress — pick up across sessions, consolidate end of April

### Problem Statement

Current dashboard (`components/dashboard/RoadHouse.jsx`) was read-only
strategy content behind a member gate. 6 static tabs. Churn risk.
M2 rework complete: 6 brochure tabs → 5 functional member tabs.

### M2 Tab Architecture (post-rework)

- **MY ROADHOUSE:** tier status, contribution feed, next action prompt, treasury pulse
- **ECONOMY:** member marketplace — Offering / Seeking listings board
- **DESCI:** active experiment card, data submission, upcoming protocols
- **GUILD:** live week indicator, bounty board, execution timeline
- **TREASURY:** DAO balance, active votes, reinvestment split

### Remaining M2 Build Items (additive — do not touch reworked tabs)

1. **MY ROADHOUSE — wire $ROAD balance**
   File: `components/dashboard/RoadHouse.jsx` (MY ROADHOUSE tab)
   Source: `lib/solana.ts` `getTierFromBalance` (exists, needs calling)

2. **Economy — wire listings board**
   File: `components/dashboard/economy/ListingsBoard.tsx` (create)
   Source: `lib/api/listings.ts` (does not exist yet)

3. **DeSci — wire experiment data**
   File: `components/dashboard/desci/ExperimentCard.tsx` (create)
   Source: `lib/api/experiments.ts` (does not exist yet)

4. **Guild — live week indicator is live** (Date.now() calc)
   Bounty claiming: `lib/api/bounties.ts` (does not exist yet)

5. **Treasury — wire Gnosis Safe**
   Source: `lib/gnosis.ts` (does not exist yet)

### Build Rules for Remaining M2 Sessions

- Each session: ONE feature. Build, confirm renders, commit.
- All new data hardcoded with `// TODO` comments referencing data source
- Design system: inherit `RoadHouse.jsx` CSS variables exactly, no new vars
- No new dependencies without checking `package.json` first

### What NOT to Build in M2

- On-chain settlement for listings (M3)
- Real $ROAD balance fetch (M3 — after `lib/solana.ts` tier logic complete)
- Experiment data persistence (M3)
- Gnosis Safe live treasury (M3)
- Any changes to MemberGate or wallet connection logic

### Open Flags (do not fix in M2)

- `lib/solana.ts` `totalSupply` — **already fixed to `100_000_000`** (commit `6cb817d`)
- roadhouse.capital live site $ROAD section shows 1B — manual copy update needed
- Entity name inconsistency: "Corp." on live site vs "Ltd." in strategy doc

### End of April

Full M2 review. Update this section with what shipped. Begin M3 planning:
- Real $ROAD balance → tier enforcement
- Listings persistence
- Experiment data layer
- Gnosis Safe integration