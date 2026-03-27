# RoadHouse Governance Specification
*Praetorian Holdings Corp. · Internal Document · v1.0*

> Last updated: 2026-03-26
> Status: Specification only — not yet deployed. See Section 8.

---

## 1. Authority Structure

- **Founder authority:** Dalton Ellscheid holds permanent Class B voting control over
  Praetorian Holdings Corp. This authority is not delegable and cannot be overridden by
  any governance outcome.
- **DAO scope:** Advisory only — governance votes inform but do not override founder
  authority. The DAO is a signal layer, not a command layer.
- **IP and corporate control** remain with Praetorian Holdings Corp. at all times,
  regardless of governance outcomes. No governance proposal can transfer IP, equity,
  or control to DAO participants, token holders, or any community structure.

---

## 2. Governance Stack

| Layer | Tool | Purpose |
|---|---|---|
| Treasury | Gnosis Safe 3-of-5 multisig | Holds and disburses treasury funds |
| Voting | Snapshot (off-chain, gasless) | Community governance signalling |
| Execution | Aragon (on-chain) | Treasury deployments only |

**Configuration:**
- Treasury wallet address: `NEXT_PUBLIC_MULTISIG_WALLET` env var
- Quorum: ≥10% of circulating $ROAD supply
- Voting window: 5 days
- Proposal threshold: any Regular+ member may submit

---

## 3. Proposal Lifecycle

### Phase 1 — Idea (7 days)
- Posted in Discord `#governance-ideas`
- Community temperature check via emoji reaction
- No quorum required
- Goal: identify community interest before formal process begins

### Phase 2 — Temperature Check (3 days)
- Snapshot poll — yes / no / abstain
- Passes if >60% yes with ≥5% participation
- Failed proposals may be resubmitted once after a 14-day cooling-off period
- Founder may reject proposals that violate IP, equity, or authority rules at this phase

### Phase 3 — Formal Vote (5 days)
- Snapshot proposal with full specification attached
- Quorum: ≥10% of circulating $ROAD
- Passes if >66% yes
- Result published in Discord `#governance` and dashboard Treasury tab

### Phase 4 — Execution
- Treasury deployments: Gnosis Safe multisig (3-of-5 signers)
- Non-treasury decisions: Founder implements or delegates
- Timeline: within 14 days of vote close
- All execution transactions are on-chain and publicly verifiable

---

## 4. Multisig Signer Structure

**Threshold:** 3-of-5 signers required to execute

| Seat | Role | Selection | Term |
|---|---|---|---|
| 1 | Founder | Permanent | Permanent |
| 2 | Steward | Elected by Steward+ tier | Annual |
| 3 | Steward | Elected by Steward+ tier | Annual |
| 4 | Partner | Elected by Partner+ tier | Annual |
| 5 | External Advisor | Founder-appointed | 12-month term |

- **Signer rotation:** annual election for seats 2–4, conducted via Snapshot
- **Emergency removal:** founder authority only — initiates via remaining threshold signers
- **Key management:** hardware wallet (Ledger) required for Founder seat; strongly
  recommended for all elected signers

---

## 5. Treasury Deployment Rules

### Governance vote required:
- Guild bounty pool top-ups
- Event subsidies for Ranch Hand+ tier
- Venture Guild investment proposals (Partner+ vote)
- Grant co-application funding
- Platform infrastructure costs >$500 CAD/month

### Founder discretionary (no vote required):
- Operational costs ≤$500 CAD/month
- Emergency security patches
- Legal and compliance fees

---

## 6. $ROAD Governance Weight

- 1 $ROAD = 1 vote
- No delegation in Phase 1 — direct voting only
- Staked $ROAD (90-day lockup): 1.2× voting weight
- Praetor tier: no additional multiplier beyond staking
- Snapshot strategy: ERC-20 balance-of equivalent (Solana SPL via off-chain snapshot)

---

## 7. Scope Limitations

Governance **cannot:**
- Transfer IP or equity to the DAO, token holders, or any community structure
- Override Class B shareholder authority (Dalton Ellscheid)
- Amend this governance specification without founder co-sign
- Direct operations, content, or brand decisions for Praetorian Holdings Corp.
- Bind Praetorian Holdings Corp. to external contracts

---

## 8. Current Status

| Item | Status |
|---|---|
| Snapshot space | TBD — deploy at $ROAD mainnet |
| Aragon DAO | TBD — deploy at $ROAD mainnet |
| Gnosis Safe | Address in `NEXT_PUBLIC_MULTISIG_WALLET` env var |
| First governance vote | Scheduled Q3 2026 |
| Squads multisig (devnet) | Pending — see `docs/multisig-spec.md` |

**Blocking before deployment:**
- $ROAD mainnet authorized by Dalton Ellscheid (in writing)
- Squads devnet confirmed and tested (see `docs/multisig-spec.md`)
- 5 signer public keys confirmed
- Snapshot space created with RoadHouse space ID
- Aragon DAO deployed with treasury wallet connected
