# RoadHouse Motors — `app/motors/`

> Subdomain: `motors.roadhouse.capital` — white-label dealer inventory for O'Brian's Auto.

## File structure

```
/app/motors/
  layout.tsx              ← isolated layout; OG/Twitter metadata; AutoDealer + Organization JSON-LD; phone (306) 381-8222; footer DL331386
  page.tsx                ← redirect → /motors/inventory
  /inventory/page.tsx     ← server component; KV inventory; filters + sort; ActiveFilterChips; ItemList JSON-LD
  /vehicle/[vin]/page.tsx ← VDP; PaymentEstimator; VehicleLeadForm; StickyCallBar; ReviewCarousel (gated)
                             if vehicle null → SoldVehiclePage (noindex) instead of hard 404
  /used/page.tsx          ← SEO hub "Used Vehicles Saskatchewan"; city links; ItemList JSON-LD
  /[city]/page.tsx        ← geo pages: saskatoon · regina · prince-albert · moose-jaw; LocalBusiness JSON-LD
  /credit/page.tsx        ← pre-qualification form → /api/motors/leads → KV + Resend
  /trade-in/page.tsx      ← sell or trade form
  /privacy/page.tsx       ← privacy policy
  /admin/page.tsx + AdminPanel.tsx (co-located) ← lead admin panel; httpOnly cookie auth (motors-admin, 7d)
  /team/page.tsx          ← Meet the Team; 2-col hero + team grid

/components/motors/
  VehicleCard.tsx · VehicleGallery.tsx · VehicleImage.tsx (unoptimized; onError → rh-coming-soon.svg)
  VehicleLeadForm.tsx · StickyCallBar.tsx · InventoryGrid.tsx
  ScrollToTop.tsx · TradeInBanner.tsx · TradeInForm.tsx
  FilterBar.tsx           ← may be superseded by FilterSidebar — verify before removing
  FilterSidebar.tsx       ← search (keyword: make/model/trim/year/colour) · make · model · year · price · status · body_type · fuel_type · transmission · km; sort (Recently added / Price / Year / Km — built into sidebar); mobile drawer
  ActiveFilterChips.tsx · HeroSection.tsx · PaymentEstimator.tsx · CreditForm.tsx
  ReviewCarousel.tsx      ← parent pages gate with REVIEWS_ENABLED; component returns null when reviews array is empty

/lib/motors/
  storage.ts              ← Upstash Redis CRUD; exports DEALER_ID='obrians'
  scraper.ts              ← Scrapes obrians.ca Webflow CMS; fetchInventorySlugs(), parseListing()
  team.ts · reviews.ts · normalize.ts
                             drivetrain NOT available in Vehicle schema — not scraped from obrians.ca

/types/inventory.ts       ← Vehicle · InventoryFilters · MotorsLead interfaces

/app/api/motors/
  seed/route.ts · credit/route.ts  ← both 410 Gone (deprecated)
  sync/route.ts           ← POST (Bearer CRON_SECRET) scrape+sync; maxDuration=300; Vercel cron 9am CST
                             GET (Bearer CRON_SECRET) returns current inventory count
  lead/route.ts           ← POST (public); → Resend roadhousesyndicate@gmail.com; 60s KV rate limit/phone
  leads/route.ts          ← POST (public) credit form → KV + Resend; GET (CRON_SECRET) all leads
  leads/[id]/route.ts     ← PATCH (CRON_SECRET) update lead status
  trade-in/route.ts       ← POST (public); trade-in form → Resend; 60s KV rate limit/phone
  feed/route.ts           ← GET (Bearer CRON_SECRET) JSON + AAMVA XML export
  feed/catalog/route.ts   ← GET (Bearer CRON_SECRET) RFC 4180 CSV for FB Marketplace
  fb-token-check/route.ts ← GET (Bearer CRON_SECRET) FB page token validity + expiry alert via Resend; daily cron
```

## KV keys

```
motors:inventory:obrians:{vin}   → Vehicle JSON
motors:index:obrians             → Redis SET of VINs
motors:leads:{id}                → MotorsLead JSON
motors:leads:index               → Redis SET of lead IDs
```

## Sync

Vercel cron `0 15 * * *` (9am CST) → `POST /api/motors/sync`. Scrapes obrians.ca Webflow CMS; parses `#listing-info` div; skips `formPrice=1000`; upserts valid vehicles; removes sold VINs. ~116 priced vehicles, $5,900–$96,900. Manual trigger: `POST /api/motors/sync` with `Authorization: Bearer {CRON_SECRET}`.

**CRON_SECRET:** must have NO trailing whitespace — use `printf` not `echo` when setting via Vercel CLI.

**Admin panel:** `https://motors.roadhouse.capital/motors/admin` — login form POSTs to `/api/motors/admin/auth`; sets httpOnly `motors-admin` cookie (7d); no token in URL.

**Admin env vars:**
- `MOTORS_ADMIN_SECRET` — gates the admin cookie auth and admin panel page read. Convention: `{ARM}_ADMIN_SECRET` (future arms: `CAPITAL_ADMIN_SECRET`, `STUDIO_ADMIN_SECRET`).
- `CRON_SECRET` — gates machine endpoints (`/api/motors/sync` POST/GET, `/api/motors/feed`, `/api/motors/leads` GET, `/api/motors/leads/[id]` PATCH). Never shared with browser.

**PII encryption env var:**
- `MOTORS_LEAD_ENCRYPTION_KEY` — base64-encoded 32-byte AES-256-GCM key for credit app PII at rest. Generate: `openssl rand -base64 32`. Set in Vercel dashboard only — never commit. If unset, PII fields are not stored in KV (still delivered via email). See `docs/motors-credit-retention.md`.

**Analytics env var:**
- `NEXT_PUBLIC_META_PIXEL_ID` — Meta Pixel ID for motors subdomain. Set to your Pixel ID (e.g. `1234567890123456`). Fails silently if unset — no pixel fires.

**FB token alert env vars (BATCH 4):**
- `MOTORS_FB_PAGE_ACCESS_TOKEN` — copy of the FB_PAGE_ACCESS_TOKEN GitHub Secret, set in Vercel for the token-check cron.
- `MOTORS_FB_APP_ID` + `MOTORS_FB_APP_SECRET` — Meta app credentials for debug_token expiry introspection.
- `MOTORS_FB_ALERT_EMAIL` — address to receive token-expiry warnings (e.g. `roadhousesyndicate@gmail.com`).

## Constraints (permanent)

- Zero $ROAD, Web3, Solana, or RoadHouse Capital branding on any motors page
- No O'Brian's phone numbers, logos, or dealer name in scraped content displayed to users
- Subdomain isolated — no nav links from main roadhouse.capital site
- All motors routes are FULLY_PUBLIC in proxy.ts
- `next/image` in motors: always use `unoptimized` prop — optimizer causes rendering failures

**Assets:** `/public/motors/` — `rh-motors-header.svg` · `rh-motors-header.jpg` (OG) · `rh-logo.png` (30% watermark on cards) · `rh-coming-soon.svg` · `team/dalton.png`

## M3 TODO (motors)

- **#17 IG Reels** — `PUT /api/motors/reels/upload` → Vercel Blob → public URL → IG `video_url`

## Branch note

**multi-dealer-wip:** 4 commits ahead of main. Contains `lib/motors/storage-multi.ts`, multi-dealer abstraction, `DEALER_ID` parameterization. Do NOT touch until explicitly scoped — merge requires a scoping session.
