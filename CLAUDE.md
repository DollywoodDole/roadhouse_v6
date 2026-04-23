# RoadHouse v6 — Claude Code Operating Instructions

> **Entity:** Praetorian Holdings Corp. · Saskatchewan CCPC · roadhouse.capital
> **Founder:** Dalton Ellscheid (DollywoodDole) · daltonellscheid@gmail.com
> **Repo:** github.com/DollywoodDole/roadhouse_v6
> **IP:** All IP owned by Praetorian Holdings Corp. Dalton holds permanent Class B voting control.

---

## MANDATE — priority order, do not invert

1. Web2 perfect — Stripe, Discord gating, email, member portal ✅ M1 complete
2. Web3 architecture — design only, no mainnet until legal locked ✅ M2 complete
3. Adventure NFTs + DAO — on-chain credentials, guilds, steward verification 🟢 M3 active
4. Claude agent team — orchestrator + specialists, human-gated outputs
5. RoadHouse Motors — dealer inventory platform (motors.roadhouse.capital) 🟢 active

---

## STACK

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router — `next dev --webpack` locally · **proxy.ts** (not middleware.ts) |
| Language | TypeScript strict |
| Styling | Tailwind (app pages) · CSS vars + inline styles (dashboard only — see BRAND) |
| Payments | Stripe — subscriptions, one-time, webhooks |
| Blockchain | Solana — `@solana/web3.js`, `@metaplex-foundation/umi`, `@solana/spl-token` |
| Wallet | Phantom + Solflare via `@solana/wallet-adapter-react` only |
| Email | Resend — from `hello@roadhouse.capital` |
| Discord | REST API bot — role gating by Stripe tier |
| Storage | Vercel KV (Upstash Redis) — off-chain $ROAD balances |
| Deploy | Vercel (iad1) · Domain: `https://roadhouse.capital` (canonical) |
| Ops layer | `roadhouse-ops/` — Google Sheets OS · clasp · googleapis · Apps Script |

---

## BRAND

**Voice:** Direct. Unfiltered. High-standard. No filler, no hype, no urgency tactics.
**Tagline:** "Where Standards Matter."

### App-wide Tailwind tokens (`tailwind.config.js`) — never hardcode hex in app pages
```ts
colors: {
  gold: { DEFAULT: '#C9922A', light: '#F0C060', dark: '#8B6318', pale: '#E8D5A0', muted: '#6B4E1A' },
  rh:   { black: '#0A0806', surface: '#111009', card: '#1A1712', elevated: '#242016',
          border: '#2A2318', text: '#E8DCC8', muted: '#8A7D6A', faint: '#4A4238' },
}
fonts: { cormorant: ['var(--font-cormorant)', 'Georgia', 'serif'], mono: ['var(--font-dm-mono)', 'Courier New', 'monospace'] }
```

### Dashboard design system (`RoadHouse.jsx` layer) — separate, do NOT merge into Tailwind
```css
/* Scoped to .rh-dash — use CSS vars, no hardcoded hex */
--bg: #0a0a08  --accent: #e8c84a  --accent2: #ff5c35  --accent3: #4af0c8

/* Inline hex established across dashboard components (consistent, acceptable): */
panel: #111110   border: #1e1e1c   warm: #ede8dc   muted: #5a5550   green: #4b7c50
```
Fonts: `Space Mono` (data/body) · `Bebas Neue` (headings) · `Syne` (category labels)
Rules: inline styles only in dashboard; no Tailwind; all three fonts must stay loaded; grain overlay preserved.

---

## FILE STRUCTURE — key files only

