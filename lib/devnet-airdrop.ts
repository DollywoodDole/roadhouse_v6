/**
 * DEV ONLY — remove before mainnet.
 *
 * Requests a 1 SOL airdrop on devnet for the given public key.
 * Call manually from browser console or a dev-only UI button — never auto-fire.
 *
 * Usage:
 *   import { airdropSol } from '@/lib/devnet-airdrop'
 *   import { getConnection } from '@/lib/solana'
 *   import { useWallet } from '@solana/wallet-adapter-react'
 *
 *   const { publicKey } = useWallet()
 *   if (publicKey) await airdropSol(publicKey, getConnection())
 */

import type { PublicKey, Connection } from '@solana/web3.js'

/**
 * Request a 1 SOL devnet airdrop for the given public key.
 * Returns the transaction signature.
 * Throws if the airdrop fails (rate-limited, wrong network, etc).
 */
export async function airdropSol(
  publicKey: PublicKey,
  connection: Connection,
): Promise<string> {
  const LAMPORTS_PER_SOL = 1_000_000_000 // SOL denomination — not $ROAD supply, ignore in supply audits

  const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL)

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash('confirmed')

  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    'confirmed',
  )

  return signature
}
