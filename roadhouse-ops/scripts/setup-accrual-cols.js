'use strict';
/**
 * setup-accrual-cols.js
 * One-time setup: adds Members sheet col Q/R headers and Config rows 14-19.
 * Run: node scripts/setup-accrual-cols.js
 */

const fs   = require('fs');
const path = require('path');
const { google } = require('googleapis');

const ROOT           = path.resolve(__dirname, '..');
const CREDS_PATH     = path.join(ROOT, 'credentials.json');
const TOKEN_PATH     = path.join(ROOT, 'token.json');
const SPREADSHEET_ID = '1AyMQbzOPHiceZEqjtZTlr8xnVgYCh2v-3E5SaA9cCHY';

// Load secrets from .env.local — never hardcode
const ENV_PATH = path.resolve(ROOT, '..', '.env.local');
const envVars  = {};
if (fs.existsSync(ENV_PATH)) {
  fs.readFileSync(ENV_PATH, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) envVars[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
  });
}

const CRON_SECRET         = envVars.CRON_SECRET         || '';
const STRIPE_SECRET_KEY   = envVars.STRIPE_SECRET_KEY   || '';
const STRIPE_PRICE_REGULAR    = envVars.NEXT_PUBLIC_STRIPE_SUB_REGULAR || '';
const STRIPE_PRICE_RANCH_HAND = envVars.NEXT_PUBLIC_STRIPE_SUB_RANCH   || '';
const STRIPE_PRICE_PARTNER    = envVars.NEXT_PUBLIC_STRIPE_SUB_PARTNER  || '';

// Config rows to upsert (key → value) — values sourced from .env.local
const CONFIG_ROWS = [
  ['PLATFORM_BASE_URL',       'https://roadhouse.capital'],
  ['CRON_SECRET',             CRON_SECRET],
  ['STRIPE_SECRET_KEY',       STRIPE_SECRET_KEY],
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

  // ── 1. Read Members sheet row 1 to find/confirm col Q and R ─────────────
  console.log('Reading Members sheet header row...');
  const membersHeader = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Members!1:1',
  });
  const headerRow = membersHeader.data.values?.[0] ?? [];
  const colQ = headerRow[16]; // index 16 = col Q
  const colR = headerRow[17]; // index 17 = col R
  console.log(`  Col Q (index 16): "${colQ ?? '(empty)'}"`);
  console.log(`  Col R (index 17): "${colR ?? '(empty)'}"`);

  if (colQ === 'Stripe Customer ID' && colR === 'Subscription Tier') {
    console.log('  ✓ Headers already in place, skipping write');
  } else {
    console.log('  Writing col Q and R headers...');
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Members!Q1:R1',
      valueInputOption: 'RAW',
      requestBody: { values: [['Stripe Customer ID', 'Subscription Tier']] },
    });
    console.log('  ✓ Members!Q1 = "Stripe Customer ID"');
    console.log('  ✓ Members!R1 = "Subscription Tier"');
  }

  // ── 2. Read Config sheet — build key→row map ─────────────────────────────
  console.log('\nReading Config sheet...');
  const configData = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Config!A:B',
  });
  const configRows = configData.data.values ?? [];
  const keyRowMap  = {};
  configRows.forEach(([key], i) => {
    if (key) keyRowMap[String(key).trim()] = i + 1; // 1-indexed
  });

  console.log(`  Config sheet has ${configRows.length} rows`);

  // ── 3. Upsert each config key ────────────────────────────────────────────
  for (const [key, value] of CONFIG_ROWS) {
    if (keyRowMap[key]) {
      // Update existing row
      const rowNum = keyRowMap[key];
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Config!B${rowNum}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[value]] },
      });
      console.log(`  ✓ Updated row ${rowNum}: ${key}`);
    } else {
      // Append new row
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

  console.log('\n✓ Sheet setup complete.\n');
  console.log('Next steps (in Apps Script editor):');
  console.log('  1. Run backfillStripeCustomerIds()');
  console.log('  2. Verify Members col Q + R populated');
  console.log('  3. Run exportWeeklyRoadAccrual()');
  console.log('  4. Set ROAD_ACCRUAL_MODE=ops in Vercel\n');
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