```
/app
  /api/webhooks/stripe/   ← sig-verified, always 200, idempotent
  /api/contact/           ← contact form → Resend
  /api/discord/           ← interactions/ · verify/ · assign-role/ · revoke-role/
  /api/road/              ← balance/ (GET) · accrue/ (POST, cron-authed)
  /api/wallet/register/   ← POST: wallet → KV
  /api/portal/session/    ← Stripe Customer Portal
  /api/agents/            ← run/ · status/
  /dashboard/page.tsx     ← mounts RoadHouseDashboard (noindex)
  /portal/page.tsx
  /compound/page.tsx      ← interest form → type='Compound — Waitlist Interest'
  /partners/page.tsx      ← TokenGated ranchHand+, href="/#membership"
  /adventures/            ← page.tsx · lake-trip/ · ski-trip/ · mediterranean/
  /dao/ · /guilds/

/components/dashboard/
  RoadHouseDashboard.jsx  ← mounted guard, wallet gate, header, mounts RoadHouse
  RoadHouse.jsx           ← 5-tab engine (MY ROADHOUSE · ECONOMY · DESCI · GUILD · TREASURY)

/components/wallet/
  TokenGate.tsx           ← tier gate; href? prop routes upgrade CTA cross-page

/lib/
  stripe.ts · membership.ts · discord.ts · email.ts · wallet.ts · road-token.ts
  road-balance.ts    ← KV $ROAD CRUD, normaliseTier(), ACCRUAL map
  profile.ts         ← getProfile(), updateProfile(), TIER_THRESHOLDS, TIER_DISPLAY, getNextTier()
  solana.ts          ← ROAD_MINT_PUBKEY, getTierFromBalance(), getConnection()
  treasury.ts · nft-mint.ts
  api/listings.ts · api/experiments.ts · api/bounties.ts · gnosis.ts

/docs/  stripe-products.md · tokenomics.md · governance-spec.md · multisig-spec.md
        founding-nft-spec.md · membership-model.md · guild-economy.md · compound-node-model.md

/roadhouse-ops/                  ← standalone ops layer — NOT part of Next.js app
  src/
    appsscript.json              ← V8 runtime, OAuth scopes, execution API
    Config.js                   ← SHEET/COL constants, getConfig() cache, tier helpers
    RoadHouseOS.js              ← 5 triggers: form sync · leaderboard · inactive alert · cap · $ROAD export
    WalletRegistry.js           ← wallet registration + duplicate detection (V2)
  scripts/
    bootstrap.js                ← 7-step idempotent orchestrator
    create-sheet.js             ← 6-tab spreadsheet + formula engine
    create-form.js              ← Google Form (7 fields)
    gauth.js                    ← OAuth2 desktop flow → token.json
    finalize.js                 ← member row, wallet columns, Config values
    distribute-road-tokens.js   ← Solana SPL distribution (V2 — requires ROAD_TOKEN_MINT)
    test-discord-webhook.js     ← smoke test leaderboard + alerts webhooks
  scoring.json                  ← output type multipliers, tier thresholds, bonus rules
  bootstrap.config.example.json ← copy → bootstrap.config.json, fill secrets
  docs/AUDIT.md                 ← post-build audit + gap analysis

  Key IDs (Praetorian account):
    Spreadsheet: 1AyMQbzOPHiceZEqjtZTlr8xnVgYCh2v-3E5SaA9cCHY
    Form:        1Gh3sBchYq7LHVYtKz1RCJxEuO7-d3hwguOLCR1QMMHE
    Script:      1DQauYe9yB-Z539gEITvBXV8sFVfOqxAZ2q1hz_CiizQTZqbjZtwpZY1T
    Drive folder: 1bMJUoKQ0GUL9XpgEpCi8DPAImND_dWik
```

**Nav rule:** No Nav.tsx / Header.tsx. Navigation = Sidebar.tsx only.
`/compound` and `/partners` in sidebar. `/partners` is sidebar-only (gated content).

### Motors subdomain (`motors.roadhouse.capital`)

