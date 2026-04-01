# RoadHouse v6 — Implementation State
> Last updated: 2026-04-01 · M2 complete · M3 active

---

## MILESTONE STATUS

| Milestone | Status | Shipped |
|---|---|---|
| M1 — Web2 Core | ✅ Complete | Stripe, Discord gating, email, member portal |
| M2 — Web3 Architecture | ✅ Complete | Wallet auth, KV economy, dashboard, docs |
| M3 — Adventure NFTs + DAO | 🟢 Active | Steward verification keystone not yet shipped |
| M4 — Claude Agent Team | ⬜ Planned | Orchestrator + specialists |

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

## GOOGLE SHEETS OPS LAYER (roadhouse-ops/)

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
