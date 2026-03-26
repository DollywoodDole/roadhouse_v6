# $ROAD Token — Tokenomics

> Praetorian Holdings Corp. · Saskatchewan, Canada
> Last updated: 2026-03-26
> Status: Pre-launch — off-chain KV tracking only. No mint until mainnet authorized.

---

## 1. Overview

$ROAD is the utility and governance token of the RoadHouse ecosystem. It is not a
security, does not carry profit expectation, and is not inflationary. Its sole
functions are membership gating, governance signalling, contributor rewards, and
a staking multiplier for active members.

All IP remains owned by Praetorian Holdings Corp. Token holders receive no equity,
no dividends, and no claim on treasury assets beyond what governance proposals
explicitly allocate.

---

## 2. Token Parameters

| Parameter | Value |
|---|---|
| Standard | Solana SPL |
| Total Supply | 100,000,000 (100M) — fixed, never inflationary |
| Decimals | 6 |
| Mint Address | [TO BE ADDED at deployment] |
| Network | Devnet until mainnet authorized by Dalton Ellscheid |
| Symbol | $ROAD |

### Why 100M (not 1B)

Praetor tier requires 50,000 $ROAD. At 100M supply that is 0.05% — meaningful
and scarce. At 1B supply it drops to 0.005% — indistinguishable from noise.
Scarcity at the top tiers is a feature, not a side effect. 100M preserves it.

---

## 3. Allocation

| Bucket | % | Tokens | Vesting |
|---|---|---|---|
| Founder | 18% | 18,000,000 | 4yr vest, 1yr cliff |
| Creator | 22% | 22,000,000 | Merit-based release, no fixed schedule |
| Community | 25% | 25,000,000 | Earned via monthly tier accrual |
| Treasury | 25% | 25,000,000 | DAO-controlled, Squads multisig |
| Partners | 10% | 10,000,000 | Vested, terms per agreement |

**Total:** 100,000,000

---

## 4. Utility

### 4.1 Membership Gating

$ROAD balance determines tier access. Tiers are checked on-chain against the
member's connected Phantom wallet. Off-chain KV tracking bridges the gap until
mainnet.

| Tier | $ROAD Required | Monthly Accrual |
|---|---|---|
| Guest | 0 | 0 |
| Regular | 100 | 100 |
| Ranch Hand | 500 | 500 |
| Partner | 2,000 | 2,000 |
| Steward | 10,000 | Manual / invite-only |
| Praetor | 50,000 | Manual / invite-only |

Thresholds are calibrated for 100M fixed supply. Do not change without founder
approval. Changing supply requires re-validating all thresholds.

### 4.2 Governance Voting

$ROAD balance provides governance weight on Snapshot proposals. Voting is
**advisory only** — final decisions rest with Dalton Ellscheid (Class B permanent
voting control) and the Squads multisig co-signers. No proposal can transfer IP,
equity, or override founder authority.

### 4.3 Contributor Rewards

Guild members earn $ROAD allocations from the Creator bucket (22M) for
verified contributions: content milestones, builder PRs, event coordination,
treasury management. Reward amounts are set by guild leads and approved by
the orchestrator agent + Dalton.

### 4.4 Staking Multiplier

Members who hold $ROAD in a designated staking account for ≥90 days receive a
1.2x multiplier on their monthly accrual. Implementation deferred to mainnet.
No APY is advertised or implied — the multiplier is a loyalty mechanic only.

---

## 5. Burn Mechanic

Burn is utility-triggered, not scheduled. No fixed burn percentage is ever
communicated publicly.

| Source | Burn Rate | Trigger |
|---|---|---|
| NFT secondary royalties | 3% of royalty revenue | Per settlement |
| Event ticket revenue | 2% of gross ticket sales | Per event close |

Burn is executed quarterly from the treasury wallet. Burn transactions are
on-chain and publicly verifiable. Burns reduce circulating supply — they do not
benefit any individual wallet.

`lib/burn.ts` → `burnFromRoyalties()`, `burnFromEvents()` — build at NFT launch,
not before.

---

## 6. Pre-Launch Bridge

Until mainnet:

- Balances tracked in Vercel KV (`lib/road-balance.ts`)
- Members who register a Solana wallet via `/portal` are snapshotted
- Airdrop at mainnet is proportional to accrued KV balance
- Founding NFT holders qualify for an additional undisclosed allocation
  (amount not public — announced at launch)

---

## 7. What $ROAD Is Not

- Not a security
- Not a yield-bearing instrument
- Not equity in Praetorian Holdings Corp.
- Not inflationary — supply is fixed at 100M
- Not a replacement for $LUX — $LUX is fully deprecated; $ROAD supersedes it
  in all references, code, and documentation

---

## 8. Legal

$ROAD is a utility token. It does not constitute an investment contract under
the Howey Test. Holders have no expectation of profit derived from the efforts
of others. All platform IP is owned by Praetorian Holdings Corp. (Saskatchewan
CCPC). This document is not a prospectus or offering memorandum.

SR&ED eligibility: token architecture and agent infrastructure development is
logged for potential SR&ED / IRAP grant claims. Log all development hours.