```
/app/motors/
  layout.tsx              ← isolated layout — no Solana/wallet/RH Capital branding
  page.tsx                ← redirect → /motors/inventory
  /inventory/page.tsx     ← server component; auto-seeds KV on first load; filter via search params
  /vehicle/[vin]/page.tsx ← detail page; spec table, feature badges, Request Info CTA shell

/components/motors/
  VehicleCard.tsx         ← framer-motion entrance; Hero-backround.jpg bg; rh-logo watermark; status badge; CAD price
  InventoryGrid.tsx       ← 1/2/3 responsive grid; empty state
  FilterBar.tsx           ← client component; make/year/price/status filters → URL search params

/lib/motors/
  seed.ts                 ← 6 mock vehicles for O'Brian's Automotive Group (dealer_id: obrians)
  storage.ts              ← Upstash Redis CRUD: seedInventory, getInventory, getVehicleByVin, getInventoryCount

/types/inventory.ts       ← Vehicle interface + InventoryFilters interface

/app/api/motors/seed/
  route.ts                ← POST (Bearer CRON_SECRET) seed 6 vehicles; GET returns count
```

**Motors KV key pattern:**
```
motors:inventory:obrians:{vin}   → Vehicle JSON
motors:index:obrians             → Redis SET of VINs (index for efficient bulk reads)
```

**Motors constraints (permanent):**
- Zero $ROAD, Web3, Solana, or RoadHouse Capital branding on any motors page
- Dealer-facing only — O'Brian's Automotive Group identity
- subdomain isolated — no nav links from main roadhouse.capital site
- `proxy.ts` handles `motors.*` host rewrite → `/motors/*` before any auth logic
- All motors routes are FULLY_PUBLIC in proxy.ts

**Assets used:**
- Card/hero background: `/public/Hero-backround.jpg` (1200×1200 JPEG)
- Watermark: `/public/rh-logo.png` (852×295 RGBA PNG) — 30% opacity on cards, 25% on detail hero

---

## COMMANDS

```bash
npm run dev           # Next.js dev (webpack mode)
npm run build         # Production build
npm run lint          # ESLint
npm run mint-token    # Deploy $ROAD SPL (devnet)
npm run test-e2e      # Webhook + KV smoke test

# One-time: generate all Stripe price IDs
STRIPE_SECRET_KEY=sk_live_... npx ts-node --project tsconfig.scripts.json scripts/create-stripe-prices.ts

# Local webhook testing (CLI secret ≠ dashboard secret — 400 from stripe listen is expected)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### roadhouse-ops (cd roadhouse-ops first)

```bash
npm run auth          # OAuth2 desktop flow → token.json (re-run if scopes change)
npm run bootstrap     # Full 7-step idempotent setup (sheet → form → drive → script props)
npm run push          # clasp push → deploy Apps Script
npm run logs          # clasp logs --watch (live trigger logs)
npm test:webhook      # Smoke test Discord webhooks
npm run distribute    # Distribute $ROAD via Solana SPL (V2 — requires ROAD_TOKEN_MINT)
```

---

## ENV VARS — set in Vercel dashboard, never commit

```
# Web2 core
NEXT_PUBLIC_APP_URL
STRIPE_SECRET_KEY · NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY · STRIPE_WEBHOOK_SECRET
RESEND_API_KEY · FROM_EMAIL=hello@roadhouse.capital
DISCORD_BOT_TOKEN · DISCORD_GUILD_ID
DISCORD_ROLE_REGULAR · DISCORD_ROLE_RANCH_HAND · DISCORD_ROLE_PARTNER
DISCORD_PUBLIC_KEY · DISCORD_APP_ID
DISCORD_VERIFY_SECRET · DISCORD_ADMIN_SECRET
CRON_SECRET

