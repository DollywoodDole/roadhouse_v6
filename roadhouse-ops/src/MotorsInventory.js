// ============================================================
// MotorsInventory.js — RoadHouse OS
//
// Syncs live motors.roadhouse.capital inventory into a Google
// Sheet stored in G:\My Drive\RoadHouse_Motors\.
//
// ONE-TIME SETUP:
//   1. Run setupMotorsSheet() from the Apps Script editor.
//      This creates the spreadsheet, stores its ID in Script
//      Properties, and registers the daily sync trigger.
//   2. Make sure CRON_SECRET is set in Script Properties via
//      setScriptSecrets() in Config.js.
//
// DAILY SYNC:
//   syncMotorsInventory() runs automatically at 9:30am Regina
//   time (30 min after the Vercel cron that refreshes KV).
// ============================================================

const MOTORS_FEED_URL   = 'https://motors.roadhouse.capital/api/motors/feed?format=json';
const MOTORS_SHEET_NAME = 'Inventory';
const MOTORS_PROP_KEY   = 'MOTORS_SHEET_ID';
const MOTORS_FOLDER     = 'RoadHouse_Motors';

const MOTORS_HEADERS = [
  'VIN',
  'Stock #',
  'Year',
  'Make',
  'Model',
  'Trim',
  'Body Style',
  'Mileage (km)',
  'Price (CAD)',
  'MSRP (CAD)',
  'Status',
  'Fuel Type',
  'Transmission',
  'Ext. Color',
  'Int. Color',
  'Features',
  'Listing URL',
  'Updated At',
];

// ── Public entry points ───────────────────────────────────────────────────────

/**
 * ONE-TIME SETUP — run manually from the Apps Script editor.
 *
 * - Finds or creates the RoadHouse_Motors folder in My Drive.
 * - Finds or creates the Motors_Inventory spreadsheet inside it.
 * - Writes the sheet ID to Script Properties.
 * - Sets up a daily time-based trigger (9:30am Regina time).
 * - Runs an initial sync.
 */
function setupMotorsSheet() {
  const ss = _getOrCreateSpreadsheet();
  Logger.log('Motors sheet ready: ' + ss.getUrl());
  _setupMotorsTrigger();
  syncMotorsInventory();
  Logger.log('Setup complete. Daily sync trigger registered.');
}

/**
 * Main sync function — called by daily trigger and by setupMotorsSheet().
 *
 * Fetches the full JSON feed, clears the sheet, and rewrites all rows.
 */
function syncMotorsInventory() {
  const cronSecret = getCronSecret();
  if (!cronSecret) {
    Logger.log('[Motors] CRON_SECRET not set — run setScriptSecrets() first.');
    return;
  }

  // Fetch feed
  let payload;
  try {
    const res = UrlFetchApp.fetch(MOTORS_FEED_URL, {
      method:            'get',
      headers:           { Authorization: 'Bearer ' + cronSecret },
      muteHttpExceptions: true,
    });
    const code = res.getResponseCode();
    if (code !== 200) {
      Logger.log('[Motors] Feed returned HTTP ' + code + ': ' + res.getContentText().slice(0, 300));
      return;
    }
    payload = JSON.parse(res.getContentText());
  } catch (e) {
    Logger.log('[Motors] Fetch error: ' + e.message);
    return;
  }

  const vehicles = payload.vehicles || [];
  if (!vehicles.length) {
    Logger.log('[Motors] Feed returned 0 vehicles — skipping write.');
    return;
  }

  // Get sheet
  const ss    = _getOrCreateSpreadsheet();
  const sheet = _getOrCreateTab(ss);

  // Clear existing data (preserves formatting on row 1 header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, MOTORS_HEADERS.length).clearContent();
  }

  // Write header (idempotent)
  sheet.getRange(1, 1, 1, MOTORS_HEADERS.length).setValues([MOTORS_HEADERS]);

  // Build rows
  const rows = vehicles.map((v) => [
    v.vin            ?? '',
    v.stock_number   ?? '',
    v.year           ?? '',
    v.make           ?? '',
    v.model          ?? '',
    v.trim           ?? '',
    v.body_style     ?? '',
    v.mileage_km     ?? '',
    v.price_cad      ?? '',
    v.msrp_cad       ?? '',
    v.status         ?? '',
    v.fuel_type      ?? '',
    v.transmission   ?? '',
    v.exterior_color ?? '',
    v.interior_color ?? '',
    Array.isArray(v.features) ? v.features.join(', ') : (v.features ?? ''),
    v.url            ?? '',
    v.updated_at     ?? '',
  ]);

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, MOTORS_HEADERS.length).setValues(rows);
  }

  // Timestamp in a named range / cell A1 note
  sheet.getRange(1, 1).setNote('Last synced: ' + new Date().toLocaleString('en-CA', { timeZone: 'America/Regina' }));

  Logger.log('[Motors] Synced ' + rows.length + ' vehicles → ' + ss.getUrl());
}

