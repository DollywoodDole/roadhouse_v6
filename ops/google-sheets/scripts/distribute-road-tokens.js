#!/usr/bin/env node
// ============================================================
// distribute-road-tokens.js
// Reads weekly accrual CSV from admin email (manual) OR
// from stdin, then executes Solana SPL transfers.
// Usage: echo "<csv>" | node scripts/distribute-road-tokens.js
//   OR:  node scripts/distribute-road-tokens.js --dry-run
// ============================================================
require('dotenv').config();
const {
  Connection, PublicKey, Keypair, Transaction,
} = require('@solana/web3.js');
const {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getMint,
} = require('@solana/spl-token');
const fs = require('fs');
const readline = require('readline');

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  const rpcUrl      = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const mintAddress = process.env.ROAD_TOKEN_MINT;
  const keypairPath = process.env.ADMIN_KEYPAIR_PATH || `${process.env.HOME}/.config/solana/id.json`;

  if (!mintAddress) throw new Error('ROAD_TOKEN_MINT not set in .env');
  if (!fs.existsSync(keypairPath)) throw new Error(`Keypair not found at ${keypairPath}`);

  const connection = new Connection(rpcUrl, 'confirmed');
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
  const adminKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  const mint = new PublicKey(mintAddress);

  // Read CSV from stdin
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  const lines = [];
  for await (const line of rl) lines.push(line);
  const rows = lines.slice(1).filter(Boolean); // skip header

  if (rows.length === 0) { console.log('No rows in CSV — exiting'); return; }

  console.log(`\n⚔️  ROADHOUSE $ROAD DISTRIBUTION`);
  console.log(`RPC: ${rpcUrl}`);
  console.log(`Mint: ${mintAddress}`);
  console.log(`Admin: ${adminKeypair.publicKey.toString()}`);
  console.log(`Mode: ${DRY_RUN ? '🟡 DRY RUN' : '🔴 LIVE'}`);
  console.log(`Recipients: ${rows.length}\n`);

  // Get mint decimals
  const mintInfo  = await getMint(connection, mint);
  const decimals  = mintInfo.decimals;
  const adminAta  = await getOrCreateAssociatedTokenAccount(
    connection, adminKeypair, mint, adminKeypair.publicKey
  );

  let totalSent = 0;
  const results = [];

  for (const row of rows) {
    const [memberId, walletAddr, , roadAmount] = row.split(',').map(s => s.trim());
    if (!walletAddr || walletAddr === 'NO_WALLET') {
      console.log(`⚠  ${memberId}: No wallet — skipping`);
      results.push({ memberId, status: 'SKIPPED', reason: 'no_wallet' });
      continue;
    }
    const amount = parseInt(roadAmount, 10);
    if (!amount || amount <= 0) {
      console.log(`⚠  ${memberId}: Zero amount — skipping`);
      continue;
    }

    try {
      const recipientPubkey = new PublicKey(walletAddr);
      const rawAmount = amount * Math.pow(10, decimals);

      if (DRY_RUN) {
        console.log(`  [DRY] ${memberId} @${walletAddr.slice(0,8)}... → ${amount} $ROAD`);
        results.push({ memberId, wallet: walletAddr, amount, status: 'DRY_RUN' });
        totalSent += amount;
        continue;
      }

      const recipientAta = await getOrCreateAssociatedTokenAccount(
        connection, adminKeypair, mint, recipientPubkey
      );

      const tx = new Transaction().add(
        createTransferInstruction(
          adminAta.address,
          recipientAta.address,
          adminKeypair.publicKey,
          rawAmount
        )
      );

      const sig = await connection.sendTransaction(tx, [adminKeypair]);
      await connection.confirmTransaction(sig, 'confirmed');

      console.log(`  ✓ ${memberId} → ${amount} $ROAD | tx: ${sig.slice(0, 20)}...`);
      results.push({ memberId, wallet: walletAddr, amount, status: 'SUCCESS', sig });
      totalSent += amount;

    } catch (err) {
      console.log(`  ✗ ${memberId}: ${err.message}`);
      results.push({ memberId, status: 'FAILED', error: err.message });
    }
  }

  console.log(`\n── SUMMARY ────────────────────────────`);
  console.log(`Total distributed: ${totalSent} $ROAD`);
  console.log(`Successful: ${results.filter(r => r.status === 'SUCCESS' || r.status === 'DRY_RUN').length}`);
  console.log(`Skipped:    ${results.filter(r => r.status === 'SKIPPED').length}`);
  console.log(`Failed:     ${results.filter(r => r.status === 'FAILED').length}`);

  // Write results log
  const logPath = `./logs/distribution-week-${Date.now()}.json`;
  fs.mkdirSync('./logs', { recursive: true });
  fs.writeFileSync(logPath, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2));
  console.log(`\nLog written: ${logPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