# Stripe price IDs (run scripts/create-stripe-prices.ts once to generate)
NEXT_PUBLIC_STRIPE_SUB_REGULAR          # $19.99/mo CAD
NEXT_PUBLIC_STRIPE_SUB_RANCH            # $99.99/mo CAD
NEXT_PUBLIC_STRIPE_SUB_PARTNER          # $199.98/mo CAD
NEXT_PUBLIC_STRIPE_PRICE_TEE · HAT · HOODIE · STICKERS · GLASS · PHONE
NEXT_PUBLIC_STRIPE_PRICE_PLAYBOOK       # $129.99 CAD
NEXT_PUBLIC_STRIPE_PRICE_TOOLKIT        # $295.99 CAD
NEXT_PUBLIC_STRIPE_PRICE_SKMT           # $999 CAD
NEXT_PUBLIC_STRIPE_PRICE_SUMMIT         # $1,599 CAD
NEXT_PUBLIC_STRIPE_PRICE_SUMMIT_VIP     # $299 CAD
NEXT_PUBLIC_STRIPE_PRICE_ADV_LAKE       # $199 CAD
NEXT_PUBLIC_STRIPE_PRICE_ADV_SKI        # $299 CAD (opens after Snapshot vote)
NEXT_PUBLIC_STRIPE_PRICE_ADV_MED        # $1,000 CAD ($500 non-refundable <14 days)
NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_TB     # $1,000/mo CAD
NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_FR     # $2,500/mo CAD
NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_PR     # $10,000/mo CAD

# Feature flags
NEXT_PUBLIC_SKI_VOTE_RESOLVED=false     # true after Snapshot vote to open ski deposits

# Agents
ANTHROPIC_API_KEY

# Web3 (set at devnet deploy — not yet active)
NEXT_PUBLIC_SOLANA_NETWORK=devnet · NEXT_PUBLIC_SOLANA_RPC
NEXT_PUBLIC_ROAD_MINT_ADDRESS
NEXT_PUBLIC_NFT_FOUNDING_COLLECTION · REGULAR · RANCH · PARTNER
NEXT_PUBLIC_TREASURY_WALLET · NEXT_PUBLIC_MULTISIG_WALLET
```

---

## MEMBERSHIP TIERS

| Tier | Price | $ROAD/mo | Discord Env Var | Gate |
|---|---|---|---|---|
| Regular | $19.99/mo CAD | 100 | `DISCORD_ROLE_REGULAR` | Community chat |
| Ranch Hand | $99.99/mo CAD | 500 | `DISCORD_ROLE_RANCH_HAND` | Guild + VOD |
| Partner | $199.98/mo CAD | 2,000 | `DISCORD_ROLE_PARTNER` | Leadership + group call (max 8) |
| Steward | Invite-only | 10,000 | Manual | Multisig co-signer |
| Praetor | Invite-only | 50,000 | Manual | Board advisory |

**Tier thresholds — do not change without founder approval. Calibrated for 100M fixed supply.**

| Guest | Regular | Ranch Hand | Partner | Steward | Praetor |
|---|---|---|---|---|---|
| 0 | 100 | 500 | 2,000 | 10,000 | 50,000 |

**Tier format:** canonical string `'ranch-hand'` everywhere. `lib/solana.ts` returns `'ranchHand'` (devnet only); `normaliseTier()` in `lib/road-balance.ts` maps all variants → `'ranch-hand'`.

---

## $ROAD TOKEN

- **Standard:** Solana SPL · **Supply:** FIXED 100,000,000 (100M) — never inflationary · mint pubkey: TBD at deploy
- **Utility only:** membership gating, governance (advisory), contributor rewards, staking multiplier (1.2x at 90 days). NOT a security — no APY, no profit expectation.
- **DO NOT mint yet** — track in Vercel KV. Wallet snapshot at mainnet launch. $LUX fully deprecated.
- **Allocation:** Founder 18% (4yr/1yr cliff) · Creator 22% · Community 25% · Treasury 25% · Partners 10%
- **Emission:** Regular 100/mo · Ranch Hand 500/mo · Partner 2,000/mo. Burns: 3% NFT royalties + 2% event revenue → quarterly. Activity-driven, not scheduled.
- **Community bucket:** 25M $ROAD. Accruals pause (not clawed back) if zero. 30-day public notice required before depletion.
- **Pre-mainnet required:** `lib/road-monitor.ts` — bucket balance, months to depletion, notification trigger.
- **Securities rule:** Never connect SOL/CAD payment to specific $ROAD amount. See `docs/membership-model.md`.

---

## KV SCHEMA

| Key | Value | Purpose |
|---|---|---|
| `road:{customerId}` | `RoadBalance` JSON | balance, tier, alias, bio, avatarUrl, contributions[], experimentsJoined, currentStreak |
| `wallet:{address}` | string (customerId) | Reverse index: wallet → Stripe customer |
| `listings:offering` | `Listing[]` | Marketplace offering posts |
| `listings:seeking` | `Listing[]` | Marketplace seeking posts |
| `experiment:active` | `ExperimentEntry` | Current DeSci protocol |
| `experiment:log:{publicKey}` | `DailyEntry[]` | Member daily submissions |
| `experiment:aggregate` | `AggregateStats` | Cross-member energy/sleep averages |
| `bounties:active` | `Bounty[]` | Open guild bounties |
| `bounties:claimed:{publicKey}` | `ClaimedBounty[]` | Member claimed bounties + status |
| `treasury:snapshot` | `TreasurySnapshot` | DAO balances (5-min TTL cache) |
| `treasury:votes` | `GovernanceVote[]` | Snapshot proposals |
| `missions:{customerId}` | `Mission[]` | Daily missions (M3 — placeholder, not yet active) |

---

## DASHBOARD — component tree + tab map

```
RoadHouseDashboard.jsx
  MemberGate → ConnectPrompt
    Primary CTA: "Join RoadHouse →" → /#membership (click 1) → tier → Stripe (click 2)
    Secondary CTA: "Connect Wallet" (existing members)
  DashboardHeader (wordmark = <a href="/">)
  RoadHouse.jsx
    MY ROADHOUSE  → MemberProfileCard · DailyMissions · tier status · edit profile · contribution feed
    ECONOMY       → listings:offering + listings:seeking
    DESCI         → experiment:active + experiment:log + experiment:aggregate
    GUILD         → bounties:active + bounties:claimed · week indicator · milestone timeline
    TREASURY      → treasury:snapshot + treasury:votes · reinvestment split
