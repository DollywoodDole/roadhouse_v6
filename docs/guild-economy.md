# RoadHouse Guild Economy

**Version:** 1.0
**Status:** Internal Reference — Pre-M3
**Audience:** Developers building steward verification, guild stewards, grant reviewers (Mitacs/SaskInnovates)

---

## Overview

The guild economy is a single loop with four layers. These layers have been described separately across the codebase and documentation — this document defines the canonical structure and the relationships between layers.

```
GUILD (organisational structure)
  └── BOUNTY (task layer)
        └── CONTRIBUTION (record layer)
              └── $ROAD ACCRUAL (reward layer)
```

Understanding each layer independently and how they connect is the prerequisite for building the steward verification feature — the critical missing piece before M3.

---

## Layer 1 — Guild (Organisational Structure)

The four guilds are the permanent organisational units of the RoadHouse community. Every contributor belongs to at least one guild. Guilds are not teams — they are domains. A member can contribute across guilds; their primary guild is where their verified contribution weight accumulates.

| Guild | Domain | Responsibilities | Primary KPI |
|---|---|---|---|
| Media Guild | Content Creation | Streaming, VOD clipping, social media management, translation and localisation | Monthly reach & watch time |
| Builder Guild | Tech & Platform | Dashboard development, tokenomics tooling, analytics infrastructure, smart contract audits | Platform uptime & DAU |
| Frontier Guild | Events & Compound | Physical events, compound operations, merchandise coordination, hospitality logistics | Event revenue & attendance |
| Venture Guild | Treasury & Investments | Deal sourcing, due diligence, portfolio management, grant application support | IRR & treasury growth |

### Guild Governance

Each guild is governed by one or more Guild Stewards — Steward-tier ($ROAD ≥ 10,000) members who have been elected or appointed to verify contributions and manage the quarterly allocation pool.

Guild stewards are responsible for:
- Reviewing and approving contribution submissions before $ROAD release
- Managing the guild's quarterly $ROAD allocation pool
- Proposing and publishing bounties within their domain
- Reporting guild KPIs to the community treasury on a quarterly basis

---

## Layer 2 — Bounty (Task Layer)

Bounties are the task interface of the guild economy. They make contribution legible — specific, scoped, and rewardable. Without bounties, contribution is ambiguous. With bounties, contribution is verifiable.

### Bounty Structure

Every bounty contains:

| Field | Description |
|---|---|
| `id` | Unique identifier (guild prefix + sequential number, e.g. MEDIA-047) |
| `guild` | Originating guild |
| `title` | Short task name |
| `description` | Full task scope — what done looks like |
| `deliverable` | Specific output required for approval (link, file, on-chain tx, screenshot) |
| `$ROAD reward` | Amount released upon steward approval |
| `deadline` | Optional — open bounties have no deadline |
| `steward` | Approving steward wallet address |
| `status` | open / claimed / submitted / approved / rejected |

### Bounty Lifecycle

```
PUBLISHED (steward creates bounty)
  → OPEN (visible to all eligible members)
    → CLAIMED (member signals intent, bounty locked to claimant for deadline period)
      → SUBMITTED (member submits deliverable with proof)
        → APPROVED (steward verifies, $ROAD released from treasury PDA)
        → REJECTED (steward rejects with reason, bounty returns to OPEN)
```

### Milestone Bounties (Special Category)

One-time $ROAD grants for defined community milestones — not repeatable, not claimable by the same wallet twice:

| Milestone | $ROAD Grant |
|---|---|
| First 100 followers referred | TBD |
| First event organised | TBD |
| First code deployment to production | TBD |
| First partnership sourced | TBD |

Milestone bounties are auto-verified by on-chain or platform data where possible (referral tracking, deployment records). Where auto-verification is not possible, steward manual verification applies.

---

## Layer 3 — Contribution (Record Layer)

The contribution record is the permanent, auditable history of community labour. It is the source of truth for $ROAD accrual, steward verification, and grant reporting.

### Where Contributions Are Logged

All contributions are logged in a public Notion/GitHub workspace before $ROAD is released from the treasury PDA. The record must be public — this is the transparency mechanism that makes the loyalty programme legally defensible and makes the community's labour visible to grant reviewers.

### Contribution Record Fields

