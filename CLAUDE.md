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

**Subdomain routing:** all handled in `proxy.ts` (not middleware.ts). Each subdomain rewrites to its `/app/{name}/` directory before auth logic runs.

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

### Dashboard design system (`RoadHouse.jsx` layer) — separate, do NOT merge into Tailwind
```css
/* Scoped to .rh-dash — use CSS vars, no hardcoded hex */
--bg: #0a0a08  --accent: #e8c84a  --accent2: #ff5c35  --accent3: #4af0c8

/* Inline hex established across dashboard components (consistent, acceptable): */
panel: #111110   border: #1e1e1c   warm: #ede8dc   muted: #5a5550   green: #4b7c50
```
Fonts: `Space Mono` (data/body) · `Bebas Neue` (headings) · `Syne` (category labels)
Rules: inline styles only in dashboard; no Tailwind; all three fonts must stay loaded; grain overlay preserved.

### Studio design system (`app/studio/` layer) — inline styles only, no Tailwind
```css
/* Core palette */
bg: #07080A   surface: #0E1012   border: #141618   amber: #C8861E
text-warm: #E8E0D0   text-muted: #5A5550   text-dark: #2A2520
```
Fonts (CSS vars via next/font/google on wrapper div in `app/studio/layout.tsx`):
- `--font-bebas` → Bebas_Neue — headlines
- `--font-dm-mono-studio` → DM_Mono — labels, nav, meta
- `--font-barlow` → Barlow (weight 300/400/500) — body copy
Rules: inline styles only; no Tailwind classes on studio components; amber `#C8861E` is the single accent.

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

/ops/google-sheets/              ← standalone ops layer — NOT part of Next.js app
  src/
    appsscript.json              ← V8 runtime, OAuth scopes, execution API
    Config.js                   ← SHEET/COL constants, getConfig() cache, tier helpers
    RoadHouseOS.js              ← 5 triggers: form sync · leaderboard · inactive alert · cap · $ROAD export
    WalletRegistry.js           ← wallet registration + duplicate detection (V2)
    MotorsInventory.js          ← daily Motors inventory sync → Google Sheet (9:30am Regina)
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

/ops/motors-social/              ← standalone Python tool — NOT part of Next.js app
  social_manager.py             ← main runner: feed fetch → captions → watermark → FB/IG post
  compliance.py                 ← FCAA linter; 31 tests; 2-attempt regeneration before skip
  watermark.py                  ← Pillow pipeline; binary upload to FB; CDN URL reused for IG
  reels.py                      ← ffmpeg 9:16 MP4; xfade transitions; brand outro; 2 FB Reels/day
  posted.json                   ← committed after each run; deduplication across days
  tests/test_compliance.py      ← 31 FCAA compliance tests
  MARKETPLACE_SETUP.md          ← FB Marketplace catalog setup guide
```

**Nav rule:** No Nav.tsx / Header.tsx. Navigation = Sidebar.tsx only.
`/compound` and `/partners` in sidebar. `/partners` is sidebar-only (gated content).

---

### Motors subdomain (`motors.roadhouse.capital`)

```
/app/motors/
  layout.tsx              ← isolated layout; OG/Twitter metadata; AutoDealer + Organization JSON-LD; phone (306) 381-8222; footer DL331386
  page.tsx                ← redirect → /motors/inventory
  /inventory/page.tsx     ← server component; KV inventory; extended filters + sort; ActiveFilterChips; ItemList JSON-LD
  /vehicle/[vin]/page.tsx ← VDP; spec table; PaymentEstimator; VehicleLeadForm; StickyCallBar; ReviewCarousel (gated)
                             if vehicle null → SoldVehiclePage (noindex) instead of hard 404
  /used/page.tsx          ← SEO hub "Used Vehicles Saskatchewan"; off-lease callout; city links; ItemList JSON-LD
  /[city]/page.tsx        ← geo pages: saskatoon · regina · prince-albert · moose-jaw
                             generateStaticParams; per-city metadata + LocalBusiness JSON-LD
  /credit/page.tsx        ← pre-qualification form → /api/motors/leads → KV + Resend
  /admin/page.tsx         ← lead admin panel; ?token={CRON_SECRET} gated
  /team/page.tsx          ← Meet the Team; featured 2-col hero (photo + bio + pull quote); future-proof team grid