```

**Dashboard-only components (RoadHouse.jsx):**
`ProfileXPBar` · `ProfileStatBar` · `MemberProfileCard` · `DailyMissions` · `Card` · `Label` · `SectionHead` · `Divider`

**Current state:** `memberTier` hardcoded `'founding'` in RoadHouseDashboard.jsx — M3: replace with `getTierFromBalance()` via on-chain SPL balance.

---

## ADVENTURES

| # | Trip | Season | Deposit | Refund | Supply | Gate |
|---|---|---|---|---|---|---|
| 001 | Lake Trip — BC/AB | Summer 2026 | $199 CAD | Full 30+ days out | Group cap | All |
| 002 | Ski Trip — Panorama/Whitefish | Winter 2026/27 | $299 CAD | Post Snapshot vote | Group cap | All |
| 003 | Mediterranean | Summer 2027 | $1,000 CAD | $500 non-refundable <14 days | ~25 | Ranch Hand+ |

- NFTs transferable; 5% secondary royalty → treasury
- Ski: `NEXT_PUBLIC_SKI_VOTE_RESOLVED=true` to open deposits after vote
- Med: require active Ranch Hand+ at checkout

---

## AGENTS

```
OrchestratorAgent (Claude Sonnet — /agents/orchestrator.ts)
  ContentAgent    — daily: tweet drafts + TikTok scripts
  SponsorAgent    — weekly: prospects + email drafts per tier
  CommunityAgent  — on-event: Discord DMs + guild routing
  TreasuryAgent   — monthly 1st: $ROAD accrual + Squads balance report
  AdventureAgent  — on-purchase: confirmation + POAP queue

