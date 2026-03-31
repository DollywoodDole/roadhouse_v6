// ============================================================
// Config.js — RoadHouse OS
// All constants pulled from Config sheet at runtime.
// Never hardcode values that appear in Config!B1:B15
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
  // Members
  M_ID:           1,  // A — Member_ID
  M_HANDLE:       2,  // B
  M_NAME:         3,  // C
  M_EMAIL:        4,  // D
  M_JOIN:         5,  // E
  M_COHORT:       6,  // F
  M_STATUS:       7,  // G (formula)
  M_TIER:         8,  // H (formula)
  M_TOTAL_SCORE:  9,  // I (formula)
  M_TOTAL_OUTS:   10, // J (formula)
  M_STREAK:       11, // K
  M_LAST_SUB:     12, // L (formula)
  M_ACTIVE:       13, // M (formula)
  M_WALLET:          14, // N — Solana pubkey (V2)
  M_WALLET_VERIFIED: 15, // O — checkbox
  M_NOTES:           16, // P

  // Outputs_PROCESSED
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
 * Get a config value by row number from Config sheet.
 * Row 1 = CURRENT_WEEK, Row 2 = CURRENT_YEAR, etc.
 */
let _configCache = null;
function getConfig(rowNum) {
  if (!_configCache) {
    const cfg = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET.CONFIG);
    if (!cfg) throw new Error('Config sheet not found');
    _configCache = cfg.getRange(1, 1, 15, 2).getValues();
  }
  return _configCache[rowNum - 1][1];
}

function getCurrentWeek()          { return getConfig(1); }
function getCurrentYear()          { return getConfig(2); }
function getInactiveThreshold()    { return getConfig(4); }
function getTierContributorMin()   { return getConfig(6); }
function getTierProducerMin()      { return getConfig(7); }
function getTierOperatorMin()      { return getConfig(8); }
function getMaxDailySubmissions()  { return getConfig(10); }
function getAdminEmail()           { return getConfig(11); }
function getDiscordWebhook()       { return getConfig(12); }
function getRoadConversionRate()   { return getConfig(13); } // score points per $ROAD
function getPlatformBaseUrl()      { return getConfig(14); } // https://roadhouse.capital
function getCronSecret()           { return getConfig(15); } // matches CRON_SECRET on Vercel