// ── Private helpers ───────────────────────────────────────────────────────────

/**
 * Returns the Motors inventory spreadsheet.
 * Creates it (and the Drive folder) if it doesn't exist yet.
 * Caches the spreadsheet ID in Script Properties.
 */
function _getOrCreateSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const existingId = props.getProperty(MOTORS_PROP_KEY);

  if (existingId) {
    try {
      return SpreadsheetApp.openById(existingId);
    } catch (_) {
      // File may have been deleted — fall through to recreate
      Logger.log('[Motors] Cached sheet ID invalid, recreating.');
    }
  }

  // Find or create the Drive folder
  const folder = _getOrCreateFolder(MOTORS_FOLDER);

  // Check if a spreadsheet with this name already exists in the folder
  const existing = folder.getFilesByName('Motors_Inventory');
  if (existing.hasNext()) {
    const file = existing.next();
    const ss = SpreadsheetApp.openById(file.getId());
    props.setProperty(MOTORS_PROP_KEY, ss.getId());
    Logger.log('[Motors] Found existing spreadsheet: ' + ss.getUrl());
    return ss;
  }

  // Create fresh
  const ss = SpreadsheetApp.create('Motors_Inventory');
  props.setProperty(MOTORS_PROP_KEY, ss.getId());

  // Move into the RoadHouse_Motors folder
  const file = DriveApp.getFileById(ss.getId());
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file); // remove from root

  Logger.log('[Motors] Created new spreadsheet: ' + ss.getUrl());
  return ss;
}

/**
 * Returns the "Inventory" tab in the given spreadsheet, creating it if needed.
 * Renames Sheet1 on first creation instead of adding a tab.
 */
function _getOrCreateTab(ss) {
  let sheet = ss.getSheetByName(MOTORS_SHEET_NAME);
  if (sheet) return sheet;

  // Rename the default tab if it exists and is empty
  const sheets = ss.getSheets();
  if (sheets.length === 1 && sheets[0].getLastRow() === 0) {
    sheets[0].setName(MOTORS_SHEET_NAME);
    sheet = sheets[0];
  } else {
    sheet = ss.insertSheet(MOTORS_SHEET_NAME);
  }

  // Initial formatting
  sheet.setFrozenRows(1);
  const headerRange = sheet.getRange(1, 1, 1, MOTORS_HEADERS.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#1a1712'); // rh-card dark
  headerRange.setFontColor('#c9922a');  // gold

  // Column widths
  const widths = [180, 90, 60, 100, 120, 150, 110, 110, 110, 110, 90, 100, 120, 130, 130, 350, 280, 180];
  widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  return sheet;
}

/**
 * Finds a Drive folder by name in My Drive, or creates it.
 */
function _getOrCreateFolder(name) {
  const iter = DriveApp.getFoldersByName(name);
  if (iter.hasNext()) return iter.next();
  Logger.log('[Motors] Creating Drive folder: ' + name);
  return DriveApp.createFolder(name);
}

/**
 * Registers a daily 9:30am (Regina) time-based trigger for syncMotorsInventory.
 * Safe to call multiple times — deletes existing motors triggers first.
 */
function _setupMotorsTrigger() {
  // Remove any existing motors sync triggers
  ScriptApp.getProjectTriggers().forEach((t) => {
    if (t.getHandlerFunction() === 'syncMotorsInventory') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('syncMotorsInventory')
    .timeBased()
    .atHour(9)
    .nearMinute(30)
    .everyDays(1)
    .inTimezone('America/Regina')
    .create();

  Logger.log('[Motors] Daily trigger set: 9:30am Regina time.');
}
