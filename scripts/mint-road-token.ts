/**
 * RoadHouse Capital — $ROAD Token Mint Script
 * ─────────────────────────────────────────────
 * Run on Solana DEVNET to create the $ROAD SPL token.
 *
 * Prerequisites:
 *   npm install @solana/web3.js @solana/spl-token @metaplex-foundation/mpl-token-metadata ts-node
 *   solana config set --url devnet
 *   solana-keygen new --outfile ./scripts/keypairs/deployer.json
 *   solana airdrop 2 <DEPLOYER_ADDRESS> --url devnet
 *
 * Usage:
 *   npx ts-node scripts/mint-road-token.ts
 *
 * Output:
 *   - Mint address → paste into .env.local as NEXT_PUBLIC_ROAD_MINT_ADDRESS
 *   - Metadata TX → verify on https://explorer.solana.com/?cluster=devnet
 */

import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  setAuthority,
  AuthorityType,
  getMint,
} from '@solana/spl-token'
import { readFileSync } from 'fs'
import path from 'path'

// ─── Config ──────────────────────────────────────────────────────────────────

const NETWORK = 'devnet'
const DECIMALS = 6
const TOTAL_SUPPLY = 1_000_000_000 // 1B $ROAD

// Allocation percentages (must sum to 100)
const ALLOCATIONS = {
  founder:     0.18,  // 18% — 4yr vest, 1yr cliff
  creators:    0.22,  // 22% — merit-based
  community:   0.25,  // 25% — participation rewards
  treasury:    0.25,  // 25% — DAO-controlled
  partners:    0.10,  // 10% — advisors, grants
}

// ─── Load deployer keypair ────────────────────────────────────────────────────

function loadKeypair(filePath: string): Keypair {
  const raw = readFileSync(filePath, 'utf-8')
  const secretKey = JSON.parse(raw)
  return Keypair.fromSecretKey(Uint8Array.from(secretKey))
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🤠 RoadHouse Capital — $ROAD Token Deployment')
  console.log('==============================================')
  console.log(`Network: ${NETWORK}`)
  console.log(`Total Supply: ${TOTAL_SUPPLY.toLocaleString()} $ROAD`)
  console.log(`Decimals: ${DECIMALS}\n`)

  const connection = new Connection(clusterApiUrl(NETWORK), 'confirmed')

  // Load deployer keypair — THIS is the mint authority initially
  const deployerPath = path.resolve('./scripts/keypairs/deployer.json')
  const deployer = loadKeypair(deployerPath)
  console.log(`Deployer: ${deployer.publicKey.toBase58()}`)

  // Check balance
  const balance = await connection.getBalance(deployer.publicKey)
  console.log(`SOL Balance: ${(balance / 1e9).toFixed(4)} SOL`)
  if (balance < 0.1 * 1e9) {
    console.error('❌ Insufficient SOL. Run: solana airdrop 2 <address> --url devnet')
    process.exit(1)
  }

  // ── Create the $ROAD mint ──────────────────────────────────────────────────
  console.log('\n📦 Creating $ROAD mint...')
  const mint = await createMint(
    connection,
    deployer,           // payer
    deployer.publicKey, // mint authority
    deployer.publicKey, // freeze authority (set to null after minting)
    DECIMALS
  )
  console.log(`✅ Mint created: ${mint.toBase58()}`)

  // ── Create deployer's token account ───────────────────────────────────────
  console.log('\n🏦 Creating deployer token account...')
  const deployerTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    deployer,
    mint,
    deployer.publicKey
  )
  console.log(`✅ Token account: ${deployerTokenAccount.address.toBase58()}`)

  // ── Mint full supply to deployer ──────────────────────────────────────────
  const rawSupply = TOTAL_SUPPLY * Math.pow(10, DECIMALS)
  console.log(`\n🪙 Minting ${TOTAL_SUPPLY.toLocaleString()} $ROAD...`)
  await mintTo(
    connection,
    deployer,
    mint,
    deployerTokenAccount.address,
    deployer.publicKey,
    BigInt(rawSupply)
  )
  console.log(`✅ Full supply minted to deployer`)

  // ── Disable future minting (revoke mint authority) ────────────────────────
  console.log('\n🔒 Revoking mint authority (fixed supply)...')
  await setAuthority(
    connection,
    deployer,
    mint,
    deployer.publicKey,
    AuthorityType.MintTokens,
    null
  )
  console.log('✅ Mint authority revoked — $ROAD supply is now fixed at 1B')

  // ── Verify ────────────────────────────────────────────────────────────────
  const mintInfo = await getMint(connection, mint)
  console.log('\n📊 Mint Verification:')
  console.log(`  Address:      ${mint.toBase58()}`)
  console.log(`  Supply:       ${(Number(mintInfo.supply) / Math.pow(10, DECIMALS)).toLocaleString()}`)
  console.log(`  Decimals:     ${mintInfo.decimals}`)
  console.log(`  Mint Auth:    ${mintInfo.mintAuthority ?? 'REVOKED ✅'}`)
  console.log(`  Freeze Auth:  ${mintInfo.freezeAuthority ?? 'REVOKED ✅'}`)

  // ── Allocation summary ────────────────────────────────────────────────────
  console.log('\n📐 Allocation Plan:')
  Object.entries(ALLOCATIONS).forEach(([key, pct]) => {
    console.log(`  ${key.padEnd(12)} ${(pct * 100).toFixed(0).padStart(3)}%  →  ${(TOTAL_SUPPLY * pct).toLocaleString()} $ROAD`)
  })

  // ── Instructions ─────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────────')
  console.log('✅ DEPLOYMENT COMPLETE')
  console.log('─────────────────────────────────────────────────')
  console.log('\nNext steps:')
  console.log(`  1. Add to .env.local:`)
  console.log(`     NEXT_PUBLIC_ROAD_MINT_ADDRESS=${mint.toBase58()}`)
  console.log(`\n  2. Verify on Explorer:`)
  console.log(`     https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`)
  console.log(`\n  3. Add token metadata via Metaplex:`)
  console.log(`     Run: npx ts-node scripts/add-road-metadata.ts`)
  console.log(`\n  4. Distribute allocations:`)
  console.log(`     Run: npx ts-node scripts/distribute-road.ts`)
}

main().catch(err => {
  console.error('\n❌ Deployment failed:', err)
  process.exit(1)
})
