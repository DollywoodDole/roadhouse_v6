'use strict';
const fs   = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { getAuthClient } = require('./gauth.js');

const ROOT        = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'bootstrap.config.json');

async function findOrCreateFolder(drive, name) {
  const res = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`,
    fields: 'files(id,name)', spaces: 'drive',
  });
  if (res.data.files && res.data.files.length > 0) {
    console.log('  ✓ Folder exists: ' + name + ' (' + res.data.files[0].id + ')');
    return res.data.files[0].id;
  }
  const cr = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder' },
    fields: 'id',
  });
  console.log('  ✓ Folder created: ' + cr.data.id);
  return cr.data.id;
}

async function main() {
  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const { spreadsheetId, driveFolderName } = cfg.google;
  if (!spreadsheetId) { console.error('ERROR: spreadsheetId not set. Run create-sheet.js first'); process.exit(1); }
  const name = driveFolderName || 'RoadHouse Capital';
  console.log('\n⚔️  Moving sheet to Drive folder: ' + name + '\n');
  const auth  = await getAuthClient();
  const drive = google.drive({ version:'v3', auth });
  const fileRes = await drive.files.get({ fileId: spreadsheetId, fields: 'id,name,parents' });
  const parents = (fileRes.data.parents || []).join(',');
  const folderId = await findOrCreateFolder(drive, name);
  if (!parents.includes(folderId)) {
    await drive.files.update({ fileId: spreadsheetId, addParents: folderId, removeParents: parents, fields: 'id,parents' });
    console.log('  ✓ Moved to "' + name + '"');
  } else {
    console.log('  ✓ Already in "' + name + '"');
  }
  cfg.google.driveFolderId = folderId;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
  console.log('\nFolder: https://drive.google.com/drive/folders/' + folderId);
  console.log('Sheet:  https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/edit\n');
}

if (require.main === module) { main().catch(e => { console.error(e.message); process.exit(1); }); }
module.exports = { main };
