'use strict';
require('dotenv').config();
const fs           = require('fs');
const path         = require('path');
const { execSync } = require('child_process');
const { google }   = require('googleapis');
const { getAuthClient } = require('./gauth.js');

const ROOT        = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'bootstrap.config.json');
const ENV_PATH    = path.join(ROOT, '.env');
const CLASP_PATH  = path.join(ROOT, '.clasp.json');
const G='\x1b[32m',Y='\x1b[33m',R='\x1b[31m',C='\x1b[36m',B='\x1b[34m',W='\x1b[1m',X='\x1b[0m';
const ok   = s => console.log(G+'✓'+X+' '+s);
const warn = s => console.log(Y+'⚠'+X+' '+s);
const step = (n,s) => console.log('\n'+B+'['+n+']'+X+' '+W+s+X);
const hr   = () => console.log('─'.repeat(50));
const run  = (cmd,o={}) => execSync(cmd,{cwd:ROOT,stdio:o.silent?'pipe':'inherit',...o});

function checkClasp() {
  try { const v=run('clasp --version',{silent:true}).toString().trim(); ok('clasp '+v); return true; }
  catch(_) {
    warn('clasp not found — installing...');
    try { run('npm install -g @google/clasp'); ok('clasp installed'); return true; }
    catch(e) { console.error(R+'✗'+X+' clasp install failed: '+e.message); return false; }
  }
}

function writeEnv(cfg) {
  if (fs.existsSync(ENV_PATH)) { warn('.env exists — skipping (delete to regenerate)'); return; }
  fs.writeFileSync(ENV_PATH,
`SPREADSHEET_ID=${cfg.google.spreadsheetId||''}
FORM_ID=${cfg.google.formId||''}
DRIVE_FOLDER_ID=${cfg.google.driveFolderId||''}
DISCORD_WEBHOOK_LEADERBOARD=${cfg.discord.webhookLeaderboard||''}
DISCORD_WEBHOOK_ALERTS=${cfg.discord.webhookAlerts||''}
DISCORD_BOT_TOKEN=${cfg.discord.botToken||''}
SOLANA_RPC_URL=${cfg.solana.rpcUrl||'https://api.mainnet-beta.solana.com'}
ROAD_TOKEN_MINT=${cfg.solana.roadTokenMint||''}
ADMIN_EMAIL=${cfg.admin.email||'admin@roadhouse.capital'}
TIMEZONE=${cfg.admin.timezone||'America/Regina'}
`);
  ok('.env written');
}

async function writeClasp(spreadsheetId, auth) {
  if (fs.existsSync(CLASP_PATH)) {
    const ex = JSON.parse(fs.readFileSync(CLASP_PATH,'utf8'));
    if (ex.scriptId && ex.scriptId.length > 10) { ok('.clasp.json exists: '+ex.scriptId); return ex.scriptId; }
  }
  const script = google.script({ version:'v1', auth });
  let scriptId;
  try {
    const r = await script.projects.create({ requestBody:{ title:'RoadHouse OS', parentId:spreadsheetId } });
    scriptId = r.data.scriptId;
    ok('Apps Script project (bound): '+scriptId);
  } catch(e) {
    warn('Bound create failed ('+e.message+') — trying standalone...');
    const r = await script.projects.create({ requestBody:{ title:'RoadHouse OS' } });
    scriptId = r.data.scriptId;
    ok('Apps Script project (standalone): '+scriptId);
    warn('Bind manually: open Apps Script → Project Settings → confirm parent spreadsheet');
  }
  fs.writeFileSync(CLASP_PATH, JSON.stringify({ scriptId, rootDir:'./src', fileExtension:'js',
    filePushOrder:['appsscript.json','Config.js','RoadHouseOS.js','WalletRegistry.js'] },null,2));
  ok('.clasp.json written');
  return scriptId;
}

async function testDiscord(url) {
  if (!url || url.length < 30) { warn('Discord webhook not set — skipping'); return; }
  const fetch = require('node-fetch');
  const r = await fetch(url,{ method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ content:'⚔️ **ROADHOUSE OS** — bootstrap complete ✓' }) });
  r.status===204 ? ok('Discord live (204)') : warn('Discord HTTP '+r.status);
}

async function main() {
  console.log('\n'+W+'⚔️  ROADHOUSE OS — BOOTSTRAP'+X);
  console.log('   Root: '+C+ROOT+X); hr();
  if (!fs.existsSync(CONFIG_PATH)) { console.error(R+'bootstrap.config.json not found'+X); process.exit(1); }
  let cfg = JSON.parse(fs.readFileSync(CONFIG_PATH,'utf8'));

  step('1/7','Google Auth');
  let auth;
  try { auth = await getAuthClient(); ok('Token valid'); }
  catch(e) { console.error(R+'✗'+X+' '+e.message+'\nRun: node scripts/gauth.js'); process.exit(1); }

  step('2/7','Spreadsheet');
  if (!cfg.google.spreadsheetId || cfg.google.spreadsheetId.length < 10) {
    const { main:cs } = require('./create-sheet.js');
    await cs();
    cfg = JSON.parse(fs.readFileSync(CONFIG_PATH,'utf8'));
  } else { ok('Using existing: '+cfg.google.spreadsheetId); }

  step('3/7','Drive Folder');
  const { main:mv } = require('./move-to-drive.js');
  await mv();
  cfg = JSON.parse(fs.readFileSync(CONFIG_PATH,'utf8'));

  step('4/7','.env');
  writeEnv(cfg);

  step('5/7','clasp + Apps Script');
  if (!checkClasp()) process.exit(1);
  const scriptId = await writeClasp(cfg.google.spreadsheetId, auth);

  step('6/7','Push scripts');
  try { run('clasp push --force'); ok('Scripts pushed'); }
  catch(e) { warn('clasp push failed: '+e.message); }

  step('7/7','Discord test');
  await testDiscord(cfg.discord.webhookLeaderboard);

  hr();
  console.log(W+G+'⚔️  BOOTSTRAP COMPLETE'+X);
  console.log('\nSheet:  '+C+'https://docs.google.com/spreadsheets/d/'+cfg.google.spreadsheetId+'/edit'+X);
  if(cfg.google.driveFolderId) console.log('Drive:  '+C+'https://drive.google.com/drive/folders/'+cfg.google.driveFolderId+X);
  console.log('Script: '+C+'https://script.google.com/d/'+scriptId+'/edit'+X);
  console.log('\n'+W+'NEXT:'+X);
  console.log('  A. clasp open → Project Settings → Script Properties');
  console.log('     Add: FORM_ID, DISCORD_WEBHOOK, ADMIN_EMAIL');
  console.log('  B. clasp open → Triggers → set 4 time-based triggers');
  console.log('  C. Members sheet → add first row: RH-001 / your handle / email');
  console.log('  D. npm run test:webhook');
  console.log('');
}

main().catch(e => { console.error(R+'BOOTSTRAP ERROR:'+X,e.message); process.exit(1); });
