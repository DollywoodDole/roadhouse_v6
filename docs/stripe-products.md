# Stripe Products & Price IDs

All prices in **CAD**. Last updated: 2026-03-22.

To add new products or regenerate after archiving an old price:
```bash
STRIPE_SECRET_KEY=sk_live_... npm run create-prices
```

---

## Memberships — Recurring Monthly

| Product | Price (CAD/mo) | Stripe Price ID | Env Var |
|---------|---------------|-----------------|---------|
| Regular Membership | $19.99 | `price_1TDtTLDv5Ly4OO7EB0NgxoLA` | `NEXT_PUBLIC_STRIPE_SUB_REGULAR` |
| Ranch Hand Membership | $99.99 | `price_1TDtTLDv5Ly4OO7EBsQt7Kl3` | `NEXT_PUBLIC_STRIPE_SUB_RANCH` |
| Partner Membership | $199.98 | `price_1TDtTMDv5Ly4OO7EqrFypjkI` | `NEXT_PUBLIC_STRIPE_SUB_PARTNER` |

Discord role assigned automatically on subscription.
$ROAD accrual: Regular 100/mo · Ranch 500/mo · Partner 2,000/mo

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

## Digital Products — One-Time

| Product | Price (CAD) | Stripe Price ID | Env Var |
|---------|------------|-----------------|---------|
| Creator Playbook | $129.99 | `price_1TDtTNDv5Ly4OO7E1zGSrUoX` | `NEXT_PUBLIC_STRIPE_PRICE_PLAYBOOK` |
| Strategy Toolkit | $295.99 | `price_1TDtTODv5Ly4OO7EQF9nfXtw` | `NEXT_PUBLIC_STRIPE_PRICE_TOOLKIT` |

---

## Events — One-Time

| Product | Price (CAD) | Stripe Price ID | Env Var |
|---------|------------|-----------------|---------|
| Saskatchewan Meetup | $999.00 | `price_1TDtTODv5Ly4OO7EGfwW2sBv` | `NEXT_PUBLIC_STRIPE_PRICE_SKMT` |
| RoadHouse Summit | $1,599.00 | `price_1TDtTPDv5Ly4OO7Er1RCjrZX` | `NEXT_PUBLIC_STRIPE_PRICE_SUMMIT` |
| Summit VIP Pass | $299.00 | `price_1TCXmlDv5Ly4OO7EEPV6lR5J` | `NEXT_PUBLIC_STRIPE_PRICE_SUMMIT_VIP` |

Summit VIP: 25 spots maximum.

---

## Adventures — One-Time Deposits

| Product | Deposit (CAD) | Stripe Price ID | Env Var | Notes |
|---------|--------------|-----------------|---------|-------|
| Lake Trip — BC/AB | $199 | `price_1TCVbjDv5Ly4OO7EUuVOraPt` | `NEXT_PUBLIC_STRIPE_PRICE_ADV_LAKE` | Full refund 30+ days out |
| Ski Trip — Panorama/Whitefish | $299 | `price_1TCVbkDv5Ly4OO7EknTelFmv` | `NEXT_PUBLIC_STRIPE_PRICE_ADV_SKI` | Gated: `NEXT_PUBLIC_SKI_VOTE_RESOLVED=true` |
| Mediterranean | $1,000 | `price_1TDtTQDv5Ly4OO7EFZGYVb2D` | `NEXT_PUBLIC_STRIPE_PRICE_ADV_MED` | Ranch Hand+ only · $500 non-refundable within 14 days |

---

## Sponsorships — Recurring Monthly

| Product | Price (CAD/mo) | Stripe Price ID | Env Var |
|---------|---------------|-----------------|---------|
| Trail Blazer | $1,000 | `price_1TDtTQDv5Ly4OO7EvRXXuqRE` | `NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_TB` |
| Frontier | $2,500 | `price_1TDtTSDv5Ly4OO7EJex8Efpb` | `NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_FR` |
| Praetor | $10,000 | `price_1TDtTSDv5Ly4OO7EU39UyWcs` | `NEXT_PUBLIC_STRIPE_PRICE_SPONSOR_PR` |

---

## Notes

- **Stripe account:** `acct_1TA4dCDv5Ly4OO7E` (test mode)
- **Currency:** All CAD
- **Price updates:** Stripe prices are immutable — archive old price in dashboard, re-run `npm run create-prices`, update Vercel env var
- **Webhooks:** `STRIPE_WEBHOOK_SECRET` in Vercel must match signing secret for `https://roadhouse.capital/api/webhooks/stripe`
- **Ski Trip:** deposits gated behind `NEXT_PUBLIC_SKI_VOTE_RESOLVED=true` — flip after Snapshot vote closes
