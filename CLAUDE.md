# RoadHouse v6 — Claude Code Operating Instructions

> **Entity:** Praetorian Holdings Corp. · Saskatchewan CCPC · roadhouse.capital
> **Founder:** Dalton Ellscheid (DollywoodDole) · daltonellscheid@gmail.com
> **Repo:** github.com/DollywoodDole/roadhouse_v6
> **IP:** All IP owned by Praetorian Holdings Corp. Dalton holds permanent Class B voting control.

---

## ECOSYSTEM

| Subdomain | Purpose | Status |
|---|---|---|
| `roadhouse.capital` | Member platform — auth, dashboard, adventures, DAO | Live |
| `motors.roadhouse.capital` | White-label dealer inventory — O'Brian's Auto | Live |
| `studio.roadhouse.capital` | Creative + build arm — client work + house IP | Live (scaffold) |
| `faber.roadhouse.capital` | Future branch — TBD | Planned |

**Subdomain routing:** all handled in `proxy.ts` (not middleware.ts). Each subdomain rewrites to its `/app/{name}/` directory before auth logic runs. See PROXY.TS section.

Each arm has its own CLAUDE.md:
- `app/motors/CLAUDE.md` — motors routes, components, KV keys, sync, constraints
- `app/studio/CLAUDE.md` — studio components, design system, animation system
- `ops/motors-social/CLAUDE.md` — Python social automation, CLI args, GitHub Actions
- `ops/google-sheets/CLAUDE.md` — Apps Script OS layer, clasp, npm scripts

---

## MANDATE — priority order, do not invert

1. Web2 perfect — Stripe, Discord gating, email, member portal ✅ M1 complete
2. Web3 architecture — design only, no mainnet until legal locked ✅ M2 complete
3. Adventure NFTs + DAO — on-chain credentials, guilds, steward verification 🟢 M3 active
4. Claude agent team — orchestrator + specialists, human-gated outputs
5. RoadHouse Motors — dealer inventory platform (motors.roadhouse.capital) 🟢 active
6. RoadHouse Studio — creative arm subdomain (studio.roadhouse.capital) 🟢 scaffolded

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
| Ops layer | `ops/google-sheets/` — Google Sheets OS · clasp · googleapis · Apps Script |
| Social | `ops/motors-social/` — Python · Claude API · Meta Graph API · ffmpeg |

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

**Root layout fonts:** Loaded via `<link>` Google Fonts CDN tag in `app/layout.tsx` (Cormorant Garamond, DM Mono, Roboto) — NOT via next/font. Root layout wraps all children in `SolanaWalletProvider`. `<body className="grain">`.

### Dashboard design system (`RoadHouse.jsx` layer) — separate, do NOT merge into Tailwind
```css
/* Scoped to .rh-dash — use CSS vars, no hardcoded hex */
--bg: #0a0a08  --accent: #e8c84a  --accent2: #ff5c35  --accent3: #4af0c8

/* Inline hex established across dashboard components (consistent, acceptable): */
panel: #111110   border: #1e1e1c   warm: #ede8dc   muted: #5a5550   green: #4b7c50
```
Fonts: `Space Mono` (data/body) · `Bebas Neue` (headings) · `DM Mono` (labels 8–11px)
Rules: inline styles only in dashboard; no Tailwind; all three fonts must stay loaded; grain overlay preserved.

---

## FILE STRUCTURE — main app + shared lib

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
  RoadHouse.jsx           ← page-based engine (HOME · EARN · COMMUNITY · TREASURY)

/components/wallet/
  TokenGate.tsx           ← tier gate; href? prop routes upgrade CTA cross-page

/lib/
  stripe.ts               ← lazy Stripe singleton; APP_URL from NEXT_PUBLIC_APP_URL; API version 2023-10-16
  membership.ts           ← getMembershipTier(), getProductType(), TIER_META
                             product types: membership/merch/digital/event/adventure/sponsorship
  discord.ts · email.ts · wallet.ts · road-token.ts
  road-balance.ts         ← KV $ROAD CRUD; normaliseTier(); ACCRUAL map; COMMUNITY_CAP_KEY='road:community-bucket'
                             registerWallet() includes orphan cleanup (deletes stale reverse index)
  profile.ts              ← getProfile(), updateProfile(), TIER_THRESHOLDS, TIER_DISPLAY, getNextTier()
                             MemberProfile type; MemberTier defined inline (avoids circular import with road-balance.ts)
  solana.ts               ← ROAD_MINT_PUBKEY, getTierFromBalance(), getConnection() (lazy, browser-only)
                             returns 'ranchHand' (camelCase) — normaliseTier() maps → 'ranch-hand'
  wallet-session.ts       ← verifyWalletSession() — JWT verify with NEXTAUTH_SECRET
                             returns { publicKey, customerId, isMember, tier, provider: 'wallet' }
  treasury.ts · nft-mint.ts
  api/listings.ts · api/experiments.ts · api/bounties.ts · gnosis.ts