Trigger: GitHub Actions cron → POST /api/agents/run (CRON_SECRET)
Approval queue: /api/agents/status
```

**NEVER auto-fire:** social posts · outbound email · any Stripe action · any on-chain tx · Discord announcements · legal filings

---

## GUILDS

| Guild | Domain | KPI | Channel |
|---|---|---|---|
| Media | Content, streaming, VOD, social | Monthly Reach | #media-guild |
| Builder | Platform, tokenomics, on-chain infra | Uptime & DAU | #builder-guild |
| Frontier | Events, compound, merch | Event Revenue | #frontier-guild |
| Venture | Treasury, investments, grants | Portfolio IRR | #venture-guild |

Guild leads elected annually → Squads multisig co-signers (3-of-5). Regular+ can apply at `/guilds`.

---

## FOUNDING NFT

- Supply 500 · Price 3 SOL (acceleration mechanism, not primary narrative). No CAD price on site.
- Framing: "Qualify, don't buy." Never lead with price. Never link SOL payment to specific $ROAD amount.
- Qualification (any one): Ranch Hand organically · first compound event · 30-day DeSci sprint · first 500 wallets
- Soul-bound 12 months. Revenue: 70% treasury / 20% operations / 10% founder.
- Spec: `docs/founding-nft-spec.md` (Candy Machine v3, 5 variants × 100, pNFT soul-bind)

---

## SPONSORSHIP

| Tier | Rate | Reach | Deliverable |
|---|---|---|---|
| Trail Blazer | $1,000/mo CAD | ~5k | Stream overlay + shoutout + analytics |
| Frontier | $2,500/mo CAD | ~20k | 5-min segment/wk + 2x TikTok/mo + co-branded event |
| Praetor | $10,000/mo CAD | ~100k+ | IP licensing + Summit sponsor + custom series + founder call |

---

## GRANTS — log R&D hours from day 1 (SR&ED eligible)

| Grant | Potential | Timeline | Frame as |
|---|---|---|---|
| SR&ED | $40k–$80k | Annual T2 | DeSci experiments, platform R&D |
| IRAP | $50k–$100k | Rolling Q2 | Platform development infra |
| SaskInnovates | $25k–$50k | Q3 2026 | Regional community infra |
| Mitacs | $15k–$40k | Q3 2026 | Applied research partnership |
| CMF Experimental | $100k–$500k | Q4 2026 | Media layer |

**Funded framing:** "Saskatchewan-based applied research community with a digital coordination layer."
**Never mention in grant apps:** tokens, $ROAD, DAO, membership tiers. See `docs/membership-model.md` §Grant Separation Principle.

---

## IP + GOVERNANCE RULES — non-negotiable

- All IP owned by Praetorian Holdings Corp. Never suggest transfers to DAO/token holders/community structures.
- $ROAD is utility/governance only. No APY, no yield, no investment framing anywhere in code, UI, or docs.
- Founder authority is permanent. Do not architect governance flows that dilute Class B voting control.
- DeSci and Internal Economy are additive layers. Extend, never replace existing v6 components.

---

## WEB3 CONSTRAINTS

- Solana only — no EVM, no Ethereum, no Polygon, no L2s
- SPL for all fungible tokens (`$ROAD`); Metaplex + Candy Machine for all NFTs
- Phantom + Solflare only (`@solana/wallet-adapter-react`) — no other adapters
- Squads v4 for multisig (Solana-native, not Gnosis Safe)
- Devnet only until Dalton explicitly authorizes mainnet in writing

---

## CODE STANDARDS

- TypeScript strict — no `any`, no `ts-ignore` without comment
- Tier string: `'ranch-hand'` canonical in Stripe/Discord/KV code (see MEMBERSHIP TIERS)
- No inline styles in app pages — Tailwind tokens only. Dashboard layer exception: CSS vars + established inline hex.
- Mobile-first — responsive before merge
- No `console.log` in production — structured JSON; `console.error` for errors only
- API routes: structured JSON, handle errors, log, return 200 from Stripe webhook
- Stripe: verify signature first, always 200, always idempotent
- `crypto.randomUUID()` — call inside functions only, never at module level in client-bundled files.
  Use `globalThis.crypto.randomUUID()` in any lib file importable client-side.
  Reason: `crypto-browserify` (Next.js client polyfill) does not export `randomUUID` → silent blank screen.
  Fixed in: `lib/gnosis.ts` · `lib/api/listings.ts` · `lib/api/experiments.ts` · `lib/api/bounties.ts`
- Sidebar `backdrop-filter`: `overflow-x: hidden` must be on `<html>`, not `<body>`. Body overflow breaks
  compositing layer for `position: fixed` children in Chrome/Safari, silently disabling blur.

---

## M2 COMPLETE — 2026-03-27

Dashboard reworked: 6 static tabs → 5 functional tabs with live KV wiring.
New pages: `/compound` · `/partners`. Sidebar glassmorphism. WalletStatus glass treatment.
Docs delivered: `governance-spec.md` · `multisig-spec.md` · `founding-nft-spec.md`.
Infra confirmed: domain live · all env vars set · Stripe webhook e2e · Discord interactions endpoint.

## ROADHOUSE OS — 2026-03-31

Ops layer bootstrapped: `roadhouse-ops/` standalone toolchain — Google Sheets OS (6 tabs + formula engine), Google Form (7 fields, linked to Outputs_RAW), 5 Apps Script triggers deployed, Discord webhooks live (#roadhouse-lounge leaderboard + #backroom-brass alerts), wallet registry wired. Score multipliers in `scoring.json`. Admin in `roadhousesyndicate@gmail.com`.

---

## M3 TODO — June 2026 (priority order)

**Keystone: nothing ships until steward verification works.**
Dependency chain: steward verification → $ROAD release → contribution record → tier advancement → NFT qualification → grant auditability. See `docs/guild-economy.md`.

1. **Steward verification** — `claimBounty()`: auth steward wallet (≥10k $ROAD), write approval + timestamp to contribution record, trigger $ROAD release from treasury PDA, emit tx hash, mark bounty verified
2. **On-chain $ROAD balance** — `lib/solana.ts`: `getTokenAccountsByOwner()` in `getProfile()`, replace KV fallback
3. **Live tier derivation** — `RoadHouseDashboard.jsx`: replace hardcoded `'founding'` with `getTierFromBalance(balance)`
4. **Squads integration** — `lib/squads.ts` (create): `proposeTreasuryTransfer()`, `approveTransaction()`, `executeTransaction()` — replaces stubs in `lib/treasury.ts`
5. **Metaplex NFT** — `lib/metaplex.ts` (create): `mintFoundingNFT()`, `verifyFoundingNFTOwnership()`, `getAssetsByOwner()`
6. **Road monitor** — `lib/road-monitor.ts` (create): community bucket balance, months to depletion, 30-day notification trigger
7. **Public profile** — `/profile/[wallet]` page — visible to other members
8. **Wallet orphan cleanup** — `registerWallet()`: delete `wallet:{prev}` before writing new reverse index
9. **Listings auth** — `createListing()`: verify wallet matches + tier check; pagination + `createdAt desc` sort
10. **DeSci cross-member** — `submitDailyEntry()`: aggregate across `experiment:log:*` keys; admin route for new experiments
11. **Guild admin** — admin route to post new bounties per guild
12. **Treasury wiring** — `getTreasurySnapshot()` → Squads SPL + SOL balance; `getGovernanceVotes()` → Snapshot.org GraphQL
13. **Devnet deploys** — Candy Machine (founding NFT) · Squads multisig · Snapshot space + Aragon DAO
14. **GitHub Pages dashboard** — public: treasury + member count + $ROAD + guilds
15. **Missions KV** — wire `missions:{customerId}`; reset timer from KV TTL; streak from `road:{customerId}.streak`

---

## CONTACT

- Founder: Dalton Ellscheid — daltonellscheid@gmail.com
- Brand: roadhousesyndicate@gmail.com · X: @dollywooddole · Kick: kick.com/dollywooddole
- Discord: discord.gg/wwhhKcnQJ3
- Entity: Praetorian Holdings Corp. — Saskatchewan CCPC
