'use strict';
const fs   = require('fs');
const path = require('path');
const http = require('http');
const u    = require('url');
const { google } = require('googleapis');

const ROOT       = path.resolve(__dirname, '..');
const CREDS_PATH = path.join(ROOT, 'credentials.json');
const TOKEN_PATH = path.join(ROOT, 'token.json');
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/forms',
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/script.deployments',
  'https://www.googleapis.com/auth/script.external_request',
];

async function main() {
  console.log('\n⚔️  RoadHouse — Google OAuth2 Setup\n');
  if (!fs.existsSync(CREDS_PATH)) {
    console.error('ERROR: credentials.json not found at: ' + CREDS_PATH);
    console.error('\nGet it from Google Cloud Console:');
    console.error('  1. console.cloud.google.com → create/select project "roadhouse-ops"');
    console.error('  2. APIs & Services → Enable: Sheets, Drive, Forms, Apps Script');
    console.error('  3. OAuth consent screen → External → add your email as test user');
    console.error('  4. Credentials → Create OAuth client ID → Desktop app → Download JSON');
    console.error('  5. Rename to credentials.json → place in roadhouse-ops/');
    process.exit(1);
  }
  if (fs.existsSync(TOKEN_PATH)) {
    console.log('✓ token.json already exists. Delete it to re-auth.\n');
    process.exit(0);
  }
  const creds = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  const { client_secret, client_id } = creds.installed || creds.web;
  const REDIRECT = 'http://localhost:3333/oauth2callback';
  const oAuth2 = new google.auth.OAuth2(client_id, client_secret, REDIRECT);
  const authUrl = oAuth2.generateAuthUrl({ access_type:'offline', scope:SCOPES, prompt:'consent' });
  console.log('Open this URL in your browser:\n\n' + authUrl + '\n');
  try { const open = require('open'); await open(authUrl); } catch(_) {}
  const code = await new Promise((res, rej) => {
    const srv = http.createServer((req, resp) => {
      const qs = u.parse(req.url, true).query;
      if (qs.code) {
        resp.end('<h2>Auth complete — return to terminal</h2>');
        srv.close(); res(qs.code);
      } else { resp.end('Error: ' + qs.error); srv.close(); rej(new Error(qs.error)); }
    });
    srv.listen(3333, () => console.log('Waiting on http://localhost:3333 ...'));
    setTimeout(() => { srv.close(); rej(new Error('Timeout')); }, 180000);
  });
  const { tokens } = await oAuth2.getToken(code);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log('\n✓ token.json saved. Run: node scripts/bootstrap.js\n');
}

async function getAuthClient() {
  if (!fs.existsSync(CREDS_PATH)) throw new Error('credentials.json missing. Run: node scripts/gauth.js');
  if (!fs.existsSync(TOKEN_PATH))  throw new Error('token.json missing. Run: node scripts/gauth.js');
  const creds  = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const { client_secret, client_id } = creds.installed || creds.web;
  const oAuth2 = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3333/oauth2callback');
  oAuth2.setCredentials(tokens);
  oAuth2.on('tokens', t => {
    const cur = JSON.parse(fs.readFileSync(TOKEN_PATH,'utf8'));
    fs.writeFileSync(TOKEN_PATH, JSON.stringify({...cur,...t},null,2));
  });
  return oAuth2;
}

if (require.main === module) { main().catch(e => { console.error(e.message); process.exit(1); }); }
module.exports = { getAuthClient };
