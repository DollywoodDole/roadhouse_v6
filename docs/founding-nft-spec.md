# Founding Membership NFT Specification
*Praetorian Holdings Corp. · Internal Document · v1.0*

> Last updated: 2026-03-26
> Status: Specification only — art not commissioned, Candy Machine not deployed.

---

## 1. Overview

| Parameter | Value |
|---|---|
| Collection name | RoadHouse Founding Member NFT |
| Supply | 500 total — fixed, no additional mints ever |
| Standard | Metaplex Certified Collection (MCC) |
| Network | Solana devnet (current) → mainnet-beta at launch |
| Mint price | 3 SOL |
| Soul-bound | Non-transferable for 12 months post-mint |
| Royalty | 5% on secondary sales → community treasury |
| Symbol | RHFM |

---

## 2. Utility

Founding NFT holders receive:

- **Steward-tier dashboard access** for 12 months from mint date
- **Undisclosed $ROAD allocation** at mainnet launch
  — amount not public, announced at TGE only
- **VIP access** to first 3 RoadHouse events (priority entry, dedicated section)
- **Exclusive Founding Member** Discord role (separate from Steward role)
- **Permanent name** in the on-chain founding member register
- **Priority access** to future collection mints (whitelist guaranteed)

**What it is not:**
- Not equity in Praetorian Holdings Corp.
- Not a profit-sharing instrument
- Not a yield-bearing instrument
- No guaranteed APY, no investment expectation

---

## 3. Candy Machine v3 Setup

**Protocol:** Candy Machine v3 (Metaplex)

**Required CLI:**
```bash
npm install -g @metaplex-foundation/mpl-candy-machine
# or use Sugar CLI (recommended)
npm install -g @metaplex-foundation/sugar-cli
```

**Config (`candy_machine_config.json`):**
```json
{
  "price": 3,
  "number": 500,
  "gatekeeper": null,
  "solTreasuryAccount": "<TREASURY_WALLET>",
  "goLiveDate": "TBD — set at mainnet launch",
  "endSettings": {
    "endSettingType": { "amount": {} },
    "number": 500
  },
  "whitelistMintSettings": {
    "mode": { "burnEveryTime": true },
    "mint": "<FOUNDING_WL_MINT>",
    "presale": true,
    "discountPrice": null
  },
  "hiddenSettings": null
}
```

**Devnet test steps:**
```bash
# 1. Launch Candy Machine on devnet
sugar launch --config candy_machine_config.json --env devnet

# 2. Verify at https://www.candy.xyz (select devnet)

# 3. Test mint with devnet SOL
solana airdrop 5
sugar mint --env devnet

# 4. Confirm soul-bound: attempt transfer — should fail
spl-token transfer <TOKEN_MINT> 1 <OTHER_WALLET> -- (should reject)
```

---

## 4. Metadata Specification

**Name format:** `"RoadHouse Founding Member #001"` through `"#500"`

**Required on-chain attributes:**
```json
{
  "attributes": [
    { "trait_type": "Tier",              "value": "Founding Member" },
    { "trait_type": "Network",           "value": "Solana" },
    { "trait_type": "Collection",        "value": "RoadHouse" },
    { "trait_type": "Serial",            "value": 1 },
    { "trait_type": "Mint Date",         "value": "<ISO date string>" },
    { "trait_type": "Soul-bound",        "value": "true" },
    { "trait_type": "Soul-bound Expiry", "value": "<ISO date 12mo from mint>" }
  ]
}
```

**On-chain fields:**
- `name`: `"RoadHouse Founding Member #001"`
- `symbol`: `"RHFM"`
- `uri`: Arweave or Shadow Drive URL → off-chain JSON

**Off-chain JSON (URI target):**
```json
{
  "name": "RoadHouse Founding Member #001",
  "description": "One of 500 founding members of the RoadHouse ecosystem. Non-transferable for 12 months. Praetorian Holdings Corp.",
  "image": "<arweave or shadow drive image URL>",
  "attributes": [ ... ],
  "collection": {
    "name": "RoadHouse Founding Members",
    "family": "RoadHouse"
  }
}
```

---

## 5. Art Brief

**Style:** Dark editorial — consistent with roadhouse.capital aesthetic.
Not cartoon. Not generative PFP. Not meme-adjacent.

