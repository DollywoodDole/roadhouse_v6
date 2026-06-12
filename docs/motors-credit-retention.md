# RoadHouse Motors — Credit Application Data Retention Policy

**Entity:** Praetorian Holdings Corp. (DL331386) · Saskatchewan  
**Effective:** 2026-06-12  
**Applies to:** Pre-qualification lead submissions via `motors.roadhouse.capital/credit`

---

## What we collect

When you submit a pre-qualification form we collect:

| Field | Purpose |
|---|---|
| Name, email, phone | Contact and identity |
| Date of birth | Required by lenders for identity verification |
| Social Insurance Number (if provided) | Required by lenders to pull a credit bureau report |
| Home address | Required by lenders; part of bureau inquiry |
| Employment status, employer, income | Lender underwriting criteria |
| Bankruptcy / repossession history | Lender risk assessment |
| Credit self-rating, down payment, co-signer | Pre-qualification routing |
| Vehicle of interest | Matching to inventory |

Collection authority: your explicit consent checkbox on the form, as required by PIPEDA.

---

## How we store it

**Non-sensitive fields** (name, phone, email, employment category, credit tier, vehicle interest) are stored as plain JSON in Vercel KV (Upstash Redis).

**Sensitive PII fields** (DOB, SIN, address, employer details, income, bankruptcy/repo flags) are encrypted using AES-256-GCM before being written to KV. The encryption key is held in Vercel's encrypted environment variable store (`MOTORS_LEAD_ENCRYPTION_KEY`) and is never logged or committed to source control.

All lead data is also delivered to the dealer's notification email inbox (roadhousesyndicate@gmail.com) via Resend for immediate review.

---

## Retention window

**90 days** from the date of submission.

After 90 days, the KV entry expires automatically via Redis TTL. The lead ID remains in the index set but resolves to null on read.

**Rationale:** PIPEDA requires personal information to be retained only as long as necessary for the identified purpose. The purpose of a pre-qualification form is to evaluate financing eligibility — a decision typically reached within 1–2 business days. 90 days provides adequate buffer for follow-up conversations and slower approval pipelines while avoiding indefinite retention of sensitive financial data.

**Note for funded deals:** If an application results in a financed transaction, the complete deal file must be transferred to your Dealer Management System (DMS) before the 90-day KV window closes. DMS retention follows CRA requirements (7 years for financial transaction records). This KV store is intake-only and is not a substitute for proper DMS record-keeping.

---

## Override conditions

If a lender stipulation or provincial regulation requires a longer retention period for denied applications (e.g., 1 year), set `LEAD_TTL_SECONDS` in `app/api/motors/leads/route.ts` to `31536000` (365 days). Document the reason in a code comment. Any change must be reviewed by the dealer principal.

---

## Access

Lead data is accessible only through:

1. **Admin panel** (`/motors/admin`) — authenticated with `MOTORS_ADMIN_SECRET` httpOnly cookie
2. **Machine endpoint** (`GET /api/motors/leads`) — authenticated with `CRON_SECRET` bearer token

No lead data is exposed to the browser or unauthenticated requests. PII fields are decrypted server-side only during admin reads.

---

## Your rights

Under PIPEDA, you may request access to, correction of, or deletion of your personal information by contacting us at:

- **Email:** roadhousesyndicate@gmail.com  
- **Phone:** (306) 381-8222  
- **Address:** Saskatchewan, Canada

Requests are processed within 30 days.

---

## Encryption key rotation

To rotate the `MOTORS_LEAD_ENCRYPTION_KEY`:

1. Generate a new 32-byte key: `openssl rand -base64 32`
2. Update the key in Vercel dashboard (do not commit to source control)
3. Existing encrypted leads from before the rotation cannot be decrypted with the new key. The admin panel will show `piiDecryptError: true` on those records — they can still be read from the email notification archive.
4. After rotation, old leads expire within their original 90-day window.
