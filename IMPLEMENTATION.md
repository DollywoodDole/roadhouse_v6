# RoadHouse v6 — Implementation State
> Last updated: 2026-05-20 · M2 complete · M3 active · Motors live

---

## MILESTONE STATUS

| Milestone | Status | Shipped |
|---|---|---|
| M1 — Web2 Core | ✅ Complete | Stripe, Discord gating, email, member portal |
| M2 — Web3 Architecture | ✅ Complete | Wallet auth, KV economy, dashboard, docs |
| M3 — Adventure NFTs + DAO | 🟢 Active | Steward verification keystone not yet shipped |
| M4 — Claude Agent Team | ⬜ Planned | Orchestrator + specialists |
| Motors — Dealer Platform | ✅ Live | motors.roadhouse.capital — ~116 vehicles, daily sync |

---

## AUTH SYSTEM

**Single auth path: Solana wallet → JWT cookie.** No Google OAuth. No next-auth sessions.

### Flow — New Member
```
Stripe checkout (/api/subscription POST)
  → Stripe success_url → /welcome?session_id=xxx
  → /welcome: connect wallet
      → POST /api/wallet/register  (writes wallet:{address} → customerId in KV)
      → POST /api/auth/wallet      (looks up KV, issues JWT, sets rh-wallet-session cookie)
  → redirect /dashboard
```

### Flow — Returning Member
```
/login → connect wallet
  → POST /api/auth/wallet → if isMember → /dashboard
                           → if !isMember → "Wallet not linked" state + portal CTA
```

### Flow — Admin Wallet
```
POST /api/auth/wallet
  → isAdminWallet(publicKey) check against ADMIN_WALLETS env var
  → if match → issue JWT with isMember:true, tier:'praetor', admin:true (no KV lookup)
```

### JWT Shape (rh-wallet-session cookie)
```ts
{
  publicKey:  string          // Solana base58 pubkey
  customerId: string | null   // Stripe cus_xxx or null
  isMember:   boolean
  tier:       string | null   // 'regular' | 'ranch-hand' | 'partner' | 'praetor'
  provider:   'wallet'
  admin?:     true            // only on admin bypass tokens
  iat:        number
  exp:        number          // 7 days
}
```

### Session Refresh
`useSessionRefresh()` hook (lib/use-session-refresh.ts) fires:
- On mount
- On tab visibility change (tab regains focus)
- Every 6 hours

GET /api/auth/wallet verifies existing cookie, re-checks KV tier, reissues 7-day cookie.

---

## MIDDLEWARE (proxy.ts)

Exported as `proxy` (not `middleware`) — named export required by Next.js config.

```
FULLY_PUBLIC    → no session resolution, immediate passthrough
SESSION_OPTIONAL → resolve session if present, inject x-rh-member / x-rh-tier headers, never redirect
Authenticated   → require session or redirect /login
/dashboard      → additionally require isMember or redirect /?upgrade=1
/login          → redirect authenticated users to /dashboard (if member) or / (if not)
```

**Key paths:**
- `SESSION_OPTIONAL`: `/` (landing, upgrade banner), `/partners` (TokenGate client-side)
- `FULLY_PUBLIC` includes all `/api/auth`, `/api/wallet`, `/api/subscription`, `/api/webhooks`
- `startsWith('/')` is NOT used for SESSION_OPTIONAL — uses exact match to avoid matching everything

---

## KV SCHEMA (Vercel KV / Upstash Redis)

| Key | Value Type | Purpose |
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
| `missions:{customerId}` | `Mission[]` | Daily missions (M3 placeholder) |
| `leaderboard:{YYYY-WNN}` | `LeaderboardEntry[]` | Weekly top-10 from ops layer |

**Ordering contract:** `wallet:{address}` MUST be written by `/api/wallet/register` BEFORE `/api/auth/wallet` is called, or `isMember` will be false even for active subscribers.

---

## API ROUTES

