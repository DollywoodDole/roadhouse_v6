# Motors Counsel Report — Session 001
**Date:** 2026-06-12  
**Scope:** `motors.roadhouse.capital` — O'Brian's Auto white-label inventory platform  
**Process:** Repo-grounded audit across seven lanes. All findings cite actual file paths and line numbers. No assumptions.

---

## THE COUNSEL

| Member | Lane | Primary Question |
|---|---|---|
| The Architect | Repo structure, routing, KV isolation, multi-dealer | Does this scale to dealer #2? |
| The Hunter | Lead gen funnel: forms, Resend, conversion friction | Does a lead survive the pipe end-to-end? |
| The Warden | Security, compliance, PII, rate limiting | What gets us burned? |
| The Cartographer | SEO/geo surface, JSON-LD, sitemap, internal linking | Are we visible where buyers stand? |
| The Herald | Social pipeline: FB/IG, catalog feed, FCAA linter, Reels | Is every unit broadcast, everywhere, correctly? |
| The Appraiser | VDP completeness, vehicle data quality, pricing, trust | Would a buyer trust this listing? |
| The Quartermaster | Analytics, measurement, cron health, cross-cutting glue | Is it actually working, and how would we know? |

---

## 1. THE ARCHITECT — Repo Structure & Multi-Dealer Readiness

### Audit

**Routing isolation** is clean. `proxy.ts` rewrites `motors.roadhouse.capital/*` → `/motors/*` before auth runs (proxy.ts:82–96). `/motors` and `/api/motors` are in the `FULLY_PUBLIC` array — no session, no bleed from the main RH auth system. The subdomain boundary is solid.

**KV namespace** is appropriately scoped: all keys prefixed `motors:inventory:obrians:`, `motors:leads:`, `motors:index:obrians`. No cross-contamination with main RH KV keys.

**DEALER_ID hardcoding** is the multi-dealer gap:

- `lib/motors/storage.ts:4` — `export const DEALER_ID = 'obrians'` (module-level global)
- Imported and used directly in: `app/motors/inventory/page.tsx:3,164`, `app/motors/vehicle/[vin]/page.tsx:7,23,160`, `app/motors/used/page.tsx:3,68`, `app/api/motors/sync/route.ts:6`, `app/api/motors/feed/route.ts:2`, `app/api/motors/feed/catalog/route.ts:2`

Storage functions in `lib/motors/storage.ts:13–123` **do** accept a `dealer_id` parameter — the function layer is multi-dealer ready. The application layer is not. Adding dealer #2 would require:

1. Promoting `DEALER_ID` from global export to request-scoped context (subdomain → dealer map in proxy.ts or a new `lib/motors/context.ts`)
2. Threading that context into 6 API routes + 2 page server components
3. Merging `multi-dealer-wip` (4 commits ahead, contains `lib/motors/storage-multi.ts` — **do not touch until scoped**)

**`FilterBar.tsx`** is noted in CLAUDE.md as potentially superseded by `FilterSidebar.tsx`. `FilterBar.tsx` exists in `components/motors/` and should be verified as dead code before removal — risk of implicit import elsewhere.

**Scraper coupling:** `lib/motors/scraper.ts` is tightly coupled to obrians.ca's Webflow CMS structure (`#listing-info` div attributes, `jetboost-list-item` class, `VEHICLE_CDN = '620fb02195ca806649283a5d'`). A second dealer on a different CMS would require a new scraper module — acceptable, but the normalized output schema (`types/inventory.ts`) is the correct abstraction layer and should remain dealer-agnostic.

### Proposals

| # | Proposal | Effort | Impact |
|---|---|---|---|
| A1 | Extract dealer context from subdomain in proxy.ts → inject `x-dealer-id` request header; consume in API routes | M | 5 — unblocks multi-dealer without branch merge |
| A2 | Confirm `FilterBar.tsx` is dead code; remove it | S | 2 — hygiene |
| A3 | Add `motors:health:{dealer}` KV key written on each sync (timestamp + count) for status dashboards | S | 3 — enables Quartermaster goals |
| A4 | Document scraper abstraction contract: `Scraper` interface with `fetchSlugs()` + `parseListing()` signatures so dealer #2 implements the same contract | S | 3 — architectural clarity |