/components/motors/
  VehicleCard.tsx         ← framer-motion entrance; rh-logo watermark; status badge; CAD price; images[0] as card photo
  VehicleGallery.tsx      ← image gallery for VDP
  VehicleImage.tsx        ← client component; CDN images unoptimized; onError → rh-coming-soon.svg fallback
  VehicleLeadForm.tsx     ← 3-field form (name, phone, hidden vehicleInterest); POST /api/motors/lead
  StickyCallBar.tsx       ← fixed bottom bar; <a href="tel:+13063818222"> for mobile click-to-call
  InventoryGrid.tsx       ← 1/2/3 responsive grid; empty state
  FilterSidebar.tsx       ← client component; make/model/year/price/status/body_type/fuel_type/transmission/km
                             range/sort filters → URL params; chip groups; dual-range slider; debounced; mobile drawer
  ActiveFilterChips.tsx   ← client component; reads URL params; chip strip above grid; per-chip remove; Clear all
  HeroSection.tsx         ← make-aware H1; inventory banner
  PaymentEstimator.tsx    ← amortizing payment calc; down payment slider; term + rate dropdowns
  CreditForm.tsx          ← full pre-qualification form; reads ?vehicle= param; POSTs to /api/motors/leads
  ReviewCarousel.tsx      ← client component; auto-advance 7s; swipe; prev/next + dots; 5-star SVG; partial-neighbor
                             peek md+; prefers-reduced-motion; returns null when REVIEWS_ENABLED=false

/lib/motors/
  storage.ts              ← Upstash Redis CRUD: seedInventory, getInventory, getVehicleByVin, getInventoryCount,
                             getIndexedVins, removeVehicle; exports DEALER_ID='obrians'
  scraper.ts              ← Scrapes obrians.ca Webflow CMS; fetchInventorySlugs(), parseListing(), scrapeObriansInventory()
  team.ts                 ← TeamMember interface + TEAM data array; add members here to populate /motors/team
  reviews.ts              ← Review interface; REVIEWS=[] (empty until real reviews); REVIEWS_ENABLED=REVIEWS.length>=3
  normalize.ts            ← normalizeBodyStyle() + normalizeTransmission() — maps raw Webflow values to filter categories
                             drivetrain NOT available in Vehicle schema — not scraped from obrians.ca

/types/inventory.ts       ← Vehicle · InventoryFilters · MotorsLead interfaces

/app/api/motors/seed/
  route.ts                ← returns 410 Gone (deprecated — scraper is source of truth)
/app/api/motors/credit/
  route.ts                ← returns 410 Gone (deprecated — CreditForm POSTs to /api/motors/leads)
/app/api/motors/sync/
  route.ts                ← POST (Bearer CRON_SECRET) full O'Brian's scrape+sync; GET returns count
                             maxDuration=300; runs via Vercel cron daily at 9am CST
/app/api/motors/lead/
  route.ts                ← POST (public); name+phone+vehicleInterest → Resend to roadhousesyndicate@gmail.com
                             60s KV rate limit per phone (lead:phone:{phone} TTL key)
/app/api/motors/leads/
  route.ts                ← POST (public) full credit form → KV + Resend; GET (CRON_SECRET) all leads
/app/api/motors/leads/[id]/
  route.ts                ← PATCH (CRON_SECRET) update lead status
/app/api/motors/feed/
  route.ts                ← GET (Bearer CRON_SECRET) JSON + AAMVA XML export
/app/api/motors/feed/catalog/
  route.ts                ← GET (Bearer CRON_SECRET) RFC 4180 CSV for FB Marketplace Vehicles Catalog
```

**Motors KV key pattern:**
```
motors:inventory:obrians:{vin}   → Vehicle JSON
motors:index:obrians             → Redis SET of VINs (index for efficient bulk reads)
motors:leads:{id}                → MotorsLead JSON
motors:leads:index               → Redis SET of lead IDs
```

**Motors sync — how it works:**
- Vercel cron: `0 15 * * *` (9am CST / 3pm UTC) → `POST /api/motors/sync`
- Scrapes obrians.ca Webflow inventory page for all JetBoost slugs (each slug ends with the 17-char VIN)
- Fetches each listing page; parses `#listing-info` div attributes for price/mileage/specs, `featureString` JS var for features, Webflow CDN images (skip first 2: branded overlay + feature icon collage)
- Skips `formPrice=1000` (O'Brian's sentinel for "contact for price")
- Upserts valid vehicles; removes VINs from KV that are sold OR became unparseable since last run
- Current inventory: ~116 priced vehicles, $5,900–$96,900, no manual work required
- To trigger manually: `POST /api/motors/sync` with `Authorization: Bearer {CRON_SECRET}`

