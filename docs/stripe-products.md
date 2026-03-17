# Stripe Products & Price IDs

Stripe account: **Bootstrap Ltd. sandbox** (`acct_1TA4dCDv5Ly4OO7E`)
All prices in **CAD**. Add each price ID to Vercel environment variables.

---

## Memberships — Recurring Monthly

| Product | Price (CAD/mo) | Stripe Price ID | Env Var |
|---------|---------------|-----------------|---------|
| Regular Membership | $9.99 | `price_1TARjSDv5Ly4OO7EkpeRVHqx` | `NEXT_PUBLIC_STRIPE_SUB_REGULAR` |
| Ranch Hand Membership | $29.99 | `price_1TARjfDv5Ly4OO7EKHW7m9rQ` | `NEXT_PUBLIC_STRIPE_SUB_RANCH` |
| Partner Membership | $99.99 | `price_1TARjzDv5Ly4OO7EpVtVPhrp` | `NEXT_PUBLIC_STRIPE_SUB_PARTNER` |

---

## Merch — One-Time

| Product | Price (CAD) | Stripe Price ID | Env Var |
|---------|------------|-----------------|---------|
| RoadHouse Tee | $35.00 | `price_1TARiADv5Ly4OO7EjpVAl2xb` | `NEXT_PUBLIC_STRIPE_PRICE_TEE` |
| RoadHouse Snapback | $40.00 | `price_1TARhODv5Ly4OO7EtU26XcKh` | `NEXT_PUBLIC_STRIPE_PRICE_HAT` |
| Coconut Cowboy Hoodie | $75.00 | `price_1TARiSDv5Ly4OO7E1pSanRFJ` | `NEXT_PUBLIC_STRIPE_PRICE_HOODIE` |
| Sticker Pack | $12.00 | `price_1TARn2Dv5Ly4OO7E5Ci08aGJ` | `NEXT_PUBLIC_STRIPE_PRICE_STICKERS` |
| Whiskey Glass Set (2) | $45.00 | `price_1TARimDv5Ly4OO7EabUVfFXI` | `NEXT_PUBLIC_STRIPE_PRICE_GLASS` |
| Phone Case | $28.00 | `price_1TARizDv5Ly4OO7E3norq216` | `NEXT_PUBLIC_STRIPE_PRICE_PHONE` |

---

## Events — One-Time

| Product | Price (CAD) | Stripe Price ID | Env Var |
|---------|------------|-----------------|---------|
| Saskatchewan Meetup | $25.00 | `price_1TARnVDv5Ly4OO7EVJLj8h6l` | `NEXT_PUBLIC_STRIPE_PRICE_SKMT` |
| RoadHouse Summit | $99.00 | `price_1TARlDDv5Ly4OO7ENLDWGRD9` | `NEXT_PUBLIC_STRIPE_PRICE_SUMMIT` |

---

## Sponsorships — Recurring Monthly

| Product | Price (CAD/mo) | Stripe Price ID | Env Var |
|---------|---------------|-----------------|---------|
| Trail Blazer Sponsorship | $500.00 | `price_1TBheSDv5Ly4OO7EYi3PgfqQ` | `NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_TB` |
| Frontier Sponsorship | $1,500.00 | `price_1TBheTDv5Ly4OO7EiVlaVpIc` | `NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_FR` |
| Praetor Sponsorship | $5,000.00 | `price_1TBheTDv5Ly4OO7ECln0oEKe` | `NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_PR` |

---

## Notes

- **Not yet created:** Adventure NFT ticket products (Lake Trip, Ski Trip, Mediterranean) — planned for M3. Add to `site-config.ts` under `stripe.adventures` when ready.
- **Sponsorship billing:** Stripe subscriptions. The `requestSponsorshipInvoice` function in `Sponsorships.tsx` currently opens a mailto — wire it up to `/api/subscription` once sponsorship checkout is confirmed.
- **Webhooks:** Ensure `STRIPE_WEBHOOK_SECRET` in Vercel matches the signing secret from the Stripe dashboard webhook endpoint pointed at `https://roadhouse.capital/api/webhook`.
