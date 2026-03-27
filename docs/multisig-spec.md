# Squads Multisig Specification
*Praetorian Holdings Corp. · Internal Document · v1.0*

> Last updated: 2026-03-26
> Status: Not yet deployed — devnet pending signer key confirmation.

---

## 1. Overview

| Parameter | Value |
|---|---|
| Protocol | Squads v4 (Solana native multisig) |
| Network | Solana devnet (current) → mainnet-beta at launch |
| Threshold | 3-of-5 signers |
| Wallet address | `NEXT_PUBLIC_MULTISIG_WALLET` env var |

---

## 2. Why Squads (not Gnosis on Solana)

- **Squads v4** is the native Solana multisig standard — purpose-built for the Solana
  execution model, not ported from EVM.
- **Full SPL token support** including $ROAD — no wrapping or bridging required.
- **Integrated with Realms** for on-chain governance execution when needed.
- **Lower transaction costs** than EVM-based alternatives running on Solana via bridge.
- **Battle-tested:** Squads v4 secures >$1B in assets across the Solana ecosystem.

---

## 3. Devnet Setup Steps

**Prerequisites:**
```bash
# Install Squads CLI
npm install -g @sqds/sdk

# Confirm Solana CLI configured for devnet
solana config set --url devnet
solana airdrop 2  # fund the deployer wallet
```

**Create multisig:**
```bash
squads create-multisig \
  --threshold 3 \
  --members <pubkey1>,<pubkey2>,<pubkey3>,<pubkey4>,<pubkey5> \
  --network devnet
```

**Post-deploy steps:**
1. Copy the multisig address from CLI output
2. Set in `.env.local`:
   ```
   NEXT_PUBLIC_MULTISIG_WALLET=<multisig address>
   NEXT_PUBLIC_TREASURY_WALLET=<vault address>
   ```
3. Verify in Squads app: https://v4.squads.so (select devnet)
4. Execute a test transaction (devnet SOL transfer) to confirm 3-of-5 threshold

---

## 4. Mainnet Migration Checklist

Before deploying to mainnet, all items must be complete:

- [ ] All 5 signers have confirmed their public keys in writing
- [ ] Founder seat uses hardware wallet (Ledger) — not a hot wallet
- [ ] Test transaction executed on devnet with all threshold signers (3 of 5)
- [ ] `ROAD_MINT_PUBKEY` set and $ROAD deployed to Solana mainnet
- [ ] Treasury initial funding plan approved by governance vote
- [ ] `NEXT_PUBLIC_MULTISIG_WALLET` updated to mainnet address
- [ ] `NEXT_PUBLIC_TREASURY_WALLET` updated to mainnet vault address
- [ ] Gnosis Safe API endpoint in `lib/gnosis.ts` updated from devnet to mainnet
  (`safe-transaction-mainnet.safe.global` is already the correct mainnet URL)

---

## 5. Signer Key Management

| Seat | Key Storage | Requirement |
|---|---|---|
| Founder | Hardware wallet (Ledger) | Mandatory |
| Elected Stewards (×2) | Hardware wallet | Strongly recommended |
| Elected Partner | Hardware wallet | Strongly recommended |
| External Advisor | Hardware wallet | Strongly recommended |

**Key rotation:**
- Any signer may be replaced via a 3-of-5 vote
- Replacement transaction proposed by any current signer
- New key confirmed by the signer being replaced where possible

**Emergency compromise:**
- If a signer key is confirmed compromised, the Founder initiates replacement
  immediately via remaining threshold signers
- No waiting period in a compromise scenario — speed takes priority
- Compromised key is removed via Squads `removeKey` transaction

---

## 6. Transaction Types

### $ROAD treasury disbursements
- Require a passing governance vote (Phase 4 execution per `docs/governance-spec.md`)
- Proposed as a Squads transaction by any multisig member
- Requires 3 of 5 signatures to execute
- All transactions publicly verifiable on-chain

### SOL operational disbursements
| Amount | Threshold | Approval |
|---|---|---|
| ≤0.5 SOL | 2-of-5 | Founder discretionary |
| >0.5 SOL | 3-of-5 | Standard governance |

### NFT royalty collection
- Automatic — royalties flow to vault address on secondary sales
- Burn allocation (3% of royalty revenue) executed quarterly by Founder
- Burn transaction proposed via Squads, executed on-chain
- `lib/burn.ts` → `burnFromRoyalties()` — build at NFT launch, not before

---

## 7. Integration Points in Codebase

**Current (read-only):**
```
lib/gnosis.ts              — treasury balance reads (no signing)
lib/solana.ts              — MULTISIG_WALLET + TREASURY_WALLET constants
app/api/road/accrue/route.ts — KV-tracked accruals, does not touch multisig
```

**M3 deliverables (does not exist yet):**
```
lib/squads.ts              — will handle:
  proposeTreasuryTransfer(amount, recipient, memo)
  approveTransaction(txId)
  executeTransaction(txId)
  getMultisigBalance()
```

Note: `app/api/road/accrue/route.ts` writes $ROAD balances to Vercel KV only.
No on-chain transactions until mainnet is authorized. The KV snapshot is the
source of truth for pre-mainnet airdrop calculation.

---

## 8. Current Status

| Item | Status |
|---|---|
| Devnet deploy | Not deployed — pending signer key confirmation |
| Mainnet deploy | Not deployed |
| `lib/squads.ts` | Does not exist — M3 deliverable |
| 5 signer keys | Not yet confirmed |

**Next step:** confirm 5 signer public keys with all participants → run devnet setup
per Section 3.