### Biggest Risk

`multi-dealer-wip` exists. If that branch is ever carelessly merged or cherry-picked without a scoping session, it will silently break production DEALER_ID routing for O'Brian's. The CLAUDE.md warning is the only guard.

---

## 2. THE HUNTER — Lead Gen Funnel

### Audit

Three distinct lead types, three distinct form components, three distinct API routes.

**Form field coverage:**

| Form | Component | Key Fields | API Route |
|---|---|---|---|
| Vehicle Inquiry | `VehicleLeadForm.tsx` | name, phone, vehicleInterest (opt), vin (opt) | `POST /api/motors/lead` |
| Credit Pre-Qual | `CreditForm.tsx` | 26 fields: full identity, address, employment, income, credit history, co-signer, trade-in | `POST /api/motors/leads` |
| Trade-In / Sell | `TradeInForm.tsx` | 14 fields: vehicle details, condition, ownership, name, phone, email | `POST /api/motors/trade-in` |

**Data destination:** All three routes write to KV (`motors:leads:{uuid}`, indexed in `motors:leads:index`) AND send a Resend email to `roadhousesyndicate@gmail.com`. Double redundancy — good.

**Admin panel** (`/motors/admin`) displays all leads with status management (new → contacted → approved → closed → dead), source badges, and email delivery status. The funnel has a home.

**Drop-off points identified:**

1. **VehicleLeadForm: name-only, no email.** A missed call means the lead is unrecoverable — phone is the only contact field and it's a free-text input (max 30 chars, not validated to E.164 or 10-digit). A transposed digit = lost lead.
2. **Credit form email field is required on the backend** (`leads/route.ts:117`) but appears optional in the UI — users may skip it, hit a vague 400, and abandon.
3. **No form-level success state guidance** — after submit, user sees generic confirmation with no "what happens next" copy. No email confirmation sent to the submitter.
4. **Trade-in form has no follow-up path.** It captures the vehicle but doesn't prompt the user toward a specific inventory unit or credit pre-qual CTA.
5. **No email back to the lead** — the Resend call only fires outbound to the dealer, never to the customer. No "we got your inquiry" receipt.
6. **PaymentEstimator CTA** (`/motors/credit?vin={vin}&v={label}`) pre-fills the credit form correctly — this is a strong funnel linkage. But the term/rate selections don't survive the navigation (no query param pass-through to CreditForm).
7. **Admin leads panel has no pagination** (`AdminPanel.tsx:88` iterates all leads). With 100+ leads this already degrades; at 500+ it will be slow.

### Proposals

| # | Proposal | Effort | Impact |
|---|---|---|---|
| H1 | Add email field to VehicleLeadForm (optional) + send customer receipt email on all three forms via Resend | S | 5 — single biggest funnel improvement |
| H2 | Validate phone to 10+ digits on VehicleLeadForm (client + server) | S | 3 — recovers transposed-digit leads |
| H3 | Thread PaymentEstimator term/rate params into credit form pre-fill | S | 3 — reduces friction at highest-intent entry point |
| H4 | Add trade-in form CTA: "Browse our inventory while we review your trade" → `/motors/inventory` | S | 2 — captures mid-funnel attention |
| H5 | Paginate admin leads panel (server-side, 20/page) | M | 2 — operational scalability |

### Biggest Risk

No customer-side confirmation email. A lead submits their credit app — income, DOB, bankruptcy history — and receives zero acknowledgment. That's a trust cliff. If the Resend outbound also silently fails (email delivery logged as error but no retry), the lead simply vanishes. Both problems are one Resend call away from being fixed.

---

## 3. THE WARDEN — Security & Compliance

### Audit

**Rate limiting:** `lib/motors/ratelimit.ts` applies a 60-second per-phone window across all three form endpoints. The mechanism is correct but has a critical fail-open flaw: `catch { return true }` (line 24) — if Upstash KV is unreachable, all rate limiting is bypassed. Should be `return false` (deny on KV failure).

