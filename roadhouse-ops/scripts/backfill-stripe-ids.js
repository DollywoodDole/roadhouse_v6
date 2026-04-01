'use strict';
/**
 * backfill-stripe-ids.js
 * Reads Members sheet, finds each member's Stripe customer by email,
 * writes cus_xxx to col Q and canonical subscription tier to col R.
 *
 * Mirrors backfillStripeCustomerIds() in RoadHouseOS.js exactly.
 * Run: node scripts/backfill-stripe-ids.js
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const { google } = require('googleapis');

const ROOT           = path.resolve(__dirname, '..');
const CREDS_PATH     = path.join(ROOT, 'credentials.json');
const TOKEN_PATH     = path.join(ROOT, 'token.json');
const SPREADSHEET_ID = '1AyMQbzOPHiceZEqjtZTlr8xnVgYCh2v-3E5SaA9cCHY';

// Load env — prefer .env.local in project root
const ENV_PATH = path.resolve(ROOT, '..', '.env.local');
const envVars  = {};
if (fs.existsSync(ENV_PATH)) {
  fs.readFileSync(ENV_PATH, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) envVars[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
  });
}

const STRIPE_KEY          = envVars.STRIPE_SECRET_KEY;
const STRIPE_PRICE_REGULAR    = envVars.NEXT_PUBLIC_STRIPE_SUB_REGULAR;
const STRIPE_PRICE_RANCH_HAND = envVars.NEXT_PUBLIC_STRIPE_SUB_RANCH;
const STRIPE_PRICE_PARTNER    = envVars.NEXT_PUBLIC_STRIPE_SUB_PARTNER;

const PRICE_TO_TIER = {
  [STRIPE_PRICE_REGULAR]:    'regular',
  [STRIPE_PRICE_RANCH_HAND]: 'ranch-hand',
  [STRIPE_PRICE_PARTNER]:    'partner',
};

// Column indices (0-based) — must match COLS in RoadHouseOS.js
const COL_EMAIL     = 3;   // D
const COL_STRIPE_CUS = 16; // Q
const COL_SUB_TIER  = 17;  // R

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

function stripeGet(path, apiKey) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.stripe.com',
      path,
      method: 'GET',
      headers: { Authorization: 'Bearer ' + apiKey },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  if (!STRIPE_KEY) {
    console.error('ERROR: STRIPE_SECRET_KEY not found in .env.local');
    process.exit(1);
  }

  console.log('\n⚔️  RoadHouse — Stripe Customer ID Backfill\n');
  console.log(`  Stripe key: ${STRIPE_KEY.slice(0, 12)}...`);
  console.log(`  Regular:    ${STRIPE_PRICE_REGULAR}`);
  console.log(`  Ranch Hand: ${STRIPE_PRICE_RANCH_HAND}`);
  console.log(`  Partner:    ${STRIPE_PRICE_PARTNER}\n`);

  const auth   = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // Read all Members data
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Members!A:R',
  });
  const rows = res.data.values ?? [];
  console.log(`  Members sheet: ${rows.length - 1} data rows (excluding header)\n`);

  let updated = 0, skipped = 0, notFound = 0, noActiveSub = 0, errors = 0;

  for (let i = 1; i < rows.length; i++) {
    const row         = rows[i] ?? [];
    const email       = String(row[COL_EMAIL]      ?? '').trim();
    const existingCus = String(row[COL_STRIPE_CUS] ?? '').trim();

    if (existingCus.startsWith('cus_')) {
      skipped++;
      continue;
    }

    if (!email || !email.includes('@')) {
      console.log(`  Row ${i + 1}: no valid email — skipping`);
      continue;
    }

    try {
      const searchPath =
        `/v1/customers/search?query=email:'${encodeURIComponent(email)}'` +
        `&limit=1&expand[]=data.subscriptions`;

      const { status, body } = await stripeGet(searchPath, STRIPE_KEY);

      if (status !== 200) {
        console.error(`  Row ${i + 1} (${email}): Stripe error — ${body.error?.message}`);
        errors++;
        continue;
      }

      if (!body.data || body.data.length === 0) {
        console.log(`  Row ${i + 1} (${email}): no Stripe customer`);
        notFound++;
        continue;
      }

      const customer   = body.data[0];
      const customerId = customer.id;

      const activeSubs = (customer.subscriptions?.data ?? [])
        .filter(s => s.status === 'active' || s.status === 'trialing');

      let subTier = '';
      if (activeSubs.length > 0) {
        const priceId = activeSubs[0]?.items?.data?.[0]?.price?.id;
        subTier = PRICE_TO_TIER[priceId] ?? 'regular';
        if (!PRICE_TO_TIER[priceId]) {
          console.warn(`  Row ${i + 1} (${email}): price ${priceId} not in map — defaulting to regular`);
        }
      } else {
        console.log(`  Row ${i + 1} (${email}): ${customerId} has no active subscription`);
        noActiveSub++;
      }

      // Write col Q (cus_xxx) and col R (sub tier) — Sheets uses 1-indexed rows/cols
      const rowNum = i + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Members!Q${rowNum}:R${rowNum}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[customerId, subTier]] },
      });

      updated++;
      console.log(`  Row ${rowNum} (${email}): ${customerId} | tier=${subTier || 'none (lapsed)'}`);

      // Rate-limit buffer: 400ms sleep every 20 updated rows
      if (updated % 20 === 0) {
        console.log('  [rate-limit pause 400ms]');
        await sleep(400);
      }

    } catch (e) {
      console.error(`  Row ${i + 1} (${email}): exception — ${e.message}`);
      errors++;
    }
  }

  console.log(`
backfill complete:
  updated=${updated}  skipped=${skipped}  notFound=${notFound}  noActiveSub=${noActiveSub}  errors=${errors}
`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