### Public (no auth)
| Route | Method | Purpose |
|---|---|---|
| `/api/subscription` | POST | Create Stripe checkout session |
| `/api/subscription` | GET | Redirect to Stripe Customer Portal |
| `/api/auth/wallet` | POST | Issue wallet session JWT |
| `/api/auth/wallet` | GET | Refresh wallet session JWT |
| `/api/auth/wallet` | DELETE | Clear wallet session cookie |
| `/api/wallet/register` | POST | Write wallet:{address} → customerId KV |
| `/api/contact` | POST | Contact form → Resend email |
| `/api/webhooks/stripe` | POST | Stripe webhook (sig-verified, always 200) |
| `/api/discord/interactions` | POST | Discord slash command handler |

### Cron-authenticated (Bearer CRON_SECRET)
| Route | Method | Purpose |
|---|---|---|
| `/api/road/accrue` | POST | Monthly $ROAD accrual (Stripe scan or ops batch) |
| `/api/leaderboard/update` | POST | Write weekly top-10 from ops layer |

### Session-authenticated
| Route | Method | Purpose |
|---|---|---|
| `/api/road/balance` | GET | `?walletAddress=xxx` → tier + balance |
| `/api/contributions` | POST | Submit contribution |
| `/api/agents/run` | POST | Trigger agent |
| `/api/agents/status` | GET | Agent approval queue |

### Not yet built (M3)
- `/api/bounties` GET/POST — guild bounties CRUD
- `/api/profile/[wallet]` — public member profile

---

## $ROAD ACCRUAL — DUAL MODE

`ROAD_ACCRUAL_MODE` env var controls which caller is active:

| Mode | Caller | Trigger | Status |
|---|---|---|---|
| `stripe` (default) | GitHub Actions cron | Monthly, 1st | Active |
| `ops` | Apps Script `exportWeeklyRoadAccrual()` | Monthly, 1st 7AM | Standby — activate after backfill |

**Before activating ops mode:**
1. Run `backfillStripeCustomerIds()` from Apps Script editor (adds col Q + R to Members sheet)
2. Verify accrual totals in Logger output
3. Set `ROAD_ACCRUAL_MODE=ops` in Vercel env
4. Disable GitHub Actions cron workflow

**Never run both simultaneously** — mode guard in `/api/road/accrue` returns 409 if modes conflict.

---

## GOOGLE SHEETS OPS LAYER (ops/google-sheets/)

Standalone Apps Script layer — NOT part of Next.js app. Admin: `roadhousesyndicate@gmail.com`.

### 5 Triggers
| Function | Schedule | Purpose |
|---|---|---|
| `syncMembersToForm()` | Daily 3AM | Syncs Member ID dropdown in Google Form |
| `weeklyLeaderboard()` | Monday 7AM | Posts top-10 to Discord + emails members + writes KV |
| `inactiveAlert()` | Daily 9AM | Emails admin when members go dark ≥7 days |
| `enforceSubmissionCap()` | Daily 11:55PM | Marks excess submissions (>3/day) invalid |
| `exportWeeklyRoadAccrual()` | Monthly 1st 7AM | POSTs accruals to /api/road/accrue (ops mode) |

### Scoring Multipliers (scoring.json)
| Type | Multiplier | Proof Required |
|---|---|---|
| Sponsorship Secured | 3.0x | Yes |
| Deal Closed | 2.5x | Yes |
| Content Published | 2.0x | Yes |
| Code Shipped | 2.0x | Yes |
| Research Published | 1.8x | Yes |
| Strategic Output | 1.7x | No |
| Community Build | 1.5x | No |
| Training Log | 1.2x | No |
| Daily Check-In | 1.0x | No |

Bonuses: weekend +10%, 5-day streak +10%, max 3 submissions/day.
$ROAD conversion: 10 score points = 1 $ROAD.

---

## MEMBERSHIP TIERS

| Tier | Price (CAD) | $ROAD/mo | Stripe Env Var |
|---|---|---|---|
| Regular | $19.99/mo | 100 | `NEXT_PUBLIC_STRIPE_SUB_REGULAR` |
| Ranch Hand | $99.99/mo | 500 | `NEXT_PUBLIC_STRIPE_SUB_RANCH` |
| Partner | $199.98/mo | 2,000 | `NEXT_PUBLIC_STRIPE_SUB_PARTNER` |
| Steward | Invite-only | 10,000 | Manual |
| Praetor | Invite-only | 50,000 | Manual + `ADMIN_WALLETS` bypass |