**Bot protection:** None. No honeypot fields, no CAPTCHA, no Cloudflare Turnstile. The only protection is per-phone rate limiting. A bot with rotating phone numbers submits unlimited credit applications with synthetic PII. Given what the credit form stores (DOB, income, bankruptcy status), this is a meaningful abuse vector.

**Admin auth (CSRF):** `POST /api/motors/admin/auth` accepts `token` as a form field with no CSRF token validation. An attacker-controlled page can silently POST to this endpoint from a victim's browser session. The cookie is `httpOnly` and `secure` in production — the CSRF issue affects the auth endpoint itself, not the session cookie.

**PII at rest:** The credit form stores to KV plaintext: full name, email, phone, DOB, marital status, full address, time at address, employer, position, annual income, monthly payment, bankruptcy status, repossession history, credit rating, co-signer details. Upstash Redis provides TLS in transit but no encryption at rest on standard plans. Saskatchewan's *Personal Information Protection and Electronic Documents Act* (PIPEDA federal + provincial analog) requires reasonable safeguards — "plaintext in Redis" is defensible under current law but creates liability on breach.

**Consent field not enforced server-side:** `CreditForm.tsx:477` has a UI consent checkbox. `app/api/motors/leads/route.ts:102–179` does not validate that `consent === true` before accepting the submission. A direct POST bypasses the consent gate entirely.

**PII retention:** No TTL on `motors:leads:{id}` keys. Leads accumulate indefinitely. No deletion workflow, no retention policy documented.

**FCAA compliance (Saskatchewan dealer rules):** The `compliance.py` linter covers banned superlatives and financing claim language. The 31-test suite (`tests/test_compliance.py`) is solid. However, **the linter only runs on social media captions** — it does not run on VDP descriptions, hero section copy, or any on-site text. If a salesperson edits the site copy with a "Best Price!" claim, the linter won't catch it.

**Deferred from prior security sprint** (per `security_audit_2026-06-10.md` memory): H4 wallet session auth and H5 ADMIN_WALLETS affect the main app, not motors. No open motors-specific deferred items from that sprint.

### Proposals

| # | Proposal | Effort | Impact |
|---|---|---|---|
| W1 | Fix rate limit fail-open: `catch { return false }` in `lib/motors/ratelimit.ts:24` | S | 4 — closes availability bypass |
| W2 | Add honeypot field (hidden `website` input) to all three forms; reject server-side if populated | S | 3 — deters naive bots |
| W3 | Validate `consent: true` server-side before storing credit app (`leads/route.ts`) | S | 4 — PIPEDA defensibility |
| W4 | Add 90-day TTL to `motors:leads:{id}` KV keys (or an explicit archival workflow) | M | 3 — reduces breach liability surface |
| W5 | Add CSRF double-submit cookie pattern to admin auth route | M | 3 — closes CSRF on admin login |

### Biggest Risk

Unconstrained credit application storage with no retention policy. Saskatchewan's privacy regime requires leads to be held only as long as necessary for the stated purpose. A breach of the current KV dataset exposes DOB, income, bankruptcy, and employer data for every person who submitted a credit app since launch — with no deletion mechanism and no encryption at rest. This is the single highest-severity liability item in the entire motors arm.

---

## 4. THE CARTOGRAPHER — SEO & Geo Surface

### Audit

**JSON-LD coverage is strong:**

| Page | Schemas Present |
|---|---|
| `app/motors/layout.tsx` (sitewide) | `AutoDealer`, `Organization` |
| `app/motors/vehicle/[vin]/page.tsx` | `Car` (brand, model, VIN, itemCondition, mileage, offers, seller), `BreadcrumbList` (3-level) |
| `app/motors/inventory/page.tsx` | `ItemList` (dynamically generated) |
| `app/motors/used/page.tsx` | `LocalBusiness` per city |
| `app/motors/[city]/page.tsx` | `LocalBusiness` per city |

**Notable absences:**
- **`FAQPage` schema** — no FAQ structured data on any page. Credit, trade-in, and financing questions are common vehicle buyer queries with strong local search intent.
- **`AggregateRating` schema** — conditionally added to `AutoDealer` only when `REVIEWS_ENABLED` is true (`layout.tsx:78`) and review count ≥ 3. Currently not live (feature-flagged off).
- **`Event` schema** — no schema for sales events, promotions.

