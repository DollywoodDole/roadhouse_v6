'use strict';
/**
 * run-backfill.js
 * Calls Apps Script functions via the Google Apps Script REST API.
 * Usage: node scripts/run-backfill.js [functionName]
 * Default: backfillStripeCustomerIds
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');
const { google } = require('googleapis');

const ROOT      = path.resolve(__dirname, '..');
const CREDS_PATH = path.join(ROOT, 'credentials.json');
const TOKEN_PATH = path.join(ROOT, 'token.json');
const SCRIPT_ID  = '1DQauYe9yB-Z539gEITvBXV8sFVfOqxAZ2q1hz_CiizQTZqbjZtwpZY1T';

const FUNCTION_NAME = process.argv[2] || 'backfillStripeCustomerIds';

async function getAuth() {
  const creds  = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  const { client_secret, client_id } = creds.installed || creds.web;
  const token  = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const client = new google.auth.OAuth2(client_id, client_secret);
  client.setCredentials(token);
  // Refresh if needed
  if (token.expiry_date && Date.now() > token.expiry_date - 60000) {
    const { credentials } = await client.refreshAccessToken();
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials, null, 2));
    client.setCredentials(credentials);
  }
  return client;
}

async function runFunction(auth, functionName) {
  const script = google.script({ version: 'v1', auth });

  console.log(`\n⚔️  Running ${functionName}()...\n`);
  console.log('This may take several minutes for large member lists.');
  console.log('Apps Script has a 6-minute execution limit.\n');

  try {
    const res = await script.scripts.run({
      scriptId: SCRIPT_ID,
      requestBody: {
        function:   functionName,
        devMode:    true,   // run against latest saved version
        parameters: [],
      },
    });

    const result = res.data;

    if (result.error) {
      const err = result.error;
      console.error('Script execution error:');
      console.error('  Status:', err.code);
      console.error('  Message:', err.message);
      if (err.details) {
        err.details.forEach(d => {
          if (d.scriptStackTraceElements) {
            console.error('  Stack:');
            d.scriptStackTraceElements.forEach(f =>
              console.error(`    ${f.function} (line ${f.lineNumber})`)
            );
          }
          if (d.errorMessage) console.error('  Error:', d.errorMessage);
        });
      }
      return false;
    }

    console.log('✓ Function completed successfully.');
    if (result.response?.result !== undefined) {
      console.log('  Return value:', JSON.stringify(result.response.result, null, 2));
    }
    return true;
  } catch (err) {
    if (err.code === 403) {
      console.error('ERROR 403 — Apps Script Execution API not enabled or script not deployed.');
      console.error('\nTo fix:');
      console.error('  1. console.cloud.google.com → APIs & Services → Enable Library');
      console.error('  2. Search "Apps Script API" → Enable it for your project');
      console.error('  3. In Apps Script editor: Deploy → New deployment → API Executable');
      console.error('     (devMode:true bypasses this but still needs the API enabled)');
      console.error('\nAlternatively: run manually in Apps Script editor (script.google.com)');
    } else {
      console.error('ERROR:', err.message);
    }
    return false;
  }
}

async function main() {
  const auth = await getAuth();
  const ok   = await runFunction(auth, FUNCTION_NAME);
  process.exit(ok ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