Tier string: `'ranch-hand'` canonical everywhere. `normaliseTier()` in `lib/road-balance.ts` maps all variants.

---

## DASHBOARD COMPONENT TREE

```
RoadHouseDashboard.jsx
  useSessionRefresh()               ← fires on mount / visibility / 6h interval
  useMemberProfile()                ← GET /api/road/balance?walletAddress=xxx
  MemberGate → ConnectPrompt        ← shows if wallet not connected
  DashboardHeader                   ← wordmark · wallet pill · tier badge · disconnect
  RoadHouse.jsx (5 tabs)
    MY ROADHOUSE  → MemberProfileCard · DailyMissions · tier status · contribution feed
    ECONOMY       → listings:offering + listings:seeking
    DESCI         → experiment:active + experiment:log + experiment:aggregate
    GUILD         → bounties:active + bounties:claimed · week indicator · milestone timeline
    TREASURY      → treasury:snapshot + treasury:votes · reinvestment split
```

**M3 stubs in RoadHouse.jsx:** XP wiring, missions timer, guild bounties CRUD — all read from KV, routes not yet built.

---

---

## MOTORS (motors.roadhouse.capital)

Live at `motors.roadhouse.capital` — isolated subdomain, zero RoadHouse Capital branding.
proxy.ts rewrites `motors.*` → `/motors/*`; all `/motors` paths are FULLY_PUBLIC.

### Infrastructure
- `lib/motors/storage.ts` — Upstash Redis CRUD; `DEALER_ID='obrians'` exported constant
- `lib/motors/scraper.ts` — Webflow CMS scraper (obrians.ca); 8 concurrent fetches
- `app/api/motors/sync/route.ts` — POST (Bearer CRON_SECRET); full scrape+sync; maxDuration=300
- Vercel cron `0 15 * * *` (9am CST) → sync; ~116 priced vehicles; stale KV cleanup on each run
- `app/api/motors/seed/route.ts` — returns 410 Gone (deprecated; scraper is source of truth)
- `app/api/motors/feed/route.ts` — GET (Bearer CRON_SECRET); JSON + AAMVA XML export

### Pages
| Route | Purpose |
|---|---|
| `/motors/inventory` | Main inventory grid; extended filters + sort; ActiveFilterChips; dynamic metadata by make |
| `/motors/vehicle/[vin]` | VDP; spec table; PaymentEstimator; VehicleLeadForm; StickyCallBar; ReviewCarousel (gated) |
| `/motors/credit` | Pre-qualification form → `/api/motors/leads` → KV + Resend |
| `/motors/used` | SEO hub — "Used Vehicles Saskatchewan"; off-lease callout; city links |
| `/motors/[city]` | City geo pages (Saskatoon, Regina, Prince Albert, Moose Jaw) |
| `/motors/admin` | Lead admin panel; `?token={CRON_SECRET}` gated |
| `/motors/team` | Meet the Team; founder hero layout; pull quote; tel+email CTAs |

### SEO (shipped May 2026)
- AutoDealer + Organization JSON-LD in layout; Car + BreadcrumbList on VDP
- AggregateRating + Review JSON-LD in AutoDealer schema — conditional on `REVIEWS_ENABLED` (≥3 reviews)
- ItemList JSON-LD on inventory, /used, and city pages
- `app/motors/robots.txt/route.ts` — plain text robots.txt
- `app/motors/sitemap.ts` — real `lastModified`; per-make URLs; city + /used entries
- `generateMetadata` on all pages; Twitter card + OG image throughout
- Sold VDP: noindex + graceful "this vehicle has sold" page instead of hard 404
- VehicleImage.tsx: CDN images with `onError` fallback to rh-coming-soon.svg

### Lead Pipeline
- `POST /api/motors/leads` — full credit form → KV + Resend to roadhousesyndicate@gmail.com
- `GET /api/motors/leads` (CRON_SECRET) — all leads sorted newest-first
- `PATCH /api/motors/leads/[id]` (CRON_SECRET) — update lead status
- `POST /api/motors/lead` — lightweight 3-field VDP form (name, phone, vehicleInterest) → Resend to roadhousesyndicate@gmail.com; 60s KV rate limit per phone; no CRON_SECRET required
- KV keys: `motors:leads:{id}` · `motors:leads:index` · `lead:phone:{phone}` (60s TTL)

