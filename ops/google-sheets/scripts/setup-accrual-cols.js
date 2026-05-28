'use strict';
/**
 * setup-accrual-cols.js
 *
 * One-time Node.js setup: adds Members sheet col Q/R headers and
 * non-sensitive Config rows (price IDs, platform URL).
 *
 * Run: node scripts/setup-accrual-cols.js
 *
 * SECRETS (CRON_SECRET, STRIPE_SECRET_KEY) are NOT written to the sheet.
 * Set them once in the Apps Script editor:
 *   setScriptSecrets('your_cron_secret', 'sk_live_...')
 */

const fs   = require('fs');
const path = require('path');
const { google } = require('googleapis');

const ROOT           = path.resolve(__dirname, '..');
const CREDS_PATH     = path.join(ROOT, 'credentials.json');
const TOKEN_PATH     = path.join(ROOT, 'token.json');
const SPREADSHEET_ID = '1AyMQbzOPHiceZEqjtZTlr8xnVgYCh2v-3E5SaA9cCHY';

// Load non-sensitive env vars from .env.local (price IDs are NEXT_PUBLIC — not secrets)
const ENV_PATH = path.resolve(ROOT, '..', '.env.local');
const envVars  = {};
if (fs.existsSync(ENV_PATH)) {
  fs.readFileSync(ENV_PATH, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) envVars[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
  });
}

const STRIPE_PRICE_REGULAR    = envVars.NEXT_PUBLIC_STRIPE_SUB_REGULAR || '';
const STRIPE_PRICE_RANCH_HAND = envVars.NEXT_PUBLIC_STRIPE_SUB_RANCH   || '';
const STRIPE_PRICE_PARTNER    = envVars.NEXT_PUBLIC_STRIPE_SUB_PARTNER  || '';

// Only non-sensitive values go into the Config sheet
const CONFIG_ROWS = [
  ['PLATFORM_BASE_URL',       'https://roadhouse.capital'],
  ['STRIPE_PRICE_REGULAR',    STRIPE_PRICE_REGULAR],
  ['STRIPE_PRICE_RANCH_HAND', STRIPE_PRICE_RANCH_HAND],
  ['STRIPE_PRICE_PARTNER',    STRIPE_PRICE_PARTNER],
];

async function getAuth() {
  const creds  = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  const { client_secret, client_id } = creds.installed || creds.web;
  const token  = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const client = new google.auth.OAuth2(client_id, client_secret);
  client.setCredentials(token);
  return client;
}

async function main() {
  console.log('\n⚔️  RoadHouse — Accrual Column Setup\n');

  const auth   = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // ── 1. Members sheet — add col Q, R, S, T, U headers ────────────────────
  console.log('Reading Members sheet header row...');
  const membersHeader = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Members!1:1',
  });
  const headerRow = membersHeader.data.values?.[0] ?? [];

  const needed = {
    Q: { idx: 16, label: 'Stripe Customer ID' },
    R: { idx: 17, label: 'Subscription Tier'  },
    S: { idx: 18, label: 'Is_Steward'         },
    T: { idx: 19, label: 'Verified_Bounties'  },
    U: { idx: 20, label: 'Last_Verification_Date' },
  };

  const missing = Object.entries(needed).filter(([, { idx, label }]) => headerRow[idx] !== label);

  if (missing.length === 0) {
    console.log('  ✓ All column headers already in place');
  } else {
    for (const [col, { idx, label }] of missing) {
      const colLetter = String.fromCharCode(65 + idx); // A=65
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Members!${colLetter}1`,
        valueInputOption: 'RAW',
        requestBody: { values: [[label]] },
      });
      console.log(`  ✓ Members!${colLetter}1 = "${label}"`);
    }
  }

  // ── 2. Config sheet — upsert non-sensitive rows ──────────────────────────
  console.log('\nReading Config sheet...');
  const configData = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Config!A:B',
  });
  const configRows = configData.data.values ?? [];
  const keyRowMap  = {};
  configRows.forEach(([key], i) => {
    if (key) keyRowMap[String(key).trim()] = i + 1;
  });

  console.log(`  Config sheet: ${configRows.length} rows`);

  for (const [key, value] of CONFIG_ROWS) {
    if (!value) {
      console.log(`  ⚠ Skipping ${key} — not found in .env.local`);
      continue;
    }
    if (keyRowMap[key]) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Config!B${keyRowMap[key]}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[value]] },
      });
      console.log(`  ✓ Updated: ${key}`);
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Config!A:B',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [[key, value]] },
      });
      console.log(`  ✓ Appended: ${key}`);
    }
  }

  // ── 3. Next steps ────────────────────────────────────────────────────────
  console.log('\n✓ Sheet setup complete.\n');
  console.log('NEXT — Apps Script editor (one-time):');
  console.log('  1. setScriptSecrets("your_cron_secret", "sk_live_...")');
  console.log('     Secrets stay in Script Properties — never in this sheet.');
  console.log('');
  console.log('  2. runM3Migration()');
  console.log('     Adds steward cols S/T/U + updates multiplier formulas.');
  console.log('');
  console.log('  3. runBackfill()');
  console.log('     Fills cols Q + R with Stripe IDs for all members.\n');
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