**Base composition:**
- Dark background (`#0a0a08` or near-black)
- Gold (`#e8c84a`) as primary accent — consistent with `--accent` CSS variable
- Bebas Neue or similar condensed display typeface
- `"ROADHOUSE"` wordmark prominent
- `"FOUNDING MEMBER"` in Space Mono
- Serial number in small gold text (bottom-right corner)
- Grain texture overlay (matches site aesthetic — see `globals.css` grain class)

**Variants (5 backgrounds, 100 NFTs each):**

| # | Name | Glow Color | Supply |
|---|---|---|---|
| 1 | Gold | `#e8c84a` | 100 |
| 2 | Red | `#ff5c35` | 100 |
| 3 | Teal | `#4af0c8` | 100 |
| 4 | Charcoal | `#1a1a18` minimal | 100 |
| 5 | Noir | `#0a0a08` ultra-minimal | 100 |

**Format:** 1000×1000px PNG, 72dpi minimum
**Files needed:** 500 unique images + 500 metadata JSON files

**Storage options (pick one before upload):**
- Arweave (permanent, immutable — preferred for NFT metadata)
- Shadow Drive (Solana-native, lower cost)

**Art status:** NOT YET COMMISSIONED

**Next step:** brief a designer or generate via Midjourney / DALL-E using the
style guide above. Reference `#01 — Brand Identity` folder in Canva workspace
(`canva.com/folder/FAHEIwJ9L3A`) for logos, colour swatches, and typography.

---

## 6. Soul-bound Implementation

**Standard:** Metaplex Programmable NFT (pNFT)

**Transfer rule:** `NonTransferable` for first 365 days post-mint

```typescript
// Rule set configuration
const ruleSet = {
  ruleSetAddress: NonTransferableRuleSet,  // Metaplex default
  duration: 31_536_000,                    // 365 days in seconds
}
```

**After 365 days:** standard transfer rules apply (5% royalty on secondary sales → treasury)

**Verification:** `verifyFoundingNFTOwnership(walletAddress)` in `lib/metaplex.ts`
(does not exist yet — M3 deliverable)

---

## 7. Revenue Allocation (per mint, 3 SOL)

| Recipient | % | Purpose |
|---|---|---|
| Community Treasury (Squads multisig) | 70% | DAO-controlled |
| Operations (Praetorian Holdings Corp.) | 20% | Platform costs |
| Founder draw | 10% | Dalton Ellscheid |

Revenue flows directly to the Gnosis Safe vault at mint. No manual
distribution required — `solTreasuryAccount` in Candy Machine config
is the multisig vault address.

---

## 8. Mint Flow Integration

**Current state:**
`FoundingMint.tsx` on the landing page shows a devnet test UI with no
real mint transaction wired.

**M3 deliverables for live mint:**
```
lib/metaplex.ts (does not exist yet) — will handle:
  mintFoundingNFT(walletAddress): Promise<string>    // returns mint address
  verifyFoundingNFTOwnership(walletAddress): Promise<boolean>

FoundingMint.tsx update:
  - Replace devnet placeholder with real Candy Machine ID
  - Connect to Phantom → sign mint transaction
  - On success:
      registerFoundingMember() → Discord Founding Member role
      KV record update: mark walletAddress as founding holder
      Steward-tier access granted for 12 months
```

**Env vars required at launch:**
```
NEXT_PUBLIC_NFT_FOUNDING_COLLECTION=<collection mint address>
```

---

## 9. Current Status

**Blocking items before mint goes live:**

- [ ] Art assets commissioned and delivered (500 images)
- [ ] Metadata JSON files generated (500 files)
- [ ] Assets uploaded to Arweave or Shadow Drive
- [ ] Candy Machine deployed on devnet and smoke-tested
- [ ] Soul-bound rule set verified (transfer attempt fails within 365 days)
- [ ] `lib/metaplex.ts` implemented (`mintFoundingNFT`, `verifyFoundingNFTOwnership`)
- [ ] `FoundingMint.tsx` wired to real Candy Machine ID
- [ ] Candy Machine deployed on mainnet
- [ ] `NEXT_PUBLIC_NFT_FOUNDING_COLLECTION` set to mainnet collection mint
- [ ] Mainnet deployment authorized by Dalton Ellscheid in writing
