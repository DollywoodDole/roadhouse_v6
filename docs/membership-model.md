# RoadHouse Membership Model

**Version:** 1.0
**Status:** Internal Reference — Pre-M3
**Audience:** Legal counsel, grant reviewers, developers, community stewards

---

## Overview

RoadHouse membership is a four-function bundle. Each function has a distinct legal character, a distinct revenue role, and a distinct relationship with the others. Understanding how they interact — and where their boundaries are — is critical for legal positioning, grant eligibility, and member communication.

The four functions are:

| Function | Legal Character | Revenue Role |
|---|---|---|
| **Subscription** | Service contract | Predictable MRR |
| **$ROAD Accrual** | Loyalty programme | Retention mechanism |
| **Governance Weight** | Membership right | Token holding incentive, churn reduction |
| **NFT Credential** | Cultural artefact | One-time treasury building event |

These are not four versions of the same thing. They are four distinct instruments that operate in parallel and reinforce each other. The grant strategy, securities positioning, and member communication all depend on keeping this distinction clear.

---

## Function 1 — Subscription (Service Contract)

**What it is:** A recurring payment for access to the RoadHouse platform, community infrastructure, and content library.

**Legal framing:** Standard SaaS service contract. The member pays for a defined set of services delivered by RoadHouse Hospitality Ltd. No profit expectation, no ownership claim, no governance right granted by subscription alone.

**What it includes:**
- Access to tiered Discord channels corresponding to subscription tier
- VOD library and exclusive content archive
- Monthly community call access
- Guild participation eligibility (contribution rights unlocked at Ranch Hand tier)

**What it does not include:**
- $ROAD token accrual (separate mechanism, earned not purchased)
- Governance voting rights (requires $ROAD balance, not subscription status)
- NFT credential (separate qualification pathway)

**Pricing (current):**
- Guest: Free — public content, read-only community
- Regular: Entry subscription — community chat, minor voting
- Ranch Hand: Standard tier — guild participation, revenue-share eligibility
- Partner: Senior tier — guild leadership candidacy, treasury visibility
- Steward: Governance tier — multisig co-signer, proposal submission rights
- Praetor: Advisory tier — board advisory role, venture deal flow

**Revenue note:** Subscription revenue flows through RoadHouse Hospitality Ltd. and is remitted to Praetorian Holdings Ltd. as dividend after working capital reserves are maintained.

---

## Function 2 — $ROAD Accrual (Loyalty Programme)

**What it is:** A community currency earned through verified contributions, continued membership, event attendance, referrals, and content creation. Not purchased. Not sold.

**Legal framing:** Loyalty programme. The established precedent is Air Miles, Starbucks Stars, credit card points. $ROAD is a reward for behaviour, not an investment vehicle. No APY is communicated. No profit expectation is created or implied. $ROAD holders are never told they will receive financial returns from others' efforts.

**How it is earned:**
- Verified guild contributions (content, code, events, sourcing) — logged in public Notion/GitHub workspace, verified by guild stewards
- Milestone grants: first 100 referrals, first event organised, first code deployment, first partnership sourced
- Staking multiplier: members who stake $ROAD for 90+ days receive 1.2× multiplier on reward distributions

**What it unlocks:**
- Membership tier advancement (balance gates access tiers as defined in the tier table above)
- Event privileges: priority registration, discounted entry, VIP access at Ranch Hand and above
- Governance participation weight: voting power on community proposals through Snapshot (off-chain) and Realms (on-chain), within advisory scope only
- NFT qualification pathway: accumulating to Ranch Hand tier through $ROAD is one of the primary qualification routes for Founding NFT status

**What it is not:**
- A financial instrument
- A share, bond, or security
- A promise of monetary return
- Purchasable directly (the only route to $ROAD is contribution or milestone completion)

**Token supply (fixed at genesis):**

| Allocation | Share | Mechanism |
|---|---|---|
| Founder | 18% | 4-year linear vesting, 1-year cliff |
| Creator | 22% | Merit-based, verified contribution |
| Community | 25% | Participation, events, referrals |
| Treasury | 25% | DAO-governed; deployed via vote |
| Partner | 10% | Strategic partners, advisors; negotiated vesting |

---

## Function 3 — Governance Weight (Membership Right)

**What it is:** The ability to vote on community proposals, submit governance proposals (Steward tier), and co-sign treasury disbursements (Steward tier multisig). Voting weight is proportional to $ROAD balance.

**Legal framing:** Cooperative/DAO hybrid membership right. Governance participation is advisory — it does not constitute directorial authority over Praetorian Holdings Ltd. or any corporate entity. The $ROAD governance token and any DAO voting mechanism is explicitly limited to advisory and community participation functions.