**CRON_SECRET note:** Vercel validates this at build time when crons are in vercel.json — it must have NO trailing whitespace. Fixed via `~/.local/bin/vercel env rm/add`. If re-setting, use `printf` not `echo` to avoid adding a newline.

**Motors constraints (permanent):**
- Zero $ROAD, Web3, Solana, or RoadHouse Capital branding on any motors page
- No O'Brian's phone numbers, logos, or dealer name in any scraped content displayed to users
- Subdomain isolated — no nav links from main roadhouse.capital site
- `proxy.ts` handles `motors.*` host rewrite → `/motors/*` before any auth logic
- All motors routes are FULLY_PUBLIC in proxy.ts
- Webflow CDN (`cdn.prod.website-files.com`) added to next/image remotePatterns for scraped vehicle photos

**Image rule (motors):** All `next/image` usage in motors must include `unoptimized` prop — optimizer causes rendering failures on this subdomain. Applies to local assets and CDN images alike.

**Admin panel access:** `https://motors.roadhouse.capital/motors/admin?token={CRON_SECRET}`

**Motors assets:**
- Inventory banner: `/public/motors/rh-motors-header.svg` (Canva AI, cropped 16/7.2 aspect ratio)
- OG/Twitter image: `/public/motors/rh-motors-header.jpg` (2560×1440 JPEG)
- Watermark: `/public/motors/rh-logo.png` — 30% opacity on cards
- Placeholder: `/public/motors/rh-coming-soon.svg`
- Team photo: `/public/motors/team/dalton.png` — rendered unoptimized

---

### Studio subdomain (`studio.roadhouse.capital`)

```
/app/studio/
  layout.tsx              ← nested layout (no html/body); Bebas_Neue + DM_Mono + Barlow via next/font/google
                             CSS vars: --font-bebas · --font-dm-mono-studio · --font-barlow
                             full metadata; canonical https://studio.roadhouse.capital
  page.tsx                ← server component; mounts StudioNav · StudioHero · StudioTicker · StudioEngage
  README.md               ← ecosystem map + asset notes

/components/studio/
  StudioNav.tsx           ← server; sticky; RS amber box; DM Mono; Work/House/Contact + "Enter ↗" CTA
  StudioHero.tsx          ← 'use client'; owns activeView: 'client'|'house' toggle state
                             Bebas headline OPERATORS/BUILD/DIFFERENT.; amber rule; body copy + toggle buttons
                             renders StudioServices + MotorsCaseStudy with activeView prop
  StudioServices.tsx      ← 'use client'; activeView prop; hover state; 3-col grid with border-right dividers
                             client: Build/Mark/Move · house: Signal/Produce/IP
  MotorsCaseStudy.tsx     ← returns null when activeView !== 'client'
                             amber 3px left border; stats (vehicles/ADF-XML/multi/JSON-LD)
                             TODO: replace hardcoded stats with await getInventoryCount('obrians') from lib/motors/storage.ts
                             Blocked on multi-dealer-wip merge to main
  StudioTicker.tsx        ← server; inline keyframe animation; doubled content for seamless loop
  StudioEngage.tsx        ← server; WORK/WITH/US.; hello@roadhouse.capital CTA

/lib/studio/index.ts      ← entry point stub
/types/studio.ts          ← domain types placeholder
```

**Studio constraints:**
- Inline styles only — no Tailwind on studio components
- Studio layout defines its own font CSS vars on wrapper div; does NOT conflict with root layout `<link>` tags
- `proxy.ts` handles `studio.*` host rewrite → `/studio/*` before any auth logic
- All studio routes are FULLY_PUBLIC in proxy.ts
- No RoadHouse Capital membership branding, no $ROAD, no wallet UI on studio pages

---

## PROXY.TS — subdomain routing

`proxy.ts` is the middleware (exported from `middleware.ts` which re-exports it). Order matters:

1. `host.startsWith('motors.')` → rewrite `/motors/*`; passthrough if already prefixed
2. `host.startsWith('studio.')` → rewrite `/studio/*`; passthrough if already prefixed
3. Static file fast path
4. `FULLY_PUBLIC` array → immediate passthrough (includes `/motors`, `/studio`, all API routes)
5. Session resolution (wallet JWT)
6. `SESSION_OPTIONAL` → resolve session, set headers, never redirect
7. Auth gate → redirect `/login?from=...`
8. `/dashboard` → requires `isMember`

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