| Field | Description |
|---|---|
| `contributor_wallet` | Solana wallet address of contributor |
| `bounty_id` | Linked bounty (or MILESTONE for milestone grants) |
| `guild` | Guild domain of the contribution |
| `deliverable_link` | URL or on-chain reference to the submitted work |
| `steward_wallet` | Approving steward's wallet address |
| `approved_at` | Timestamp of steward approval |
| `$ROAD_released` | Amount released from treasury PDA |
| `tx_hash` | On-chain transaction hash of $ROAD release |

### Why the Record Matters Beyond $ROAD

The contribution record serves three audiences simultaneously:
1. **Members** — transparent record of what earns what; no opacity in reward distribution
2. **Lawyers** — auditable proof that $ROAD is earned through labour, not purchased — critical for securities positioning
3. **Grant reviewers** — quantified community labour demonstrates programme viability for SR&ED, Mitacs, and SaskInnovates applications

---

## Layer 4 — $ROAD Accrual (Reward Layer)

The $ROAD accrual is the terminal step of the loop. When a contribution is approved by a steward, $ROAD is released from the treasury Program Derived Address (PDA) to the contributor's wallet. The release is on-chain, auditable, and irreversible.

### Accrual Mechanics

| Mechanism | Description |
|---|---|
| Standard release | $ROAD released from treasury PDA upon steward approval |
| Staking multiplier | Members staking $ROAD for 90+ days receive 1.2× multiplier on reward distributions |
| Quarterly pool | Each guild operates from a quarterly $ROAD allocation pool governed by guild stewards |

### Tier Advancement

$ROAD balance gates membership tiers. As a contributor accrues $ROAD through verified contributions, they advance through the tier ladder:

| Tier | $ROAD Required | Key Unlock |
|---|---|---|
| Guest | 0 | Public content, read-only |
| Regular | 100 | Community chat, minor voting |
| Ranch Hand | 500 | Guild participation, revenue-share eligibility |
| Partner | 2,000 | Guild leadership candidacy, treasury visibility |
| Steward | 10,000 | Multisig co-signer, governance proposal submission |
| Praetor | 50,000 | Board advisory role, venture deal flow |

Reaching Ranch Hand tier (500 $ROAD) through contribution is the primary organic qualification pathway for the Founding NFT credential. See `membership-model.md` for the full NFT qualification framework.

---

## The Critical Missing Piece: Steward Verification

The guild economy loop is complete conceptually. The missing implementation piece before M3 is steward verification — the mechanism by which guild stewards approve contributions and trigger $ROAD release from the treasury PDA.

### What steward verification must do

1. **Authenticate the steward** — confirm the approving wallet holds Steward-tier ($ROAD ≥ 10,000) status and is an assigned steward for the relevant guild
2. **Link approval to contribution record** — write the steward wallet address and approval timestamp to the contribution record in Notion/GitHub
3. **Trigger $ROAD release** — execute the treasury PDA disbursement for the approved amount
4. **Emit on-chain event** — log tx hash back to the contribution record for auditability
5. **Update bounty status** — mark the bounty as approved and close it to further claims

### Why this must be built before other M3 features

Without steward verification:
- $ROAD cannot be distributed to contributors
- The contribution record has no verified entries
- Tier advancement based on earned $ROAD is blocked
- NFT qualification through the Ranch Hand pathway is not verifiable
- Grant applications citing "community contribution infrastructure" have no auditable evidence

**The steward verification feature is the keystone. Everything else in M3 depends on it.**

---

## Quarterly Guild Cycle

| Phase | Activity |
|---|---|
| Month 1 | Stewards publish bounties for the quarter; quarterly $ROAD pool set by governance vote |
| Month 2 | Contributions active; stewards reviewing and approving on rolling basis |
| Month 3 | Final approvals; quarterly $ROAD pool disbursed; guild KPI report published |
| Between cycles | Steward election/confirmation for following quarter |

---

## Grant Narrative — Guild Economy as Research Infrastructure

For Mitacs Accelerate, SaskInnovates, and SR&ED applications, the guild economy is described as an applied coordination experiment — not a community feature.

**The research framing:**

> "RoadHouse operates a documented contribution and reward system across four functional domains. Contributor behaviour, task completion rates, reward elasticity, and community governance participation are tracked and measured. This generates applied research data on decentralised coordination, community-based labour markets, and digital cooperative governance — directly relevant to Mitacs research partnerships in organisational behaviour, economics, and technology."

The guild economy is the research apparatus. The $ROAD accrual is the variable being measured. The contribution record is the dataset. This framing satisfies a Mitacs reviewer without touching the token or membership product as a commercial product.

---

*Praetorian Holdings Ltd. — Confidential — March 2026*