**VDP metadata** (`vehicle/[vin]/page.tsx:21–59`): Dynamic title (year + make + model + trim), dynamic description with specs, explicit `alternates.canonical`, OG image via `opengraph-image.tsx` convention. This is correctly implemented.

**Sold vehicles** return `<SoldVehiclePage>` with `robots: 'noindex'` — correct. No hard 404, no dead URLs in sitemap.

**Geo pages** (`[city]/page.tsx`): Saskatoon, Regina, Prince Albert, Moose Jaw — four cities served. `LocalBusiness` schema per page with city-specific content. The `used/page.tsx` hub links to all four geo pages (internal linking is present). However, the geo pages are only four cities. Saskatchewan has meaningful car-buyer populations in Lloydminster, Swift Current, North Battleford, Yorkton, and Estevan that are not served by dedicated pages.

**Sitemap** (`app/motors/sitemap.ts` exists): Content not audited in this session — should be verified to include all VINs, geo pages, and key static pages, and exclude sold vehicles and admin routes.

**Internal linking gaps:**
- VDP pages do not cross-link to related vehicles (same make, same price range, same body type). Each VDP is a dead end after the lead form.
- No "Browse all [Make] vehicles" link from a VDP back to a filtered inventory view.
- City pages do not link to specific makes popular in that market.

**Title tag pattern** on inventory page: not audited (server component, dynamic). Should include city/province context for local search.

### Proposals

| # | Proposal | Effort | Impact |
|---|---|---|---|
| C1 | Add `FAQPage` JSON-LD to credit page and trade-in page with 3–5 common financing/trade-in questions | S | 4 — captures financing-intent queries |
| C2 | Add "Similar Vehicles" section to VDP: same make OR same price range ±$5k, max 4 cards | M | 4 — reduces bounce, increases pages/session |
| C3 | Expand geo pages to Lloydminster, Swift Current, North Battleford, Yorkton (copy-gen is cheap with LLM) | M | 3 — incremental Saskatchewan coverage |
| C4 | Audit and verify `sitemap.ts`: all VINs included, sold excluded, geo pages included, admin excluded | S | 3 — GSC indexation health |
| C5 | Enable `AggregateRating` schema once ≥ 3 Google reviews are collected | S | 4 — rich snippet eligibility for dealer searches |

### Biggest Risk

No cross-VDP internal linking. Every vehicle detail page is an island. A visitor who doesn't convert on one unit has no algorithmic nudge to the next. This is both an SEO problem (shallow crawl depth, low pages/session signal) and a conversion problem. "Similar Vehicles" is the single highest-leverage SEO/UX addition.

---

## 5. THE HERALD — Social Pipeline

### Audit

**Pipeline health is good.** 335+ vehicles posted since May 9, 2026. `posted.json` shows 100% success rate on sampled entries. The GitHub Actions workflow fires at 9am CST daily, posts 6 vehicles per run to FB + IG, commits `posted.json` back with `[skip ci]`, and manages the token lifecycle with a 14-day expiry warning.

**FCAA compliance linter** (`compliance.py`) is mature: covers banned superlatives, urgency language, and illegal financing claims. 31 tests. This is above-average for a dealer of this size.

**Platform differentiation:** Captions are generated platform-specifically via Claude (`claude-opus-4-6`). `--auto-theme` generates thematic variation per run. This is correct.

**FB Marketplace catalog feed** (`/api/motors/feed/catalog/route.ts`): RFC 4180 CSV with 27 columns. Drivetrain column is always empty (by design, not scraped from obrians.ca). The feed is gated by `CRON_SECRET` — it must be pulled externally to surface on Marketplace. Whether Facebook is actually consuming this feed regularly is unknown (no instrumentation).

**Reels pipeline status:**
- `reels.py` publishes Ken Burns-style 9:16 MP4 to **Facebook Reels** — this works.
- **Instagram Reels is blocked** (error 2207076) — needs a public video URL. `reels.py` requires Vercel Blob. This is M3 TODO #17 in `app/motors/CLAUDE.md`.
- `ENABLE_REELS=true` in GitHub vars, `--reels-only` flag exists. One vehicle has a `reel_posted_at` entry in `posted.json`.

