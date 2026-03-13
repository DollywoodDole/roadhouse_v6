/**
 * RoadHouse Capital — $ROAD Token Metadata
 * ─────────────────────────────────────────
 * Adds on-chain metadata to the $ROAD mint using Metaplex Token Metadata.
 * Run AFTER mint-road-token.ts.
 *
 * Usage:
 *   npx ts-node scripts/add-road-metadata.ts
 */

import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  createFungible,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata'
import {
  keypairIdentity,
  percentAmount,
  publicKey as umiPublicKey,
} from '@metaplex-foundation/umi'
import { readFileSync } from 'fs'
import path from 'path'

// ─── Config ──────────────────────────────────────────────────────────────────

const NETWORK = 'devnet'
const MINT_ADDRESS = process.env.NEXT_PUBLIC_ROAD_MINT_ADDRESS ?? ''

// Upload your token logo to Arweave/IPFS first, then paste URI here
// For devnet testing, you can use any public image URL
const TOKEN_METADATA = {
  name: 'RoadHouse Governance Token',
  symbol: '$ROAD',
  uri: 'https://roadhouse.capital/road-token-metadata.json', // Update after deploying metadata JSON
  sellerFeeBasisPoints: 0, // 0% royalty for fungible token
}

// ─── Metadata JSON to upload ──────────────────────────────────────────────────
// Upload this JSON to Arweave/IPFS and use its URI above
export const TOKEN_METADATA_JSON = {
  name: 'RoadHouse Governance Token',
  symbol: '$ROAD',
  description: 'The $ROAD token is the governance and utility instrument of the RoadHouse Capital ecosystem. Holders access tiered community membership, treasury governance, and contributor rewards.',
  image: 'https://roadhouse.capital/rh-logo.png', // Update with actual logo
  external_url: 'https://roadhouse.capital',
  attributes: [
    { trait_type: 'Type', value: 'Governance Token' },
    { trait_type: 'Network', value: 'Solana' },
    { trait_type: 'Total Supply', value: '1,000,000,000' },
    { trait_type: 'Decimals', value: '6' },
    { trait_type: 'Issuer', value: 'Praetorian Holdings Ltd.' },
  ],
  properties: {
    files: [{ uri: 'https://roadhouse.capital/rh-logo.png', type: 'image/png' }],
    category: 'fungible',
  },
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!MINT_ADDRESS) {
    console.error('❌ Set NEXT_PUBLIC_ROAD_MINT_ADDRESS in .env.local first')
    process.exit(1)
  }

  console.log('\n🤠 RoadHouse Capital — $ROAD Metadata Deployment')
  console.log('=================================================')
  console.log(`Mint: ${MINT_ADDRESS}`)
  console.log(`Network: ${NETWORK}\n`)

  const umi = createUmi(clusterApiUrl(NETWORK))
    .use(mplTokenMetadata())

  // Load deployer keypair
  const deployerPath = path.resolve('./scripts/keypairs/deployer.json')
  const raw = JSON.parse(readFileSync(deployerPath, 'utf-8'))
  const deployerKeypair = umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(raw))
  umi.use(keypairIdentity(deployerKeypair))

  console.log(`Deployer: ${deployerKeypair.publicKey}`)

  console.log('📝 Creating token metadata...')
  const { signature } = await createFungible(umi, {
    mint: umiPublicKey(MINT_ADDRESS),
    name: TOKEN_METADATA.name,
    symbol: TOKEN_METADATA.symbol,
    uri: TOKEN_METADATA.uri,
    sellerFeeBasisPoints: percentAmount(0),
    isMutable: false, // Lock metadata permanently
  }).sendAndConfirm(umi)

  console.log(`✅ Metadata created!`)
  console.log(`   TX: ${Buffer.from(signature).toString('base64')}`)
  console.log(`\n   Verify: https://explorer.solana.com/address/${MINT_ADDRESS}?cluster=devnet`)
  console.log('\n📋 Checklist:')
  console.log('  [ ] Upload road-token-logo.png to Arweave/IPFS')
  console.log('  [ ] Upload road-token-metadata.json to Arweave/IPFS')
  console.log('  [ ] Update TOKEN_METADATA.uri with IPFS/Arweave URI')
  console.log('  [ ] Re-run this script with live URIs')
}

main().catch(err => {
  console.error('❌ Failed:', err)
  process.exit(1)
})
