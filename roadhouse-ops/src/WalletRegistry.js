// ============================================================
// WalletRegistry.js — Web2 ↔ Web3 Identity Bridge
// Maps RH-001 → Solana wallet pubkey
// V1: Manual registration via Admin
// V2: Self-service via signed verification message
// ============================================================

/**
 * ADMIN: Register or update a member's wallet address.
 * Run manually from Apps Script editor.
 * @param {string} memberId - e.g. "RH-001"
 * @param {string} walletPubkey - Solana base58 pubkey
 */
function registerWallet(memberId, walletPubkey) {
  if (!memberId || !walletPubkey) throw new Error('memberId and walletPubkey required');
  if (!/^RH-\d{3,}$/.test(memberId)) throw new Error('Invalid memberId format');
  if (walletPubkey.length < 32 || walletPubkey.length > 44) throw new Error('Invalid Solana pubkey length');

  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const members = ss.getSheetByName(SHEET.MEMBERS);
  const data    = members.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][COL.M_ID - 1] === memberId) {
      members.getRange(i + 1, COL.M_WALLET).setValue(walletPubkey);
      Logger.log(`Registered wallet for ${memberId}: ${walletPubkey}`);
      return true;
    }
  }
  throw new Error(`Member ${memberId} not found`);
}

/**
 * Get all members who have registered wallets.
 * Used by exportWeeklyRoadAccrual() to build distribution list.
 */
function getMembersWithWallets() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const members = ss.getSheetByName(SHEET.MEMBERS);
  const data    = members.getDataRange().getValues().slice(1);

  return data
    .filter(r => r[COL.M_ID - 1] && r[COL.M_WALLET - 1])
    .map(r => ({
      memberId: r[COL.M_ID - 1],
      handle:   r[COL.M_HANDLE - 1],
      wallet:   r[COL.M_WALLET - 1],
    }));
}

/**
 * Get members WITHOUT wallets — for onboarding follow-up.
 */
function getMembersWithoutWallets() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const members = ss.getSheetByName(SHEET.MEMBERS);
  const data    = members.getDataRange().getValues().slice(1);

  return data
    .filter(r => r[COL.M_ID - 1] && !r[COL.M_WALLET - 1])
    .map(r => ({
      memberId: r[COL.M_ID - 1],
      handle:   r[COL.M_HANDLE - 1],
      email:    r[COL.M_EMAIL - 1],
    }));
}

/**
 * EMAIL: Remind members to register wallets before next distribution.
 * Trigger: Manual or weekly before distribution run.
 */
function remindWalletRegistration() {
  const missing = getMembersWithoutWallets();
  if (missing.length === 0) {
    Logger.log('All active members have wallets registered');
    return;
  }

  missing.forEach(m => {
    if (!m.email) return;
    MailApp.sendEmail({
      to:      m.email,
      subject: '⚔️ RoadHouse — Register wallet to receive $ROAD',
      body: `Hey @${m.handle},\n\n` +
            `Your $ROAD accruals are building up but we don't have a Solana wallet on file for you.\n\n` +
            `To receive your weekly $ROAD distribution:\n` +
            `1. Set up a Phantom wallet (https://phantom.app)\n` +
            `2. Reply to this email with your Solana wallet address\n` +
            `3. We'll register it and include you in the next distribution\n\n` +
            `Your accumulated score is waiting.\n\n` +
            `— RoadHouse Admin`,
    });
  });
  Logger.log(`Wallet registration reminders sent to ${missing.length} members`);
}

// ── AUDIT REPORT ──────────────────────────────────────────────
/**
 * Logs a summary of Web3 readiness for admin review.
 */
function web3ReadinessAudit() {
  const withWallets    = getMembersWithWallets();
  const withoutWallets = getMembersWithoutWallets();
  const totalMembers   = withWallets.length + withoutWallets.length;
  const pct = totalMembers > 0 ? Math.round((withWallets.length / totalMembers) * 100) : 0;

  Logger.log('=== WEB3 READINESS AUDIT ===');
  Logger.log(`Total members:    ${totalMembers}`);
  Logger.log(`With wallets:     ${withWallets.length} (${pct}%)`);
  Logger.log(`Without wallets:  ${withoutWallets.length}`);
  Logger.log('');
  Logger.log('Missing wallet:');
  withoutWallets.forEach(m => Logger.log(`  ${m.memberId} @${m.handle} — ${m.email}`));
  Logger.log('===========================');
}