### ops/google-sheets (cd ops/google-sheets first)

```bash
npm run auth          # OAuth2 desktop flow → token.json (re-run if scopes change)
npm run bootstrap     # Full 7-step idempotent setup (sheet → form → drive → script props)
npm run push          # clasp push → deploy Apps Script
npm run logs          # clasp logs --watch (live trigger logs)
npm test:webhook      # Smoke test Discord webhooks
npm run distribute    # Distribute $ROAD via Solana SPL (V2 — requires ROAD_TOKEN_MINT)
```

### ops/motors-social (cd ops/motors-social first)

```bash
venv\Scripts\python social_manager.py           # dry run (no --live)
venv\Scripts\python social_manager.py --live    # live post (10-20 min, do NOT background)
venv\Scripts\python social_manager.py --live --limit 3
venv\Scripts\python social_manager.py --live --reels-only --reels-limit 2
venv\Scripts\python social_manager.py --live --feed-only
venv\Scripts\python social_manager.py --lint-only ops/motors-social/posted.json
# Manual GitHub Actions trigger: Actions tab → "RoadHouse Motors — Daily Social Post" → Run workflow
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

**GitHub secrets (motors-social workflow):** `CRON_SECRET` · `ANTHROPIC_API_KEY` · `FB_PAGE_ACCESS_TOKEN`
**GitHub vars:** `FB_PAGE_ID=1047748735096733` · `IG_USER_ID=17841417177506354` · `ENABLE_REELS=true` · `REELS_AUDIO_DIR`
**Meta App ID:** `915612138190380`

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
| `motors:inventory:obrians:{vin}` | Vehicle JSON | Single vehicle record |
| `motors:index:obrians` | Redis SET of VINs | Efficient bulk reads |
| `motors:leads:{id}` | MotorsLead JSON | Lead/pre-qualification submission |
| `motors:leads:index` | Redis SET of lead IDs | Lead list |

---

## DASHBOARD — component tree + nav map

3-column shell: `52px IconRail · 220px DashboardSidebar · 1fr RoadHouse`

```
RoadHouseDashboard.jsx          ← holds activeNavItem state; passes to RoadHouse
  MemberGate → ConnectPrompt
    Primary CTA: "Join RoadHouse →" → /#membership (click 1) → tier → Stripe (click 2)
    Secondary CTA: "Connect Wallet" (existing members)
  IconRail (52px)               ← Tabler icons; section-level nav (home/earn/community/treasury)
  DashboardSidebar (220px)      ← member identity block · VaultPanel · 4-section nav
    VaultPanel                  ← $ROAD (prop) · SOL wallet (prop) · Prop P&L (stub)
  RoadHouse.jsx                 ← page-based routing via activeNavItem prop
    Topbar                      ← breadcrumb "RoadHouse / {section} / {item}" · $ROAD chip · Phase chip
    HOME (overview/profile/prop-account)
      Overview    → summary bar (4 cells) · Next Move (first incomplete mission) · DailyMissions
                    · HomePropPanel · activity feed · leaderboard stub · RoadLadder
      Profile     → MyRoadHouseTab (MemberProfileCard · Unlocks · Tracks)
      Prop Account→ WalletTab
    EARN (bounties/missions/marketplace/leaderboard)
      Bounties    → 4 stub cards with guild color tags · claim button
      Missions    → DailyMissions
      Marketplace → empty state (Ranch Hand+ gate) + EconomyTab
      Leaderboard → STUB_LEADERS top-5 table
    COMMUNITY (war-room/protocol/events/members)
      War Room    → GuildTab + active members panel (2-col)
      Protocol    → ProtocolTab
      Events      → empty state → discord.gg/wwhhKcnQJ3
      Members     → empty state → M3 wallet verification
    TREASURY (treasury-overview/governance/nfts/dao-vote)
      Overview    → 3-cell summary bar (stub) + TreasuryTab + locked note
      Governance/NFTs/DAO Vote → locked (opacity 0.4, title="Available at M3")
