'use strict';
require('dotenv').config();
const { google } = require('googleapis');
const { getAuthClient } = require('./gauth.js');

const SCRIPT_ID      = '1DQauYe9yB-Z539gEITvBXV8sFVfOqxAZ2q1hz_CiizQTZqbjZtwpZY1T';
const FORM_ID        = '1bdIc6TRu9NbAT82q2-przySllG1YtfUIyv61mH4AydA';
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const G='\x1b[32m',Y='\x1b[33m',X='\x1b[0m';
const ok   = s => console.log(G+'✓'+X+' '+s);
const warn = s => console.log(Y+'⚠'+X+' '+s);

async function main() {
  const auth   = await getAuthClient();
  const script = google.script({ version: 'v1', auth });

  // Push helpers
  const contentRes = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = (contentRes.data.files || []).filter(f => f.name !== '_set_form_id');
  const helperSrc = [
    'function _setFormId() {',
    '  PropertiesService.getScriptProperties().setProperty("FORM_ID", "' + FORM_ID + '");',
    '  Logger.log("FORM_ID set: ' + FORM_ID + '");',
    '}',
    'function _linkFormToSheet() {',
    '  var form = FormApp.openById("' + FORM_ID + '");',
    '  form.setDestination(FormApp.DestinationType.SPREADSHEET, "' + SPREADSHEET_ID + '");',
    '  Logger.log("Form linked to: ' + SPREADSHEET_ID + '");',
    '}',
  ].join('\n');

  files.push({ name: '_set_form_id', type: 'SERVER_JS', source: helperSrc });
  await script.projects.updateContent({ scriptId: SCRIPT_ID, requestBody: { files } });
  ok('Helpers pushed to Apps Script');

  // Run _setFormId
  try {
    const r = await script.scripts.run({ scriptId: SCRIPT_ID, requestBody: { function: '_setFormId', devMode: false } });
    if (r.data.error) throw new Error(JSON.stringify(r.data.error));
    ok('FORM_ID set in Script Properties');
  } catch(e) { warn('setFormId blocked: ' + e.message); }

  // Run _linkFormToSheet
  try {
    const r2 = await script.scripts.run({ scriptId: SCRIPT_ID, requestBody: { function: '_linkFormToSheet', devMode: false } });
    if (r2.data.error) throw new Error(JSON.stringify(r2.data.error));
    ok('Form responses linked to spreadsheet');
  } catch(e) { warn('linkFormToSheet blocked: ' + e.message); }
}

main().catch(e => { console.error('\x1b[31mERROR:\x1b[0m', e.message); process.exit(1); });
