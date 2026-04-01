// ============================================================
// Setup.js — One-time setup functions for RoadHouse OS
// Run from Apps Script editor after clasp push.
// Safe to re-run — all functions are idempotent.
// ============================================================

/**
 * RUN FIRST.
 *
 * Adds "Stripe Customer ID" (col Q) and "Subscription Tier" (col R)
 * headers to the Members sheet. Required before backfillStripeCustomerIds().
 *
 * Safe to re-run: skips if headers are already present.
 */
function setupMembersSheetColumns() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const members = ss.getSheetByName(SHEET.MEMBERS);

  if (!members) {
    Logger.log('ERROR: Members sheet not found');
    return;
  }

  const headerRow = members.getRange(1, 1, 1, 20).getValues()[0];

  // COLS.STRIPE_CUS = 16 (0-based) → sheet col 17 → col Q
  // COLS.SUB_TIER   = 17 (0-based) → sheet col 18 → col R
  if (headerRow[COLS.STRIPE_CUS] && headerRow[COLS.STRIPE_CUS] !== '') {
    Logger.log('Col Q already has header "' + headerRow[COLS.STRIPE_CUS] + '" — skipping');
  } else {
    members.getRange(1, COLS.STRIPE_CUS + 1).setValue('Stripe Customer ID');
    Logger.log('Added col Q header: Stripe Customer ID');
  }

  if (headerRow[COLS.SUB_TIER] && headerRow[COLS.SUB_TIER] !== '') {
    Logger.log('Col R already has header "' + headerRow[COLS.SUB_TIER] + '" — skipping');
  } else {
    members.getRange(1, COLS.SUB_TIER + 1).setValue('Subscription Tier');
    Logger.log('Added col R header: Subscription Tier');
  }

  Logger.log('setupMembersSheetColumns complete');
}

/**
 * RUN SECOND (after setupMembersSheetColumns).
 *
 * Writes the SWITCH() multiplier formula to every data row in
 * Outputs_PROCESSED col J. Includes sponsorship_secured at 3.0x.
 *
 * Output type labels must exactly match Google Form dropdown values.
 *
 * Safe to re-run: overwrites existing J formulas (idempotent).
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

  const dataRows = lastRow - 1; // rows 2..lastRow

  // Build formula array — one entry per data row, each referencing its own F column
  const formulas = [];
  for (let row = 2; row <= lastRow; row++) {
    formulas.push([
      '=SWITCH(F' + row + ',' +
      '"Sponsorship Secured",3.0,' +
      '"Deal Closed",2.5,' +
      '"Content Published",2.0,' +
      '"Code Shipped",2.0,' +
      '"Research Published",1.8,' +
      '"Strategic Output",1.7,' +
      '"Community Build",1.5,' +
      '"Training Log",1.2,' +
      '"Daily Check-In",1.0,' +
      '1.0)',
    ]);
  }

  // COL.P_MULTIPLIER = 10 → col J (1-based)
  processed.getRange(2, COL.P_MULTIPLIER, dataRows, 1).setFormulas(formulas);
  SpreadsheetApp.flush();

  Logger.log('updateMultiplierFormulas complete — updated ' + dataRows + ' rows in col J');
}

/**
 * RUN THIRD.
 *
 * Wrapper that runs the full pre-M3 setup sequence in order:
 *   1. setupMembersSheetColumns()
 *   2. updateMultiplierFormulas()
 *   3. Prints reminder to run backfillStripeCustomerIds() next
 *
 * After this completes:
 *   - Add STRIPE_SECRET_KEY to Config sheet row 16
 *   - Run backfillStripeCustomerIds()
 *   - Clear Config row 16 (delete the key)
 *   - Set ROAD_ACCRUAL_MODE=ops in Vercel
 */
function runPreM3Setup() {
  Logger.log('=== RoadHouse OS — Pre-M3 Setup ===');
  Logger.log('');
  Logger.log('Step 1: setupMembersSheetColumns()');
  setupMembersSheetColumns();
  Logger.log('');
  Logger.log('Step 2: updateMultiplierFormulas()');
  updateMultiplierFormulas();
  Logger.log('');
  Logger.log('=== Setup complete ===');
  Logger.log('');
  Logger.log('NEXT STEPS:');
  Logger.log('  1. Open Config sheet, set A16=STRIPE_SECRET_KEY, B16=sk_live_...');
  Logger.log('  2. Run backfillStripeCustomerIds() from Apps Script editor');
  Logger.log('  3. Verify Logger: check updated=N matches active Stripe subscriber count');
  Logger.log('  4. Delete Config B16 (remove Stripe key from sheet immediately)');
  Logger.log('  5. Set ROAD_ACCRUAL_MODE=ops in Vercel env vars');
}