```

**Dashboard-only components (RoadHouse.jsx):**
`ProfileXPBar` · `ProfileStatBar` · `MemberProfileCard` · `DailyMissions` · `Card` · `Label` · `SectionHead` · `Divider` · `HomePropPanel` · `HomeOverviewPage` · `EarnPage` · `CommunityPage` · `TreasuryPageWrapper`

**Font stack (dashboard):** Space Mono (body/data) · Bebas Neue (headings) · DM Mono (labels 8–11px)
**Icon rail:** Tabler webfont via CDN (`@tabler/icons-webfont@latest`) — `ti-home ti-coin ti-users ti-safe ti-settings`
**Mobile:** `.rh-shell` collapses sidebar at `<900px`, rail at `<600px`
**Dev banner:** renders only when `process.env.NODE_ENV === 'development'` (MemberGate bypassed reminder)

**Current state:** `memberTier` derives from KV via `useMemberProfile()` hook (wallet-linked). M3: replace with `getTierFromBalance()` via on-chain SPL balance.

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
- No inline styles in app pages — Tailwind tokens only. Dashboard layer exception: CSS vars + established inline hex. Studio layer exception: inline styles only (see Studio design system).
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
- No ESLint config — `next lint` / `npm run lint` non-functional project-wide. Fix: add `eslint.config.js` for Next.js 16 flat config format.
- `bigint: Failed to load bindings` — Solana `bigint-buffer` native addon warning at build time. Pure JS fallback runs fine.

---

## BRANCH STATE — 2026-05-28

| Branch | Status | Notes |
|---|---|---|
| `main` | Live · clean | All features merged through this session |
| `multi-dealer-wip` | 4 commits ahead | Multi-dealer architecture; do NOT touch until explicitly scoped |
| `feature/roadhouse-studio` | Merged → main | f2d90fb · deleted after merge |
| `chore/repo-cleanup` | Merged → main | c7eabc8 · deleted after merge |

**multi-dealer-wip contains:** `lib/motors/storage-multi.ts`, multi-dealer abstraction layer, `DEALER_ID` parameterization. Merge to main requires explicit scoping session — do not cherry-pick or rebase against it.

---

## CHANGELOG

### DASHBOARD REARCHITECTURE + POLISH — 2026-06-01

**3-column shell (37d7d43):**
- Replaced 6-tab engine with 3-column grid: 52px IconRail · 220px DashboardSidebar · 1fr RoadHouse
- `activeNavItem` state lives in RoadHouseDashboard.jsx, passed down as prop
- IconRail: section-level buttons + RH wordmark vertical
- DashboardSidebar: member identity block (avatar/name/handle/tier badge) + VaultPanel + 4-section nav with badge counts, reward chips, locked M3 items
- RoadHouse.jsx: tabs removed → topbar breadcrumb + chips + 4 page sections (Home/Earn/Community/Treasury)
- Home Overview: summary bar, Next Move card, DailyMissions, HomePropPanel, activity feed, leaderboard, RoadLadder
- Earn: 4 stub bounties with guild color tags; Marketplace/Missions/Leaderboard sub-tabs
- Community: War Room (GuildTab 2-col) + Protocol/Events/Members
- Treasury: 3-cell summary bar + TreasuryTab + locked M3 note
- Syne font fully replaced with DM Mono

**Polish pass (bb21e15):**
- Font quoting fixed: all unquoted multi-word font families now properly quoted (`'DM Mono', monospace` etc.)
- Icon rail: Tabler webfont (ti-home/ti-coin/ti-users/ti-safe/ti-settings) replaces unicode glyphs
- Tabler CDN loaded via `<link>` tag in dashboard shell
- Breadcrumb: 2-level for Home/Treasury; 3-level for Earn/Community sub-tabs
- Locked nav items: `title="Available at M3"` + `preventDefault` onclick
- Mobile: `.rh-shell` media queries collapse sidebar <900px, rail <600px
- Next Move card derived from `DAILY_MISSIONS.find(m => !m.done)` + all-complete state
- Stub comments on Prop P&L / Streak / Guild Rank summary cells
- "View Tiers →" renamed from "Scale Up" with console.log stub
- Treasury community bucket: `// TODO: lib/road-monitor.ts` comment
- Dev mode banner (NODE_ENV=development only)
- Empty states: Earn > Marketplace (Ranch Hand+ gate), Community > Events (Discord link), Community > Members (M3 note)

### REPO CLEANUP + STUDIO LAUNCH — 2026-05-28

