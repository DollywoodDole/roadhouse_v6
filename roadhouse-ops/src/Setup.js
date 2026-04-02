// ============================================================
// Setup.js — One-time setup functions for RoadHouse OS
// Run from Apps Script editor after clasp push.
// All functions are idempotent — safe to re-run.
//
// SETUP ORDER (fresh install):
//   0. setScriptSecrets()            ← secrets into Script Properties
//   1. runPreM3Setup()               ← columns + formulas
//   2. runBackfill()                 ← fill Stripe IDs + tiers
//
// SETUP ORDER (existing install — M3 migration):
//   0. setScriptSecrets()            ← if not done yet
//   1. setupStewardColumns()         ← adds cols S / T / U
//   2. updateMultiplierFormulas()    ← adds Bounty Completed + Peer Review
//   3. runBackfill()                 ← re-run to catch new members
// ============================================================

/**
 * STEP 0 — Secrets. Run once from the Apps Script editor console.
 *
 * Writes CRON_SECRET and STRIPE_SECRET_KEY to Script Properties so
 * they are never visible in the spreadsheet.
 *
 * Usage:
 *   setScriptSecrets('your_cron_secret', 'sk_live_...')
 *
 * Defined in Config.js — listed here as a reminder.
 * (No duplicate definition needed — Config.js is loaded first.)
 */

// ── Step 1a: Stripe identity columns (Q + R) ─────────────────

/**
 * Adds "Stripe Customer ID" (col Q) and "Subscription Tier" (col R)
 * headers to the Members sheet.
 * Required before runBackfill(). Safe to re-run.
 */
function setupMembersSheetColumns() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const members = ss.getSheetByName(SHEET.MEMBERS);

  if (!members) {
    Logger.log('ERROR: Members sheet not found');
    return;
  }

  const headerRow = members.getRange(1, 1, 1, 22).getValues()[0];

  // COLS.STRIPE_CUS = 16 (0-based) → sheet col 17 → Q
  if (!headerRow[COLS.STRIPE_CUS]) {
    members.getRange(1, COLS.STRIPE_CUS + 1).setValue('Stripe Customer ID');
    Logger.log('Added col Q: Stripe Customer ID');
  } else {
    Logger.log('Col Q already set: ' + headerRow[COLS.STRIPE_CUS]);
  }

  // COLS.SUB_TIER = 17 (0-based) → sheet col 18 → R
  if (!headerRow[COLS.SUB_TIER]) {
    members.getRange(1, COLS.SUB_TIER + 1).setValue('Subscription Tier');
    Logger.log('Added col R: Subscription Tier');
  } else {
    Logger.log('Col R already set: ' + headerRow[COLS.SUB_TIER]);
  }

  Logger.log('setupMembersSheetColumns complete');
}

// ── Step 1b: Steward ops columns (S + T + U) — M3 ───────────

/**
 * Adds three steward ops columns to the Members sheet:
 *   S — Is_Steward       (checkbox)
 *   T — Verified_Bounties (number — incremented by steward verification flow)
 *   U — Last_Verification_Date (date — updated on each bounty approval)
 *
 * These are the sheet anchors for M3 steward verification.
 * Required before any steward-gated $ROAD release can be audited.
 * Safe to re-run.
 */
function setupStewardColumns() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const members = ss.getSheetByName(SHEET.MEMBERS);

  if (!members) {
    Logger.log('ERROR: Members sheet not found');
    return;
  }

  const headerRow = members.getRange(1, 1, 1, 22).getValues()[0];
  const lastDataRow = members.getLastRow();

  // S — Is_Steward (COLS.STEWARD = 18, 0-based → col 19 → S)
  if (!headerRow[COLS.STEWARD]) {
    members.getRange(1, COLS.STEWARD + 1).setValue('Is_Steward');
    // Insert checkboxes in data rows
    if (lastDataRow > 1) {
      members.getRange(2, COLS.STEWARD + 1, lastDataRow - 1, 1)
        .insertCheckboxes();
    }
    Logger.log('Added col S: Is_Steward (checkboxes)');
  } else {
    Logger.log('Col S already set: ' + headerRow[COLS.STEWARD]);
  }

  // T — Verified_Bounties (COLS.VERIFIED_BOUNTIES = 19, 0-based → col 20 → T)
  if (!headerRow[COLS.VERIFIED_BOUNTIES]) {
    members.getRange(1, COLS.VERIFIED_BOUNTIES + 1).setValue('Verified_Bounties');
    Logger.log('Added col T: Verified_Bounties');
  } else {
    Logger.log('Col T already set: ' + headerRow[COLS.VERIFIED_BOUNTIES]);
  }

  // U — Last_Verification_Date (COLS.LAST_VERIFICATION = 20, 0-based → col 21 → U)
  if (!headerRow[COLS.LAST_VERIFICATION]) {
    members.getRange(1, COLS.LAST_VERIFICATION + 1).setValue('Last_Verification_Date');
    Logger.log('Added col U: Last_Verification_Date');
  } else {
    Logger.log('Col U already set: ' + headerRow[COLS.LAST_VERIFICATION]);
  }

  Logger.log('setupStewardColumns complete');
}

