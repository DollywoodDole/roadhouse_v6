'use strict';
require('dotenv').config();
const { google } = require('googleapis');
const { getAuthClient } = require('./gauth.js');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SCRIPT_ID = '1DQauYe9yB-Z539gEITvBXV8sFVfOqxAZ2q1hz_CiizQTZqbjZtwpZY1T';
const G='\x1b[32m',Y='\x1b[33m',R='\x1b[31m',W='\x1b[1m',X='\x1b[0m';
const ok   = s => console.log(G+'✓'+X+' '+s);
const warn = s => console.log(Y+'⚠'+X+' '+s);
const fail = s => console.log(R+'✗'+X+' '+s);
const step = (n,s) => console.log('\n\x1b[34m['+n+']\x1b[0m '+W+s+X);

async function main() {
  console.log('\n'+W+'⚔️  ROADHOUSE OS — FINALIZING'+X+'\n');
  const auth   = await getAuthClient();
  const script = google.script({ version: 'v1', auth });
  const sheets = google.sheets({ version: 'v4', auth });

  // ── A. Push helper functions + set Script Properties ─────
  step('A', 'Script Properties');
  const helperSrc = `
function _setBootstrapProperties() {
  const p = PropertiesService.getScriptProperties();
  p.setProperty('ADMIN_EMAIL', 'admin@roadhouse.capital');
  p.setProperty('DISCORD_WEBHOOK', '');
  p.setProperty('FORM_ID', '');
  Logger.log('Properties: ' + JSON.stringify(p.getProperties()));
}
function _createTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncMembersToForm').timeBased().everyDays(1).atHour(3).create();
  ScriptApp.newTrigger('weeklyLeaderboard').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).create();
  ScriptApp.newTrigger('inactiveAlert').timeBased().everyDays(1).atHour(9).create();
  ScriptApp.newTrigger('enforceSubmissionCap').timeBased().everyDays(1).atHour(23).create();
  const names = ScriptApp.getProjectTriggers().map(t => t.getHandlerFunction());
  Logger.log('Triggers: ' + names.join(', '));
  return names;
}`;

  let files = [];
  try {
    const res = await script.projects.getContent({ scriptId: SCRIPT_ID });
    files = res.data.files || [];
    ok('Got script content (' + files.length + ' files)');
  } catch(e) { fail('getContent: ' + e.message); }

  // Remove old helper if present, add fresh
  files = files.filter(f => f.name !== '_bootstrap_helpers');
  files.push({ name: '_bootstrap_helpers', type: 'SERVER_JS', source: helperSrc });
  try {
    await script.projects.updateContent({ scriptId: SCRIPT_ID, requestBody: { files } });
    ok('Helper functions pushed');
  } catch(e) { fail('updateContent: ' + e.message); }

  // Run _setBootstrapProperties
  try {
    const r = await script.scripts.run({ scriptId: SCRIPT_ID, requestBody: { function: '_setBootstrapProperties', devMode: false } });
    if (r.data.error) {
      warn('Run error: ' + JSON.stringify(r.data.error));
      warn('Falling back: writing ADMIN_EMAIL to Config!B11');
      await sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: 'Config!B11', valueInputOption: 'RAW', requestBody: { values: [['admin@roadhouse.capital']] } });
      ok('ADMIN_EMAIL → Config!B11');
    } else { ok('Script Properties set via execution API'); }
  } catch(e) {
    warn('Execution API unavailable: ' + e.message);
    await sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: 'Config!B11', valueInputOption: 'RAW', requestBody: { values: [['admin@roadhouse.capital']] } });
    ok('ADMIN_EMAIL → Config!B11 (fallback)');
  }

  // ── B. Triggers ───────────────────────────────────────────
  step('B', 'Creating 4 triggers');
  try {
    const r = await script.scripts.run({ scriptId: SCRIPT_ID, requestBody: { function: '_createTriggers', devMode: false } });
    if (r.data.error) throw new Error(JSON.stringify(r.data.error));
    ok('4 triggers created via execution API');
  } catch(e) {
    warn('Execution API blocked (needs manual trigger setup): ' + e.message);
    console.log('');
    console.log('  Open: https://script.google.com/d/'+SCRIPT_ID+'/edit');
    console.log('  Clock icon → + Add Trigger × 4:');
    console.log('    syncMembersToForm    | Day timer  | 3am');
    console.log('    weeklyLeaderboard    | Week timer | Mon 7am');
    console.log('    inactiveAlert        | Day timer  | 9am');
    console.log('    enforceSubmissionCap | Day timer  | 11pm');
  }

  // ── C. First member row ───────────────────────────────────
  step('C', 'Writing RH-001 to Members!A2:F2');
  try {
    const ex = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Members!A2' });
    const val = ex.data.values && ex.data.values[0] && ex.data.values[0][0];
    if (val === 'RH-001') { ok('RH-001 already present'); }
    else {
      await sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: 'Members!A2:F2', valueInputOption: 'RAW',
        requestBody: { values: [['RH-001','dole','Dalton E.','roadhousesyndicate@gmail.com','2026-01-01','Founding']] } });
      ok('RH-001 written');
    }
  } catch(e) { fail('Member row: ' + e.message); }

  // ── D. Wallet columns ─────────────────────────────────────
  step('D', 'Wallet column headers N1:O1');
  try {
    const h = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Members!N1:O1' });
    const r = h.data.values && h.data.values[0];
    if (r && r[0]==='Wallet_Pubkey' && r[1]==='Wallet_Verified') { ok('Wallet columns already present'); }
    else {
      await sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: 'Members!N1:O1', valueInputOption: 'RAW',
        requestBody: { values: [['Wallet_Pubkey','Wallet_Verified']] } });
      ok('Wallet columns written');
    }
  } catch(e) { fail('Wallet cols: ' + e.message); }

  // ── E. Verify ─────────────────────────────────────────────
  step('E', 'Verification');
  const [tabsRes, memberRes, walletRes, configRes] = await Promise.all([
    sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID, fields: 'sheets.properties.title' }),
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Members!A2:F2' }),
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Members!N1:O1' }),
    sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Config!A1:B15' }),
  ]);
  const tabs   = tabsRes.data.sheets.map(s => s.properties.title);
  const member = (memberRes.data.values||[[]])[0];
  const wallet = (walletRes.data.values||[[]])[0];
  console.log('');
  console.log(W+'⚔️  ROADHOUSE OS — OPERATIONAL'+X);
  console.log('─'.repeat(54));
  console.log('Sheet:  https://docs.google.com/spreadsheets/d/'+SPREADSHEET_ID+'/edit');
  console.log('Drive:  https://drive.google.com/drive/folders/1bMJUoKQ0GUL9XpgEpCi8DPAImND_dWik');
  console.log('Script: https://script.google.com/d/'+SCRIPT_ID+'/edit');
  console.log('─'.repeat(54));
  console.log('Tabs   ['+(tabs.length===6?'✓':'✗')+'] '+tabs.join(', '));
  console.log('Member ['+(member[0]==='RH-001'?'✓':'✗')+'] '+member.join(' | '));
  console.log('Wallet ['+(wallet&&wallet[0]==='Wallet_Pubkey'?'✓':'✗')+'] '+(wallet||[]).join(', '));
  console.log('─'.repeat(54));
  console.log(W+'3 THINGS LEFT:'+X);
  console.log('  1. Discord webhook → bootstrap.config.json → node scripts/bootstrap.js');
  console.log('  2. Google Form → link to Outputs_RAW → FORM_ID to Script Properties');
  console.log('  3. Triggers → Apps Script editor if execution API was blocked');
  console.log('─'.repeat(54));
}

main().catch(e => { console.error('\x1b[31mERROR:\x1b[0m', e.message); process.exit(1); });