**Repo cleanup (`chore/repo-cleanup`):**
- Deleted tracked MP4 binary (`public/Clip_TikTok_0.mp4`) — was unnecessarily git-tracked
- Deduplicated `.gitignore` — removed 3 duplicate `.vercel` entries, 3 duplicate `.env*.local` entries, collapsed trailing junk lines
- Consolidated standalone tools into `ops/`: `roadhouse-motors-social-manager/` → `ops/motors-social/`, `roadhouse-ops/` → `ops/google-sheets/`
- Updated all path references: `.github/workflows/motors-social.yml` (3 refs), `CLAUDE.md` (8 refs), `IMPLEMENTATION.md` (2 refs)
- 410'd deprecated `app/api/motors/credit/route.ts` (CreditForm already POSTs to `/api/motors/leads`)
- Deleted `app/api/webhook/route.ts` (dead 410 tombstone, no live refs)
- Deleted `app/motors/credit/thank-you/page.tsx` (orphaned, inline confirmation replaced redirect)

**RoadHouse Studio (`feature/roadhouse-studio` → merged f2d90fb):**
- Scaffolded `app/studio/` — layout, page, README
- Built full Studio homepage: StudioNav · StudioHero · StudioServices · MotorsCaseStudy · StudioTicker · StudioEngage
- Added `studio.*` hostname rewrite to `proxy.ts` + `/studio` to `FULLY_PUBLIC`
- Added `studio.roadhouse.capital` to Vercel project
- `MotorsCaseStudy.tsx` blocked on `multi-dealer-wip` merge for live inventory count

**Social stats as of 2026-05-28:** 119 VINs tracked · 111 FB posts · 110 IG posts · 12 Reels

### SOCIAL MANAGER UPGRADES — 2026-05-21

- `compliance.py` — FCAA linter; 31 tests in `tests/test_compliance.py`; 2-attempt regeneration before skip
- Platform-differentiated captions — one Claude call returns `{"fb": ..., "ig": ...}`; FB 200-320 char; IG up to 1,200 char with hashtags
- `watermark.py` — Pillow watermark pipeline; binary uploads to FB; FB CDN URL reused for IG
- `reels.py` — ffmpeg 9:16 MP4; static letterboxed clips; xfade transitions; brand outro; 2 FB Reels/day; `ENABLE_REELS=true` GitHub var
- IG Reels blocked: FB CDN URLs not accessible to IG servers (error 2207076); needs Vercel Blob upload → public URL → IG `video_url`
- `app/api/motors/feed/catalog/route.ts` — FB Marketplace Vehicles Catalog CSV

### MOTORS — 2026-05-06 / 2026-05-09

- Fully operational: ~116 vehicles, daily sync 9am CST, no manual work
- Lead pipeline: `POST /api/motors/leads` → KV + Resend email
- Pre-qualification form + PaymentEstimator on every VDP
- Admin panel: `https://motors.roadhouse.capital/motors/admin?token={CRON_SECRET}`
- Google Sheet inventory sync via `ops/google-sheets/src/MotorsInventory.js` (Sheet ID: `1g_Q-wXDWkQ0cBYSdZFxWBY6CW6S4u-ZFH0lO_4FfD9s`)
- FB Marketplace catalog, AAMVA XML feed, SEO JSON-LD on all routes
- Frontend audit (2026-05-25): 21 items fixed — UX, a11y, OG images, metadata (commits d591b29, c12f9b1, dca8307)
- Security patches (2026-05-25): 5 temp patches on road/balance PII, contributions unauth write, discord assign-role fail-open, wallet re-bind squatting, sync GET unauthed

### ROADHOUSE OS — 2026-03-31

Ops layer bootstrapped: `ops/google-sheets/` standalone toolchain — Google Sheets OS (6 tabs + formula engine), Google Form (7 fields), 5 Apps Script triggers, Discord webhooks live, wallet registry wired.

### M2 COMPLETE — 2026-03-27

Dashboard reworked: 6 static tabs → 5 functional tabs with live KV wiring. New pages: `/compound` · `/partners`. Sidebar glassmorphism. Docs: `governance-spec.md` · `multisig-spec.md` · `founding-nft-spec.md`. Domain live, all env vars set, Stripe webhook e2e, Discord interactions endpoint.

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
16. **Studio live inventory** — merge `multi-dealer-wip` → wire `getInventoryCount('obrians')` into `MotorsCaseStudy.tsx`
17. **IG Reels** — `PUT /api/motors/reels/upload` → Vercel Blob → public URL → IG `video_url`

---

## CONTACT

- Founder: Dalton Ellscheid — daltonellscheid@gmail.com
- Brand: roadhousesyndicate@gmail.com · X: @dollywooddole · Kick: kick.com/dollywooddole
- Discord: discord.gg/wwhhKcnQJ3
- Entity: Praetorian Holdings Corp. — Saskatchewan CCPC
