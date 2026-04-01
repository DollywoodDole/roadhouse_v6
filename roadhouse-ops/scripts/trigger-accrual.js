'use strict';
/**
 * trigger-accrual.js
 * Reads Members sheet cols Q (cus_xxx) and R (sub tier),
 * builds the accruals array, and POSTs to /api/road/accrue.
 *
 * Mirrors exportWeeklyRoadAccrual() in RoadHouseOS.js exactly.
 * Run: node scripts/trigger-accrual.js
 *
 * Dry-run (no POST): node scripts/trigger-accrual.js --dry-run
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const { google } = require('googleapis');

const ROOT           = path.resolve(__dirname, '..');
const CREDS_PATH     = path.join(ROOT, 'credentials.json');
const TOKEN_PATH     = path.join(ROOT, 'token.json');
const SPREADSHEET_ID = '1AyMQbzOPHiceZEqjtZTlr8xnVgYCh2v-3E5SaA9cCHY';
const PLATFORM_URL   = 'https://roadhouse.capital';
const DRY_RUN        = process.argv.includes('--dry-run');

// Load env
const ENV_PATH = path.resolve(ROOT, '..', '.env.local');
const envVars  = {};
if (fs.existsSync(ENV_PATH)) {
  fs.readFileSync(ENV_PATH, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) envVars[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
  });
}

const CRON_SECRET = envVars.CRON_SECRET;

const RATE_MAP = { regular: 100, 'ranch-hand': 500, partner: 2000 };

const COL_INTERNAL_ID = 0;   // A
const COL_STRIPE_CUS  = 16;  // Q
const COL_SUB_TIER    = 17;  // R

async function getAuth() {
  const creds  = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  const { client_secret, client_id } = creds.installed || creds.web;
  const token  = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const client = new google.auth.OAuth2(client_id, client_secret);
  client.setCredentials(token);
  if (token.expiry_date && Date.now() > token.expiry_date - 60000) {
    const { credentials } = await client.refreshAccessToken();
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials, null, 2));
    client.setCredentials(credentials);
  }
  return client;
}

function getISOWeek(date) {
  const d      = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo    = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return d.getUTCFullYear() + '-W' + String(weekNo).padStart(2, '0');
}

function postJson(hostname, path, body, token) {
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname,
      path,
      method:  'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization':  'Bearer ' + token,
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  if (!CRON_SECRET) {
    console.error('ERROR: CRON_SECRET not found in .env.local');
    process.exit(1);
  }

  console.log(`\n⚔️  RoadHouse — $ROAD Accrual Trigger${DRY_RUN ? ' (DRY RUN)' : ''}\n`);

  const auth   = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // Read Members sheet cols A–R
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Members!A:R',
  });
  const rows = (res.data.values ?? []).slice(1); // skip header

  const accruals  = [];
  const noStripe  = [];
  const noSubTier = [];

  for (const row of rows) {
    const internalId = String(row[COL_INTERNAL_ID] ?? '').trim();
    const customerId = String(row[COL_STRIPE_CUS]  ?? '').trim();
    const subTier    = String(row[COL_SUB_TIER]    ?? '').trim().toLowerCase();

    if (!customerId.startsWith('cus_')) {
      if (internalId) noStripe.push(internalId);
      continue;
    }

    const amount = RATE_MAP[subTier];
    if (!amount) {
      if (subTier && !['regular', 'ranch-hand', 'partner'].includes(subTier)) {
        noSubTier.push({ internalId, subTier });
      }
      continue;
    }

    accruals.push({ customerId, amount, tier: subTier });
  }

  if (noStripe.length) {
    console.warn(`  WARNING: ${noStripe.length} rows missing Stripe ID — run backfill-stripe-ids.js first`);
  }
  if (noSubTier.length) {
    console.warn(`  WARNING: ${noSubTier.length} rows have unrecognised tier:`);
    noSubTier.forEach(m => console.warn(`    ${m.internalId} (tier="${m.subTier}")`));
  }

  if (accruals.length === 0) {
    console.log('  No accruals to process — cols Q and R may be empty. Run backfill-stripe-ids.js first.');
    return;
  }

  const week = getISOWeek(new Date());
  console.log(`  Week:     ${week}`);
  console.log(`  Accruals: ${accruals.length} members`);
  console.log(`  Tiers:    ${JSON.stringify(accruals.reduce((acc, a) => {
    acc[a.tier] = (acc[a.tier] ?? 0) + 1; return acc;
  }, {}))}`);

  if (DRY_RUN) {
    console.log('\n  DRY RUN — payload that would be sent:');
    console.log(JSON.stringify({ week, accruals }, null, 2));
    console.log('\n  Re-run without --dry-run to POST to production.');
    return;
  }

  console.log(`\n  POSTing to ${PLATFORM_URL}/api/road/accrue ...`);
  const { status, body } = await postJson('roadhouse.capital', '/api/road/accrue', { week, accruals }, CRON_SECRET);

  console.log(`  HTTP ${status}`);
  console.log(`  processed=${body.processed ?? '?'}  capped=${body.capped ?? 0}  errors=${body.errors?.length ?? 0}`);

  if (status !== 200) {
    console.error('\n  FAILED. Response body:');
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }

  if (body.errors?.length) {
    console.error('\n  Partial errors:');
    body.errors.forEach(e => console.error(`    [${e.index}] ${e.customerId}: ${e.reason}`));
  }

  console.log('\n  ✓ Accrual complete.\n');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