### Components
- `VehicleCard.tsx` — framer-motion; rh-logo watermark; status badge; CAD price
- `VehicleGallery.tsx` — image gallery for VDP
- `VehicleImage.tsx` — client component; CDN images unoptimized; onError → rh-coming-soon.svg
- `FilterSidebar.tsx` — make/model/year/price/status/body_type/fuel_type/transmission/km range/sort → URL params; chip groups; dual-range slider; mobile drawer with count badge
- `ActiveFilterChips.tsx` — chip strip above inventory grid; per-chip X remove; Clear all (preserves sort)
- `ReviewCarousel.tsx` — 5-star carousel; auto-advance 7s; swipe; returns null when REVIEWS_ENABLED=false
- `PaymentEstimator.tsx` — amortizing payment calc; down payment slider; term + rate dropdowns
- `StickyCallBar.tsx` — fixed bottom bar; tel: link for mobile click-to-call
- `VehicleLeadForm.tsx` — 3-field form (name, phone, hidden vehicleInterest); POST /api/motors/lead
- `CreditForm.tsx` — full pre-qualification form; reads `?vehicle=` param
- `HeroSection.tsx` — make-aware H1; inventory banner

### Reviews
- `lib/motors/reviews.ts` — `REVIEWS: Review[] = []` (empty); `REVIEWS_ENABLED = REVIEWS.length >= 3`
- Section is completely invisible until 3+ real reviews are added to the array
- TODO comment in file: swap static array for Google Business Profile API once GBP is set up

### Team
- `lib/motors/team.ts` — `TEAM: TeamMember[]`; add members here; featured=true → hero layout
- `public/motors/team/dalton.png` — Dalton Ellscheid founder photo (PNG, use `unoptimized` in Image)

### Social Manager
- `ops/motors-social/` — standalone Python tool; NOT part of Next.js
- 3 posts/day (FB + IG); Claude claude-sonnet-4-6 copy generation; FCAA compliant
- GitHub Actions workflow (`.github/workflows/motors-social.yml`) — daily 9am CST, no PC required
- `posted.json` committed back after each run — deduplication across days
- Meta App ID: `915612138190380` · FB Page ID: `1047748735096733` · IG: @roadhousemotorsyxe

---

## KNOWN GAPS (M3 TODO)

Priority order from CLAUDE.md:

1. **Steward verification** — `claimBounty()`: auth steward ≥10k $ROAD, write approval, trigger $ROAD release from treasury PDA
2. **On-chain $ROAD balance** — replace KV fallback with `getTokenAccountsByOwner()` in `lib/solana.ts`
3. **Live tier derivation** — replace hardcoded tier lookup with `getTierFromBalance(balance)` in dashboard
4. **Squads integration** — `lib/squads.ts`: `proposeTreasuryTransfer()`, `approveTransaction()`, `executeTransaction()`
5. **Metaplex NFT** — `lib/metaplex.ts`: `mintFoundingNFT()`, `verifyFoundingNFTOwnership()`
6. **Road monitor** — `lib/road-monitor.ts`: community bucket balance, depletion alert
7. **Public profiles** — `/profile/[wallet]` page
8. **Wallet orphan cleanup** — delete `wallet:{prev}` on re-registration
9. **Listings auth** — verify wallet + tier, pagination
10. **`/api/bounties` route** — not yet built (404 in smoke test)
11. **backfillStripeCustomerIds()** — one-time run required before ops accrual mode

---

## ENVIRONMENT VARIABLES

See CLAUDE.md §ENV VARS for full list. Critical missing at time of writing:
- `NEXTAUTH_URL` — not set (non-critical for wallet-only auth but recommended)
- `NEXT_PUBLIC_ROAD_MINT_ADDRESS` — pending mainnet deploy
- `ROAD_ACCRUAL_MODE` — defaults to `'stripe'`; set to `'ops'` after backfill verified
- `ADMIN_WALLETS` — set to founder wallet(s); comma-separated Solana pubkeys
