'use strict';
require('dotenv').config();
const { google } = require('googleapis');
const { getAuthClient } = require('./gauth.js');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const CONFIG_PATH = path.join(__dirname, '..', 'bootstrap.config.json');
const G='\x1b[32m',Y='\x1b[33m',R='\x1b[31m',W='\x1b[1m',X='\x1b[0m';
const ok   = s => console.log(G+'✓'+X+' '+s);
const warn = s => console.log(Y+'⚠'+X+' '+s);
const step = (n,s) => console.log('\n\x1b[34m['+n+']\x1b[0m '+W+s+X);

async function main() {
  console.log('\n'+W+'⚔️  ROADHOUSE OS — CREATE FORM'+X+'\n');
  const auth  = await getAuthClient();
  const forms = google.forms({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });
  const sheets = google.sheets({ version: 'v4', auth });

  // ── 1. Create the form shell ──────────────────────────────
  step('1', 'Creating form');
  const createRes = await forms.forms.create({
    requestBody: {
      info: {
        title: '⚔️ RoadHouse — Daily Output Log',
        documentTitle: 'RoadHouse OS — Output Submission',
      },
    },
  });
  const formId  = createRes.data.formId;
  const formUrl = createRes.data.responderUri;
  ok('Form created: ' + formId);

  // ── 2. Build all questions via batchUpdate ────────────────
  step('2', 'Adding questions');

  const OUTPUT_TYPES = [
    'Content Published',
    'Code Shipped',
    'Deal Closed',
    'Research Published',
    'Strategic Output',
    'Community Build',
    'Training Log',
    'Daily Check-In',
  ];

  const requests = [
    // Update form settings — collect email, confirmation message
    {
      updateSettings: {
        settings: {
          quizSettings: { isQuiz: false },
        },
        updateMask: 'quizSettings',
      },
    },

    // Q1 — Member ID (list — populated daily by syncMembersToForm)
    {
      createItem: {
        item: {
          title: 'Member ID',
          description: 'Your RH-### identifier. List is synced daily.',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'DROP_DOWN',
                options: [{ value: 'RH-001 — dole' }],
                shuffle: false,
              },
            },
          },
        },
        location: { index: 0 },
      },
    },

    // Q2 — Output Type
    {
      createItem: {
        item: {
          title: 'Output Type',
          description: 'Select the category that best fits your output. Multipliers: Deal Closed 2.5× · Content/Code 2.0× · Research 1.8× · Strategic 1.7× · Community 1.5× · Training 1.2× · Check-In 1.0×',
          questionItem: {
            question: {
              required: true,
              choiceQuestion: {
                type: 'DROP_DOWN',
                options: OUTPUT_TYPES.map(v => ({ value: v })),
                shuffle: false,
              },
            },
          },
        },
        location: { index: 1 },
      },
    },

    // Q3 — Output Title
    {
      createItem: {
        item: {
          title: 'Output Title',
          description: 'Name of the piece, deal, commit, or session. Be specific.',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 2 },
      },
    },

    // Q4 — Output Description
    {
      createItem: {
        item: {
          title: 'Output Description',
          description: 'What did you produce? What was the result? 1–3 sentences.',
          questionItem: {
            question: {
              required: true,
              textQuestion: { paragraph: true },
            },
          },
        },
        location: { index: 3 },
      },
    },

    // Q5 — Output URL
    {
      createItem: {
        item: {
          title: 'Output URL',
          description: 'Link to the output (post, commit, doc, recording). Leave blank if not applicable.',
          questionItem: {
            question: {
              required: false,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 4 },
      },
    },

    // Q6 — Self Score
    {
      createItem: {
        item: {
          title: 'Self Score',
          description: '1 = baseline effort · 3 = solid output · 5 = exceptional, verifiable result. Scores ≥4 without a URL are flagged for review.',
          questionItem: {
            question: {
              required: true,
              scaleQuestion: {
                low: 1,
                high: 5,
                lowLabel: 'Baseline',
                highLabel: 'Exceptional',
              },
            },
          },
        },
        location: { index: 5 },
      },
    },

    // Q7 — Week Number
    {
      createItem: {
        item: {
          title: 'Week Number',
          description: 'ISO week number (e.g. 14). Find yours at whatweekisit.org or leave blank — it auto-calculates from your submission date.',
          questionItem: {
            question: {
              required: false,
              textQuestion: { paragraph: false },
            },
          },
        },
        location: { index: 6 },
      },
    },

    // Q8 — Notes
    {
      createItem: {
        item: {
          title: 'Notes (Optional)',
          description: 'Anything the steward should know when reviewing this submission.',
          questionItem: {
            question: {
              required: false,
              textQuestion: { paragraph: true },
            },
          },
        },
        location: { index: 7 },
      },
    },
  ];

  await forms.forms.batchUpdate({
    formId,
    requestBody: { requests },
  });
  ok('All questions added');

  // ── 3. Link responses → Outputs_RAW sheet ────────────────
  step('3', 'Linking responses to Outputs_RAW');
  // Use Drive API to set the response destination to our spreadsheet
  try {
    // Create a watch/link via Apps Script helper pushed earlier
    // Fallback: use Sheets API to import via IMPORTRANGE — not ideal
    // Best path: push a linker function and run it
    const script = google.script({ version: 'v1', auth });
    const SCRIPT_ID = '1DQauYe9yB-Z539gEITvBXV8sFVfOqxAZ2q1hz_CiizQTZqbjZtwpZY1T';

    // Get current files
    const contentRes = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = (contentRes.data.files || []).filter(f => f.name !== '_form_linker');
    files.push({
      name: '_form_linker',
      type: 'SERVER_JS',
      source: `
function _linkFormToSheet() {
  const FORM_ID = PropertiesService.getScriptProperties().getProperty('FORM_ID');
  const SS_ID   = '${SPREADSHEET_ID}';
  if (!FORM_ID) { Logger.log('FORM_ID not set'); return; }
  const form = FormApp.openById(FORM_ID);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, SS_ID);
  Logger.log('Form linked to spreadsheet: ' + SS_ID);
  return 'linked';
}`,
    });
    await script.projects.updateContent({ scriptId: SCRIPT_ID, requestBody: { files } });
    ok('Link helper pushed to Apps Script');
    warn('Run _linkFormToSheet() manually in Apps Script editor after setting FORM_ID');
  } catch(e) {
    warn('Could not push link helper: ' + e.message);
  }

  // ── 4. Move form to RoadHouse Capital Drive folder ────────
  step('4', 'Moving form to Drive folder');
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const folderId = cfg.google.driveFolderId;
    if (folderId) {
      const fileRes = await drive.files.get({ fileId: formId, fields: 'id,parents' });
      const parents = (fileRes.data.parents || []).join(',');
      await drive.files.update({ fileId: formId, addParents: folderId, removeParents: parents, fields: 'id' });
      ok('Form moved to "RoadHouse Capital" folder');
    }
  } catch(e) { warn('Drive move: ' + e.message); }

  // ── 5. Write FORM_ID to .env and config ──────────────────
  step('5', 'Saving FORM_ID');
  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  cfg.google.formId = formId;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
  ok('bootstrap.config.json updated');

  // Update .env
  let env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  env = env.replace(/^FORM_ID=.*$/m, 'FORM_ID=' + formId);
  fs.writeFileSync(path.join(__dirname, '..', '.env'), env);
  ok('.env updated');

  // Update Config sheet B12 (FORM_ID row if present) and Script Properties row
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Config!B12',
      valueInputOption: 'RAW',
      requestBody: { values: [[formId]] },
    });
    ok('FORM_ID → Config!B12');
  } catch(e) { warn('Config sheet update: ' + e.message); }

  // ── 6. Print summary ──────────────────────────────────────
  console.log('');
  console.log(W+'⚔️  FORM CREATED'+X);
  console.log('─'.repeat(54));
  console.log('Form ID:   ' + formId);
  console.log('Edit URL:  https://docs.google.com/forms/d/' + formId + '/edit');
  console.log('Share URL: ' + formUrl);
  console.log('─'.repeat(54));
  console.log(W+'NEXT STEPS:'+X);
  console.log('  1. Open Apps Script editor:');
  console.log('     https://script.google.com/d/1DQauYe9yB-Z539gEITvBXV8sFVfOqxAZ2q1hz_CiizQTZqbjZtwpZY1T/edit');
  console.log('  2. Project Settings → Script Properties → Add:');
  console.log('     FORM_ID = ' + formId);
  console.log('  3. Run _linkFormToSheet() once to link responses → Outputs_RAW');
  console.log('  4. Share form URL in Discord #daily-log');
  console.log('─'.repeat(54));
}

main().catch(e => { console.error('\x1b[31mERROR:\x1b[0m', e.message); process.exit(1); });