/docs/  stripe-products.md · tokenomics.md · governance-spec.md · multisig-spec.md
        founding-nft-spec.md · membership-model.md · guild-economy.md · compound-node-model.md
```

**Nav rule:** No Nav.tsx / Header.tsx. Navigation = Sidebar.tsx only.
`/compound` and `/partners` in sidebar. `/partners` is sidebar-only (gated content).

---

## PROXY.TS — subdomain routing

`proxy.ts` is the middleware (exported from `middleware.ts` which re-exports it). Order matters:

1. `host.startsWith('motors.')` → rewrite `/motors/*`; passthrough if already prefixed
2. `host.startsWith('studio.')` → rewrite `/studio/*`; passthrough if already prefixed
3. Static file fast path
4. `FULLY_PUBLIC` array → immediate passthrough (includes `/motors`, `/studio`, all API routes)
5. Session resolution — JWT cookie: `rh-wallet-session`; secret: `NEXTAUTH_SECRET`
6. `SESSION_OPTIONAL` (`/` and `/partners`) → resolve session, set headers, never redirect
7. Auth gate → redirect `/login?from=...`
8. `/dashboard` → additionally requires `isMember`

---

## COMMANDS

```bash
npm run dev           # Next.js dev (webpack mode)
npm run build         # Production build
npm run mint-token    # Deploy $ROAD SPL (devnet)
npm run test-e2e      # Webhook + KV smoke test

# One-time: generate all Stripe price IDs
STRIPE_SECRET_KEY=sk_live_... npx ts-node --project tsconfig.scripts.json scripts/create-stripe-prices.ts

# Local webhook testing (CLI secret != dashboard secret — 400 from stripe listen is expected)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

See `ops/google-sheets/CLAUDE.md` and `ops/motors-social/CLAUDE.md` for ops-layer commands.

---

## ENV VARS — set in Vercel dashboard, never commit

```
# Web2 core
NEXT_PUBLIC_APP_URL
STRIPE_SECRET_KEY · NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY · STRIPE_WEBHOOK_SECRET
RESEND_API_KEY · RESEND_FROM_EMAIL=hello@roadhouse.capital
DISCORD_BOT_TOKEN · DISCORD_GUILD_ID
DISCORD_ROLE_REGULAR · DISCORD_ROLE_RANCH_HAND · DISCORD_ROLE_PARTNER
DISCORD_PUBLIC_KEY · DISCORD_APP_ID
DISCORD_VERIFY_SECRET · DISCORD_ADMIN_SECRET
CRON_SECRET
NEXTAUTH_SECRET

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

**Tier format:** canonical string `'ranch-hand'` everywhere.
- `lib/solana.ts` returns `'ranchHand'` (devnet only)
- KV may contain `'ranch'` (legacy)
- `normaliseTier()` in `lib/road-balance.ts` maps all variants → `'ranch-hand'`

---

## $ROAD TOKEN

- **Standard:** Solana SPL · **Supply:** FIXED 100,000,000 (100M) — never inflationary · mint pubkey: TBD at deploy
- **Utility only:** membership gating, governance (advisory), contributor rewards, staking multiplier (1.2x at 90 days). NOT a security — no APY, no profit expectation.
- **DO NOT mint yet** — track in Vercel KV. Wallet snapshot at mainnet launch. $LUX fully deprecated.
- **Allocation:** Founder 18% (4yr/1yr cliff) · Creator 22% · Community 25% · Treasury 25% · Partners 10%
- **Emission:** Regular 100/mo · Ranch Hand 500/mo · Partner 2,000/mo. Burns: 3% NFT royalties + 2% event revenue → quarterly.
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
| `missions:{customerId}` | `Mission[]` | Daily missions (M3 — placeholder) |

Motors KV keys documented in `app/motors/CLAUDE.md`.

---

## DASHBOARD — component tree + nav map

3-column shell: `52px IconRail · 220px DashboardSidebar · 1fr RoadHouse`

```
RoadHouseDashboard.jsx          ← holds activeNavItem state; passes to RoadHouse
  MemberGate → ConnectPrompt
    Primary CTA: "Join RoadHouse →" → /#membership → tier → Stripe
    Secondary CTA: "Connect Wallet" (existing members)
  IconRail (52px)               ← Tabler icons; section-level nav (home/earn/community/treasury)
  DashboardSidebar (220px)      ← member identity block · VaultPanel · 4-section nav
    VaultPanel                  ← $ROAD · SOL wallet · Prop P&L (stub)
  RoadHouse.jsx                 ← page-based routing via activeNavItem prop
    Topbar                      ← breadcrumb "RoadHouse / {section} / {item}" · $ROAD chip · Phase chip
    HOME    → Overview (summary bar · Next Move · DailyMissions · HomePropPanel · feed · leaderboard · RoadLadder)
              Profile → MemberProfileCard · Unlocks · Tracks
              Prop Account → WalletTab
    EARN    → Bounties (4 stub cards with guild color tags)
              Missions · Marketplace (Ranch Hand+ gate) · Leaderboard (top-5 stub)
    COMMUNITY → War Room (GuildTab 2-col) · Protocol · Events (discord link) · Members (M3 stub)
    TREASURY  → Overview (3-cell summary + TreasuryTab) · Governance/NFTs/DAO Vote (locked at M3)
```

**Font stack (dashboard):** Space Mono (body/data) · Bebas Neue (headings) · DM Mono (labels 8–11px)
**Icon rail:** Tabler webfont via CDN (`@tabler/icons-webfont@latest`) — `ti-home ti-coin ti-users ti-wallet ti-settings` (note: `ti-safe` and `ti-vault` missing from webfont; use `ti-wallet` for treasury)
**Mobile:** `.rh-shell` collapses sidebar at `<900px`, rail at `<600px`; `MobileBottomNav` (`position: fixed; bottom: 0`) replaces rail at `<600px`
**Dev banner:** renders only when `process.env.NODE_ENV === 'development'`
**Current state:** `memberTier` from KV via `useMemberProfile()`. M3: replace with `getTierFromBalance()` on-chain.

---

## ADVENTURES

| # | Trip | Season | Deposit | Refund | Gate |
|---|---|---|---|---|---|
| 001 | Lake Trip — BC/AB | Summer 2026 | $199 CAD | Full 30+ days out | All |
| 002 | Ski Trip — Panorama/Whitefish | Winter 2026/27 | $299 CAD | Post Snapshot vote | All |
| 003 | Mediterranean | Summer 2027 | $1,000 CAD | $500 non-refundable <14 days | Ranch Hand+ |

- NFTs transferable; 5% secondary royalty → treasury
- Ski: `NEXT_PUBLIC_SKI_VOTE_RESOLVED=true` to open deposits after vote
- Med: require active Ranch Hand+ at checkout

---

## AGENTS

```
OrchestratorAgent (Claude Sonnet — /agents/orchestrator.ts)
  ContentAgent · SponsorAgent · CommunityAgent · TreasuryAgent · AdventureAgent

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

- Supply 500 · Price 3 SOL. Framing: "Qualify, don't buy." Never lead with price. Never link SOL payment to specific $ROAD amount.
- Qualification (any one): Ranch Hand organically · first compound event · 30-day DeSci sprint · first 500 wallets
- Soul-bound 12 months. Revenue: 70% treasury / 20% operations / 10% founder.
- Spec: `docs/founding-nft-spec.md` (Candy Machine v3, 5 variants x 100, pNFT soul-bind)

---

## SPONSORSHIP

| Tier | Rate | Deliverable |
|---|---|---|
| Trail Blazer | $1,000/mo CAD | Stream overlay + shoutout + analytics |
| Frontier | $2,500/mo CAD | 5-min segment/wk + 2x TikTok/mo + co-branded event |
| Praetor | $10,000/mo CAD | IP licensing + Summit sponsor + custom series + founder call |

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
- No inline styles in app pages — Tailwind tokens only. Dashboard exception: CSS vars + established inline hex. Studio exception: inline styles only.
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

**Known pre-existing repo issues (not blocking):**
- No ESLint config — `next lint` non-functional. Fix: add `eslint.config.js` for Next.js 16 flat config.
- `bigint: Failed to load bindings` — Solana `bigint-buffer` native addon warning. Pure JS fallback runs fine.

---

## BRANCH STATE — 2026-06-08

| Branch | Status | Notes |
|---|---|---|
| `main` | Live · clean | Dashboard rearchitecture + mobile audit verified on roadhouse.capital |
| `multi-dealer-wip` | 4 commits ahead | Multi-dealer architecture; do NOT touch until explicitly scoped |

**multi-dealer-wip contains:** `lib/motors/storage-multi.ts`, multi-dealer abstraction, `DEALER_ID` parameterization. Merge requires explicit scoping session — do not cherry-pick or rebase against it.

---

## CHANGELOG

- **2026-06-08** — CLAUDE.md architecture split: 4 subdirectory files created (app/motors/, app/studio/, ops/motors-social/, ops/google-sheets/); root stripped to cross-cutting content only.
- **2026-06-03** — Mobile audit: MobileBottomNav (`position: fixed; bottom: 0`), sidebar/rail CSS `!important` hide fixes, responsive grid breakpoints in RoadHouse.jsx, `ti-wallet` for treasury icon.
- **2026-06-01** — Dashboard rearchitecture: 3-col shell (IconRail + DashboardSidebar + RoadHouse), page-based nav, DM Mono replaces Syne, Tabler icons via CDN. (37d7d43 · bb21e15)
- **2026-05-28** — Studio launch + repo cleanup: ops/ consolidated, Studio subdomain scaffolded + launched.
- **2026-05-25** — Frontend audit: 21 UX/a11y fixes across motors + main. 5 security patches.
- **2026-05-21** — Social manager upgrades: FCAA linter (31 tests), platform-differentiated captions, Reels pipeline.
- **2026-05-09** — Motors live: ~116 vehicles, daily sync, lead pipeline, PaymentEstimator, admin panel.
- **2026-03-31** — RoadHouse OS bootstrapped: Google Sheets OS, Apps Script triggers, wallet registry.

---

## M3 TODO — June 2026 (priority order)

**Keystone: nothing ships until steward verification works.**
Dependency chain: steward verification → $ROAD release → contribution record → tier advancement → NFT qualification. See `docs/guild-economy.md`.

1. **Steward verification** — `claimBounty()`: auth steward wallet (>=10k $ROAD), write approval + timestamp, trigger $ROAD release from treasury PDA, emit tx hash
2. **On-chain $ROAD balance** — `lib/solana.ts`: `getTokenAccountsByOwner()` in `getProfile()`, replace KV fallback
3. **Live tier derivation** — `RoadHouseDashboard.jsx`: replace hardcoded `'founding'` with `getTierFromBalance(balance)`
4. **Squads integration** — `lib/squads.ts` (create): `proposeTreasuryTransfer()`, `approveTransaction()`, `executeTransaction()`
5. **Metaplex NFT** — `lib/metaplex.ts` (create): `mintFoundingNFT()`, `verifyFoundingNFTOwnership()`, `getAssetsByOwner()`
6. **Road monitor** — `lib/road-monitor.ts` (create): community bucket balance, months to depletion, 30-day notification trigger
7. **Public profile** — `/profile/[wallet]` page
8. **Wallet orphan cleanup** — `registerWallet()`: delete `wallet:{prev}` before writing new reverse index ✅ done in road-balance.ts
9. **Listings auth** — `createListing()`: verify wallet matches + tier check; pagination + `createdAt desc` sort
10. **DeSci cross-member** — `submitDailyEntry()`: aggregate across `experiment:log:*` keys; admin route for new experiments
11. **Guild admin** — admin route to post new bounties per guild
12. **Treasury wiring** — `getTreasurySnapshot()` → Squads SPL + SOL; `getGovernanceVotes()` → Snapshot.org GraphQL
13. **Devnet deploys** — Candy Machine · Squads multisig · Snapshot space + Aragon DAO
14. **GitHub Pages dashboard** — public: treasury + member count + $ROAD + guilds
15. **Missions KV** — wire `missions:{customerId}`; streak from `road:{customerId}.streak`

Arm-specific M3: see `app/motors/CLAUDE.md` (#17 IG Reels) and `app/studio/CLAUDE.md` (#16 live inventory).

---

## CONTACT

- Founder: Dalton Ellscheid — daltonellscheid@gmail.com
- Brand: roadhousesyndicate@gmail.com · X: @dollywooddole · Kick: kick.com/dollywooddole
- Discord: discord.gg/wwhhKcnQJ3
- Entity: Praetorian Holdings Corp. — Saskatchewan CCPC