**Token health:** `check_fb_token()` warns at 14 days before expiry but there is no automated renewal path. When the token expires, the daily run silently fails. The only notification is a warning log in GitHub Actions output.

**Caption quality control:** No A/B testing of caption variants. No engagement feedback loop — the pipeline generates and posts but never reads back reach, saves, or shares to improve future prompts. Claude generates captions cold every run with no signal about which styles performed.

**`posted.json` as audit trail:** 1385 lines committed to the repo. This works but will grow unboundedly. At 6 posts/day, the file will hit 10,000+ entries in ~4.5 years — manageable but worth planning a rotation strategy eventually.

### Proposals

| # | Proposal | Effort | Impact |
|---|---|---|---|
| He1 | Implement Vercel Blob upload in `PUT /api/motors/reels/upload` to unblock IG Reels (M3 TODO #17) | M | 5 — extends reach to IG Reels audience |
| He2 | Add FB Insights API read-back after 48h: fetch reach/engagement for recent posts, append to `posted.json`, use top-3 captions as few-shot examples in next Claude prompt | L | 4 — closes the feedback loop; improves caption quality over time |
| He3 | Add Slack/email alert when `FB_PAGE_ACCESS_TOKEN` expires or any run produces zero successful posts | S | 3 — operational awareness |
| He4 | Verify Facebook Marketplace catalog feed is actually being consumed: check catalog manager in Meta Business Suite, confirm `feed/catalog` route is being polled | S | 3 — may reveal silent failure |
| He5 | Archive `posted.json` entries older than 180 days into `posted_archive_YYYY.json` to keep the active file lean | S | 1 — hygiene |

### Biggest Risk

FB token expiry with no automated alerting to the non-technical operator. The daily post run silently produces zero output. O'Brian's (or Dalton) would only notice if they check the Facebook page manually. A missed week of posts during peak selling season (spring/summer) costs real leads. A 14-day warning log in GitHub Actions output is not an operational alert.

---

## 6. THE APPRAISER — Vehicle Data & VDP

### Audit

**Vehicle schema** (`types/inventory.ts:3–28`):

Present fields: `vin`, `stock_number`, `year`, `make`, `model`, `trim`, `body_style`, `mileage`, `price`, `msrp` (opt), `status`, `images[]`, `fuel_type`, `transmission`, `exterior_color`, `interior_color`, `features[]`, `description` (opt), `updated_at`, `firstSeenAt` (opt), `previousPrice` (opt), `priceDroppedAt` (opt).

**Missing fields (by design or gap):**

| Field | Status | Impact |
|---|---|---|
| `drivetrain` (2WD/AWD/4WD) | Not scraped from obrians.ca — documented gap | High — top filter criteria for SK buyers |
| Engine displacement / cylinders | Not captured | Medium |
| Horsepower / torque | Not captured | Low — relevant for truck/performance buyers |
| Safety ratings (NHTSA/IIHS) | Not captured | Medium — trust signal |
| Warranty info (remaining OEM) | Not captured | High — used vehicle differentiator |
| Service history / # of owners | Not captured | High — trust signal |
| Days on lot | Derivable from `firstSeenAt` but not surfaced on VDP | Medium |

**`msrp` vs `price`:** `msrp` is optional. When present, savings could be displayed ("Save $X vs MSRP"). Currently unused on VDP — confirmed by absence of savings display in component audit. This is low-effort, high-trust-signal improvement.

**`previousPrice` / `priceDroppedAt`:** Price drop data is scraped and stored but **not surfaced on VDP or inventory grid**. "Price Reduced" badges are a proven conversion driver.

**PaymentEstimator** (`components/motors/PaymentEstimator.tsx`):
- Rate tiers: Prime 4.99% → Sub-Prime 19.99% (5 tiers)
- Terms: 36/48/60/72/84 months
- Output: bi-weekly + monthly payment
- Doc fee: hardcoded constant from `lib/motors/payments.ts`
- **FCAA note:** Payment estimates are on-site, not in social captions. FCAA rules on advertising financing terms apply to advertising, not necessarily an on-site calculator with disclosures — but the calculator should have a disclaimer ("OAC — On Approved Credit. Rate varies by credit profile."). Auditing whether this disclaimer is present was not completed in this session.

**VDP completeness:** Strong. Gallery, specs table, PaymentEstimator, VehicleLeadForm, TradeInBanner, StickyCallBar, optional ReviewCarousel. The page has all the conversion elements. The trust gap is data completeness (no warranty, no history) and no social proof beyond the feature-flagged ReviewCarousel.

**Images:** `next/image` with `unoptimized` prop throughout (`VehicleImage.tsx`, per CLAUDE.md constraint). Fallback to `rh-coming-soon.svg` on error. Watermark (30% opacity RH logo) applied in social posts, not on site. Image load failure on VDP is gracefully handled.

**Stale / sold units:** `status: 'sold'` renders `SoldVehiclePage` with `noindex`. No stale-unit detection (e.g., units not updated in >14 days that are still `available`). The sync runs daily at 9am CST — staleness window is max 24 hours under normal conditions.

### Proposals

| # | Proposal | Effort | Impact |
|---|---|---|---|
| Ap1 | Surface `previousPrice` / `priceDroppedAt` as "Price Reduced" badge on `VehicleCard.tsx` and VDP hero | S | 5 — proven conversion driver, data already exists |
| Ap2 | Display `msrp` vs `price` savings on VDP when `msrp` is present | S | 3 — trust signal at zero data cost |
| Ap3 | Add "OAC" disclaimer to PaymentEstimator output (verify if missing) | S | 4 — FCAA compliance for financing display |
| Ap4 | Add "Days on lot" display derived from `firstSeenAt` — subtle trust signal for fresh inventory | S | 2 — low effort |
| Ap5 | Investigate drivetrain extraction from obrians.ca listing detail pages (may be in page body, not `#listing-info`) | M | 5 — top filter missing for SK winter-driving buyers |

### Biggest Risk

Price drop data is being scraped and stored (`previousPrice`, `priceDroppedAt` in the Vehicle schema) but not shown to the buyer. This is a free conversion signal being left on the table. Buyers who see a price reduction are more likely to act — and the data is already there.

---

## 7. THE QUARTERMASTER — Measurement, Glue & Cross-Cutting

### Audit

**Analytics: zero.** Grepped across all `app/motors/` and `components/motors/` files for `gtag`, `GA4`, `_fbq`, `posthog`, `mixpanel`, `dataLayer`, `analytics`. Zero hits. The motors subdomain has no page view tracking, no conversion events, no traffic source attribution, no funnel analytics of any kind. `app/motors/layout.tsx` has no `<Script>` tags beyond JSON-LD.

**What this means in practice:**
- No GSC integration verification for motors subdomain (is `motors.roadhouse.capital` separately verified in Search Console?)
- No way to know which geo pages or VDPs drive the most traffic
- No way to know which form (vehicle inquiry vs credit vs trade-in) converts best
- No way to attribute leads to traffic source (organic, social, direct)
- No way to measure bounce rate, session depth, or time-on-VDP
- No way to A/B test anything

**Cron health monitoring** (`app/api/motors/sync/route.ts`):
- Two alerting tripwires: >5 scrape errors OR >20% inventory drop → email to `ALERT_EMAIL`
- Structured JSON logging (`evt: 'motors.sync.scraper_fatal'`) — correct format for Vercel log drain
- No monitoring for cron not-firing (silent cron failure is undetected)
- `GET /api/motors/sync` (CRON_SECRET) returns current inventory count — useful for polling

**Social pipeline instrumentation** (`ops/motors-social/`):
- `posted.json` serves as a basic audit trail (VIN, timestamps, success flags)
- No engagement metrics stored (reach, impressions, reactions)
- GitHub Actions stdout captures run logs but they aren't persisted anywhere accessible

**API route logging:**
- `console.error` used in lead routes for email send failures — correct (structured)
- No request-level logging (no access log, no latency recording, no lead submission count)
- No way to know how many lead submissions fail vs succeed across the API

**Admin panel audit trail:** No record of who accessed the admin panel, when, or what status changes were made. With CRON_SECRET as the only auth gate, all access looks identical in logs.

**Env var hygiene:**
- `MOTORS_ADMIN_SECRET` and `CRON_SECRET` are correctly in Vercel env, not in code
- `ALERT_EMAIL` referenced in sync route but not listed in CLAUDE.md env var table — may need documentation
- `ENABLE_REELS` is a GitHub Vars entry, not a Vercel env var — fine for GH Actions context but worth noting the separation

**Cross-cutting debt left by other counsel members:**
- No IP-level rate limiting (Warden flagged per-phone only)
- No customer receipt email (Hunter flagged)
- No pagination on admin leads (Hunter flagged)
- FB token expiry alerting (Herald flagged)
- Sitemap audit pending (Cartographer flagged)

### Proposals

| # | Proposal | Effort | Impact |
|---|---|---|---|
| Q1 | Install Meta Pixel on motors subdomain (`layout.tsx`): PageView, ViewContent (VDP), Lead (form submit), InitiateCheckout (PaymentEstimator). This also feeds FB ad targeting. | S | 5 — baseline funnel visibility + retargeting pool |
| Q2 | Add GA4 (or Plausible for privacy) to motors subdomain: page views, scroll depth, form submit events | S | 5 — organic search visibility, funnel analysis |
| Q3 | Verify `motors.roadhouse.capital` is separately verified in Google Search Console (root domain alone does not cover subdomain) | S | 4 — GSC coverage gap |
| Q4 | Add `/api/motors/status` endpoint (CRON_SECRET) returning cron last-run time, inventory count, lead count (last 7d), and social last-post VIN — health dashboard primitive | S | 3 — operational visibility |
| Q5 | Add cron not-firing detection: if `motors:health:{dealer}` KV key is >25 hours old, send alert email on next cold request | M | 3 — silent cron failure is currently undetected |

### Biggest Risk

Zero analytics means zero accountability for the platform's effectiveness. O'Brian's (the dealer) has no evidence of how many people visit, browse, or submit leads through this platform — which makes it impossible to justify the relationship, price the service, or optimize for growth. Adding Meta Pixel alone (Q1) costs one afternoon and immediately enables retargeting, attribution, and funnel data.

---

## COUNSEL DEBATE — Conflicts, Overlaps, Dependencies

### Conflicts
- **Cartographer (C3: more geo pages)** vs **Quartermaster (no analytics)**. Expanding geo pages without analytics means no way to measure which cities convert. Defer C3 until Q2 (GA4) is live.
- **Appraiser (Ap5: drivetrain scraping)** vs **Architect scope**. Drivetrain extraction requires scraper changes that could conflict with `multi-dealer-wip`. Tag as "after multi-dealer merge."

### Overlaps
- **Hunter (H1: customer receipt email)** and **Warden (W3: consent enforcement)** both touch `app/api/motors/leads/route.ts`. Should be a single PR.
- **Warden (W1: rate limit fix)** and **Hunter (H2: phone validation)** both touch `lib/motors/ratelimit.ts` + form validation. Same PR.
- **Herald (He3: FB token alerting)** and **Quartermaster (Q4: status endpoint)** both want operational health visibility. A single `/api/motors/status` endpoint + Slack webhook covers both.

### Unlock Dependencies
```
Q1 (Meta Pixel)   → unlocks retargeting for any paid social O'Brian's runs
Q2 (GA4)          → unlocks C3 (geo expansion with data) and funnel analysis for H-series fixes
Q3 (GSC subdomain)→ unlocks Cartographer baseline; should be first action taken
Ap1 (price drop)  → unlocks higher-conversion inventory grid; zero data work needed
W1 (rate fix)     → should ship before any social/paid traffic is driven
He1 (IG Reels)    → highest reach expansion; depends on Vercel Blob setup
```

---

## VERDICT — Unified Roadmap

### Milestone 1 — NOW (Low effort, high impact, no dependencies)
Hardening and quick wins. Ship these as a single sprint.

| Rank | Item | Council Member | Effort | Impact | Why Now |
|---|---|---|---|---|---|
| 1 | Meta Pixel (PageView, ViewContent, Lead, InitiateCheckout) | Quartermaster Q1 | S | 5 | Zero analytics is zero accountability; enables retargeting immediately |
| 2 | Price drop badges on VehicleCard + VDP | Appraiser Ap1 | S | 5 | Data already in KV; pure display change; proven conversion driver |
| 3 | GSC subdomain verification | Quartermaster Q3 | S | 4 | Motors subdomain may not be indexed under root GSC property |
| 4 | Customer receipt email + consent enforcement | Hunter H1 + Warden W3 | S | 4+4 | Single PR; closes PII consent gap + trust cliff in one shot |
| 5 | Rate limit fail-open fix + phone validation | Warden W1 + Hunter H2 | S | 4+3 | Same file; KV-down = open door is unacceptable with credit app data in KV |

### Milestone 2 — NEXT (Medium effort, structural improvements)
Funnel depth + SEO substance + operational visibility.

| Rank | Item | Council Member | Effort | Impact | Why Next |
|---|---|---|---|---|---|
| 6 | GA4 (or Plausible) on motors subdomain | Quartermaster Q2 | S | 5 | Requires pixel first (M1); enables all funnel analysis |
| 7 | FAQ JSON-LD on credit + trade-in pages | Cartographer C1 | S | 4 | Captures financing-intent queries; Saskatchewan dealer FAQ is low competition |
| 8 | Similar Vehicles on VDP | Cartographer C2 | M | 4 | Reduces bounce, increases crawl depth; no data work |
| 9 | FB token expiry alert + `/api/motors/status` health endpoint | Herald He3 + Quartermaster Q4 | S | 3+3 | Single PR; operational visibility that currently doesn't exist |
| 10 | Honeypot fields + admin CSRF fix | Warden W2 + W5 | S | 3+3 | Bot/CSRF hardening before paid traffic drives volume |

### Milestone 3 — LATER (Larger scope, dependencies, or external blockers)
Platform expansion and reach.

| Item | Council Member | Effort | Dependency |
|---|---|---|---|
| IG Reels unblock (Vercel Blob) | Herald He1 | M | M3 TODO #17; Vercel Blob setup |
| PaymentEstimator term/rate pre-fill from VDP | Hunter H3 | S | None — but low urgency vs M1/M2 |
| Lead PII 90-day retention TTL | Warden W4 | M | Legal review of retention policy |
| Drivetrain field investigation + extraction | Appraiser Ap5 | M | Post multi-dealer-wip merge |
| Expand geo pages (4 additional SK cities) | Cartographer C3 | M | GA4 data to prioritize cities |
| Engagement feedback loop for Claude captions | Herald He2 | L | FB Insights API access |
| Admin leads pagination | Hunter H5 | M | Low urgency at current lead volume |
| `AggregateRating` schema (needs ≥3 reviews) | Cartographer C5 | S | Requires Google reviews |

---

## TOP 10 TABLE

| Rank | Title | Lane | Effort | Impact | Milestone |
|---|---|---|---|---|---|
| 1 | Meta Pixel on motors subdomain | Quartermaster | S | 5 | Now |
| 2 | Price drop badges ("Price Reduced") on VehicleCard + VDP | Appraiser | S | 5 | Now |
| 3 | GSC subdomain verification for motors.roadhouse.capital | Quartermaster | S | 4 | Now |
| 4 | Customer receipt email + server-side consent enforcement | Hunter + Warden | S | 4 | Now |
| 5 | Rate limit fail-closed + phone E.164 validation | Warden + Hunter | S | 4 | Now |
| 6 | GA4 / Plausible analytics on motors subdomain | Quartermaster | S | 5 | Next |
| 7 | FAQ JSON-LD on credit + trade-in pages | Cartographer | S | 4 | Next |
| 8 | Similar Vehicles section on VDP | Cartographer | M | 4 | Next |
| 9 | FB token expiry alert + `/api/motors/status` health endpoint | Herald + Quartermaster | S | 3 | Next |
| 10 | Honeypot fields + admin auth CSRF fix | Warden | S | 3 | Next |

---

*Generated: 2026-06-12 — motors-counsel-001. No code changes made in this session.*
