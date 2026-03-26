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

### 4.3 Emission Sustainability — Burn Offset Model

**The Problem**
Monthly $ROAD accrual via membership subscriptions draws from the
Community Allocation (25M tokens, 25% of fixed 100M supply). At
meaningful scale this bucket depletes. There is no inflation
mechanism — supply is fixed at genesis.

**The Mechanism: Burn Offset**
Net monthly emission = Gross emission − Burns executed that month

- Gross emission: sum of all active subscription accruals
  (Regular: 100/mo · Ranch Hand: 500/mo · Partner: 2,000/mo)
- Burns executed: ecosystem activity-triggered burns per Section 5
  (3% of NFT secondary royalties + 2% of event ticket revenue,
   converted to $ROAD and burned quarterly)

When burn volume is high (active marketplace, strong events),
net emission slows automatically. When ecosystem activity is low,
net emission runs at gross rate. No artificial cap is imposed —
scarcity is a function of real usage, not a scheduled mechanism.

**The Floor Rule**
If the community bucket balance reaches zero, subscription accruals
pause until burn events restore the bucket above zero. Members
retain their tier — only new $ROAD accrual pauses. No tokens are
clawed back. The pause is announced publicly via governance
notification minimum 30 days before projected depletion.

**Emission Scenarios at 100M Fixed Supply**

| Community Members | Gross/mo | Burn Offset* | Net/mo | Bucket Life |
|---|---|---|---|---|
| 100 (launch) | ~41,000 | ~5,000 | ~36,000 | 694 months |
| 500 (growth) | ~140,000 | ~20,000 | ~120,000 | 208 months |
| 2,000 (scale) | ~500,000 | ~100,000 | ~400,000 | 62 months |
| 5,000 (target Y3) | ~1,200,000 | ~300,000 | ~900,000 | 28 months |

*Burn offset estimate assumes proportional growth in NFT and event
 activity with community scale. Actual burn will vary.

**Key Properties**
- No inflation — supply remains fixed at 100,000,000
- No APY guarantee — no specific return is ever communicated
- Scarcity is activity-driven — the more the ecosystem produces,
  the longer emissions last
- Floor rule prevents silent depletion — community is notified
  before any accrual pause
- No tokens are ever minted to refill the bucket — the model
  works within the fixed supply or it doesn't work at all

**Pre-Mainnet Requirement**
Before $ROAD mainnet deployment, a community bucket monitor must
be implemented: a read function that returns current community
bucket balance, projected months to depletion at current run rate,
and triggers the 30-day governance notification at < 6 months
remaining. This is an M3 deliverable.

---

### 4.4 Contributor Rewards

Guild members earn $ROAD allocations from the Creator bucket (22M) for
verified contributions: content milestones, builder PRs, event coordination,
treasury management. Reward amounts are set by guild leads and approved by
the orchestrator agent + Dalton.

### 4.5 Staking Multiplier

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