// ── Step 2: Multiplier formulas ───────────────────────────────

/**
 * Writes the SWITCH() multiplier formula to every data row in
 * Outputs_PROCESSED col J.
 *
 * Output type labels must exactly match the Google Form dropdown.
 * scoring.json is the source of truth — keep the two in sync.
 *
 * Safe to re-run — overwrites existing J formulas.
 */
function updateMultiplierFormulas() {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const processed = ss.getSheetByName(SHEET.PROCESSED);

  if (!processed) {
    Logger.log('ERROR: Outputs_PROCESSED sheet not found');
    return;
  }

  const lastRow = processed.getLastRow();
  if (lastRow < 2) {
    Logger.log('No data rows in Outputs_PROCESSED — nothing to update');
    return;
  }

  const dataRows = lastRow - 1;
  const formulas = [];

  for (let row = 2; row <= lastRow; row++) {
    formulas.push([
      '=SWITCH(F' + row + ',' +
      '"Sponsorship Secured",3.0,' +
      '"Deal Closed",2.5,' +
      '"Bounty Completed",2.2,' +   // M3 — proof required (bounty claim link)
      '"Content Published",2.0,' +
      '"Code Shipped",2.0,' +
      '"Research Published",1.8,' +
      '"Strategic Output",1.7,' +
      '"Community Build",1.5,' +
      '"Peer Review",1.5,' +         // M3 — reviewing another member's work
      '"Training Log",1.2,' +
      '"Daily Check-In",1.0,' +
      '1.0)',
    ]);
  }

  processed.getRange(2, COL.P_MULTIPLIER, dataRows, 1).setFormulas(formulas);
  SpreadsheetApp.flush();

  Logger.log('updateMultiplierFormulas complete — ' + dataRows + ' rows updated in col J');
}

// ── Step 3: Stripe backfill ───────────────────────────────────

/**
 * Runs backfillStripeCustomerIds() using STRIPE_SECRET_KEY from
 * Script Properties — the key never touches the spreadsheet.
 *
 * Run from the Apps Script editor:
 *   runBackfill()
 *
 * Or via clasp execution API:
 *   node scripts/run-backfill.js
 *
 * Requires STRIPE_SECRET_KEY to be set via setScriptSecrets() first.
 */
function runBackfill() {
  const stripeKey = getStripeSecretKey();

  if (!stripeKey || !stripeKey.startsWith('sk_')) {
    Logger.log('ERROR: STRIPE_SECRET_KEY not set in Script Properties.');
    Logger.log('Run: setScriptSecrets(null, "sk_live_...") first.');
    return;
  }

  Logger.log('Starting backfill — key from Script Properties (not visible in sheet)');
  backfillStripeCustomerIds();
  Logger.log('runBackfill complete');
}

// ── Orchestrators ─────────────────────────────────────────────

/**
 * Full pre-M3 setup for a fresh install.
 * Run AFTER setScriptSecrets().
 *
 *   runPreM3Setup()   → columns + formulas
 *   runBackfill()     → Stripe IDs (run separately after)
 */
function runPreM3Setup() {
  Logger.log('=== RoadHouse OS — Pre-M3 Setup ===');

  Logger.log('');
  Logger.log('Step 1a: setupMembersSheetColumns()');
  setupMembersSheetColumns();

  Logger.log('');
  Logger.log('Step 1b: setupStewardColumns()');
  setupStewardColumns();

  Logger.log('');
  Logger.log('Step 2: updateMultiplierFormulas()');
  updateMultiplierFormulas();

  Logger.log('');
  Logger.log('=== Setup complete ===');
  Logger.log('');
  Logger.log('NEXT: runBackfill() — fills cols Q + R with Stripe IDs');
  Logger.log('      Requires STRIPE_SECRET_KEY in Script Properties.');
  Logger.log('      Run setScriptSecrets(null, "sk_live_...") if not done yet.');
}

/**
 * M3 migration only — existing installs that already have cols Q + R
 * and just need the steward columns + updated multipliers.
 */
function runM3Migration() {
  Logger.log('=== RoadHouse OS — M3 Migration ===');

  Logger.log('');
  Logger.log('Step 1: setupStewardColumns()');
  setupStewardColumns();

  Logger.log('');
  Logger.log('Step 2: updateMultiplierFormulas()');
  updateMultiplierFormulas();

  Logger.log('');
  Logger.log('=== M3 migration complete ===');
  Logger.log('');
  Logger.log('Cols S / T / U added to Members. Bounty Completed + Peer Review');
  Logger.log('multipliers active in Outputs_PROCESSED col J.');
  Logger.log('');
  Logger.log('NEXT: runBackfill() to catch any new members missing col Q + R.');
}