**Scope of governance (what token holders can vote on):**
- Community treasury allocations below $5,000 CAD threshold
- Guild proposals and working group formation
- Community events and programming suggestions
- Minor product features and community platform improvements
- Contributor rewards and recognition

**Outside governance scope (founder/corporate authority only):**
- Corporate strategy and expansion decisions
- IP ownership, licensing, or encumbrance
- Equity issuance and investor terms
- Executive appointments or removals
- Treasury allocations above $5,000 CAD threshold

**Communication requirement:** Every member-facing document, onboarding flow, and governance forum must make the advisory nature of governance explicit. "$ROAD holders participate in the RoadHouse ecosystem; they do not govern the enterprise." This framing must be maintained consistently to protect securities positioning.

---

## Function 4 — NFT Credential (Cultural Artefact)

**What it is:** An on-chain proof of founding membership status. A record of participation, not a financial instrument. The Founding Membership NFT marks the holder as one of the first 500 members of the RoadHouse community — a cultural fact with functional utility.

### The Reframe: Qualify, Don't Buy

The primary narrative shift for M3 and beyond:

> The Founding NFT is not something you purchase. It is something you qualify for.

This reframe is supported by precedent: Cabin DAO founding membership, Soho House founding member programmes, VitaDAO participation credentials. The credential derives its value from what it represents — verified early participation — not from its purchase price.

**Removal of the 3 SOL price from primary narrative:** The price point does not lead the story. The credential status leads the story. An optional mint fee exists for members who want to accelerate their qualification, but it is presented as an acceleration mechanism, not the primary acquisition pathway.

**Qualification trigger conditions (any one of the following):**
1. Reaching Ranch Hand tier organically through subscription + verified contribution
2. Attending the first physical compound event in person
3. Completing a full DeSci protocol sprint (30-day verified participation)
4. Being among the first 500 wallets registered in the founding member waitlist

**Optional mint fee:** Members who have not yet reached Ranch Hand tier organically may pay to accelerate their qualification. This separates credential value from purchase price — the critical distinction for securities positioning.

### Technical Specification

- **Standard:** Metaplex Token Metadata Standard on Solana
- **Supply:** 500 maximum — fixed, no additional minting
- **Transferability:** Soul-bound (non-transferable) for 12 months post-mint
- **Royalties:** 5% on secondary market sales, accruing to community treasury
- **On-chain attributes:** Tier designation, mint date, access rights, event privileges

### Bundled Value (per Founding NFT)

- Steward-tier access for 12 months
- $ROAD airdrop at mainnet launch (quantum intentionally undisclosed until mainnet — see securities note below)
- VIP access to first three RoadHouse events
- Exclusive Discord role and channel access
- Name in founding member register

### Securities Positioning — Critical Notes

**$ROAD allocation disclosure:** The undisclosed $ROAD allocation for founding members is intentionally vague until mainnet. This is correct. The framing must be:

> "Founding members will receive recognition at mainnet. The form of that recognition is being determined."

Not: "Buy this NFT and receive a $ROAD allocation." The former is a community statement. The latter is a profit expectation attached to a purchase — the definition of a security under the Howey test.

**The four legal characters in combination:**

| If you lead with... | Legal exposure |
|---|---|
| "Buy this NFT and receive tokens" | Securities territory |
| "Pay for access and earn loyalty points" | SaaS + loyalty — clean |
| "Qualify as a founding member and receive recognition" | Cultural credential — clean |
| "Contribute to the community and govern collectively" | Cooperative — defensible |

The bundle is clean when each function is presented on its own terms. It becomes legally exposed when they are conflated — particularly when purchase price is connected to token expectation.

**Pre-launch requirement:** Obtain a formal securities law opinion from qualified Canadian counsel before any token distribution. Budget $15,000–$25,000 for this work in Year 1. This opinion should address $ROAD under CSA Staff Notice 46-308 and, if US persons are involved, Howey test analysis for the US jurisdiction.

---

## Revenue Allocation (Founding NFT Mint)

| Destination | Share |
|---|---|
| Community treasury | 70% |
| Operating expenses | 20% |
| Founder draw | 10% |

---

## The Grant Separation Principle

The grant strategy sits entirely outside the membership product stack. This separation is not incidental — it is structural and must be maintained.

- **SR&ED** funds DeSci experiments and platform R&D
- **IRAP** funds platform development infrastructure
- **SaskInnovates** funds regional community infrastructure
- **CMF** funds the media layer
- **Mitacs** funds applied research partnerships

None of these interact with $ROAD or the membership product. They fund the substrate. The membership product runs on top of the substrate.

**The framing that gets funded:**

> "We are building a Saskatchewan-based applied research community with a digital coordination layer, supported by non-dilutive government funding."

Not: "We are building a token-based community." Same operation. Different framing. Different outcome.

---

*Praetorian Holdings Ltd. — Confidential — March 2026*
