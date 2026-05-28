// ============================================================
// Config.js — RoadHouse OS
// All constants pulled from Config sheet at runtime.
// Never hardcode values that appear in Config!B1:B15
//
// SECRETS (CRON_SECRET, STRIPE_SECRET_KEY) live in Apps Script
// Script Properties — never in the spreadsheet.
// Set them once via setScriptSecrets() from the editor.
// ============================================================

const SHEET = {
  MEMBERS:    'Members',
  RAW:        'Outputs_RAW',
  PROCESSED:  'Outputs_PROCESSED',
  SCOREBOARD: 'Scoreboard',
  DASHBOARD:  'Dashboard_View',
  CONFIG:     'Config',
};

const COL = {
  // Members — 1-based sheet column indices
  M_ID:                1,  // A — RH-XXXX
  M_HANDLE:            2,  // B
  M_NAME:              3,  // C
  M_EMAIL:             4,  // D
  M_JOIN:              5,  // E
  M_COHORT:            6,  // F
  M_STATUS:            7,  // G (formula)
  M_TIER:              8,  // H (formula — ops tier: Observer/Contributor/Producer/Operator)
  M_TOTAL_SCORE:       9,  // I (formula)
  M_TOTAL_OUTS:        10, // J (formula)
  M_STREAK:            11, // K
  M_LAST_SUB:          12, // L (formula)
  M_ACTIVE:            13, // M (formula)
  M_WALLET:            14, // N — Solana pubkey
  M_WALLET_VERIFIED:   15, // O — checkbox
  M_NOTES:             16, // P
  M_STRIPE_CUS:        17, // Q — Stripe Customer ID (cus_xxx)
  M_SUB_TIER:          18, // R — Subscription tier (regular/ranch-hand/partner)
  M_STEWARD:           19, // S — Is_Steward (checkbox) — M3
  M_VERIFIED_BOUNTIES: 20, // T — Verified_Bounties count — M3
  M_LAST_VERIFICATION: 21, // U — Last_Verification_Date — M3

  // Outputs_PROCESSED — 1-based
  P_ROW_ID:       1,  // A
  P_MEMBER_ID:    2,  // B
  P_HANDLE:       3,  // C
  P_DATE:         4,  // D
  P_WEEK:         5,  // E
  P_TYPE:         6,  // F
  P_TITLE:        7,  // G
  P_SCORE_FINAL:  8,  // H
  P_SCORE_RAW:    9,  // I
  P_MULTIPLIER:   10, // J
  P_VALID:        11, // K
  P_URL:          12, // L
  P_DAY:          13, // M
  P_WEEKEND:      14, // N
};

/**
 * Overloaded config reader:
 *   getConfig(rowNum) → single value by 1-based row index
 *   getConfig()       → full named object { KEY: value, ... }
 *
 * NOTE: secrets (CRON_SECRET, STRIPE_SECRET_KEY) are NOT in the Config
 * sheet — use getCronSecret() and getStripeSecretKey() instead.
 */
let _configCache = null;
function getConfig(rowNum) {
  if (!_configCache) {
    const cfg = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.CONFIG);
    if (!cfg) throw new Error('Config sheet not found');
    _configCache = cfg.getRange(1, 1, 20, 2).getValues();
  }

  if (rowNum === undefined) {
    const result = {};
    _configCache.forEach(([key, val]) => {
      const k = String(key || '').trim();
      if (k) result[k] = val;
    });
    return result;
  }

  return _configCache[rowNum - 1][1];
}

/**
 * Write one or more key/value pairs to the Config sheet.
 * Upserts by key — updates if found, appends if new.
 * Invalidates cache on write.
 */
function setConfig(updates) {
  _configCache = null;
  const cfg  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.CONFIG);
  const data = cfg.getDataRange().getValues();

  for (const [key, value] of Object.entries(updates)) {
    const rowIndex = data.findIndex((r) => String(r[0] || '').trim() === key);
    if (rowIndex !== -1) {
      cfg.getRange(rowIndex + 1, 2).setValue(value);
    } else {
      const lastRow = cfg.getLastRow();
      cfg.getRange(lastRow + 1, 1).setValue(key);
      cfg.getRange(lastRow + 1, 2).setValue(value);
    }
  }
}

// ── Config sheet helpers (non-sensitive) ─────────────────────────────────────

function getCurrentWeek()          { return getConfig(1); }
function getCurrentYear()          { return getConfig(2); }
function getInactiveThreshold()    { return getConfig(4); }
function getTierContributorMin()   { return getConfig(6); }
function getTierProducerMin()      { return getConfig(7); }
function getTierOperatorMin()      { return getConfig(8); }
function getMaxDailySubmissions()  { return getConfig(10); }
function getAdminEmail()           { return getConfig(11); }
function getDiscordWebhook()       { return getConfig(12); }
function getRoadConversionRate()   { return getConfig(13); }
function getPlatformBaseUrl()      { return getConfig(14); }

// ── Script Properties helpers (secrets — never touch the sheet) ──────────────

/**
 * Returns CRON_SECRET from Script Properties.
 * Falls back to Config sheet row 15 for backwards compatibility
 * (existing deployments that haven't migrated yet).
 */
function getCronSecret() {
  const fromProps = PropertiesService.getScriptProperties().getProperty('CRON_SECRET');
  if (fromProps) return fromProps;
  // Migration fallback — remove once all deployments use setScriptSecrets()
  return getConfig(15) || '';
}

/**
 * Returns STRIPE_SECRET_KEY from Script Properties only.
 * Never reads from the Config sheet.
 */
function getStripeSecretKey() {
  return PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY') || '';
}

/**
 * ONE-TIME ADMIN SETUP — run from Apps Script editor, not a trigger.
 *
 * Writes secrets to Script Properties so they never appear in the spreadsheet.
 * Both params are optional — omit either to leave it unchanged.
 *
 * Usage (Apps Script editor console):
 *   setScriptSecrets('your_cron_secret', 'sk_live_...')
 *
 * After running:
 *   - Delete CRON_SECRET row from Config sheet if present
 *   - Never add STRIPE_SECRET_KEY to the Config sheet
 */
function setScriptSecrets(cronSecret, stripeSecretKey) {
  const props = PropertiesService.getScriptProperties();
  if (cronSecret)      props.setProperty('CRON_SECRET',        cronSecret);
  if (stripeSecretKey) props.setProperty('STRIPE_SECRET_KEY',  stripeSecretKey);
  Logger.log('Script Properties updated:');
  Logger.log('  CRON_SECRET:       ' + (cronSecret      ? '✓ set' : '(unchanged)'));
  Logger.log('  STRIPE_SECRET_KEY: ' + (stripeSecretKey ? '✓ set' : '(unchanged)'));
  Logger.log('');
  Logger.log('Verify with: PropertiesService.getScriptProperties().getProperties()');
  Logger.log('Never paste these values into the Config sheet.');
}
