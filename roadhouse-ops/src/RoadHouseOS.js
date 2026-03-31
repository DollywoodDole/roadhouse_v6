// ============================================================
// RoadHouseOS.js — Core Automation Engine
// Deploy via: clasp push
// Triggers set in Apps Script editor → Triggers menu
// ============================================================

// ── TRIGGER 1: Sync Members → Form dropdown ──────────────────
// Trigger: Time-driven → Daily → 3:00 AM
function syncMembersToForm() {
  const FORM_ID = PropertiesService.getScriptProperties().getProperty('FORM_ID');
  if (!FORM_ID) { Logger.log('FORM_ID not set in Script Properties'); return; }

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET.MEMBERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) { Logger.log('No members found'); return; }

  const memberIDs = sheet
    .getRange(2, COL.M_ID, lastRow - 1, 1)
    .getValues()
    .flat()
    .filter(id => id && String(id).startsWith('RH-'));

  const form  = FormApp.openById(FORM_ID);
  const items = form.getItems(FormApp.ItemType.LIST);

  for (const item of items) {
    if (item.getTitle() === 'Member ID') {
      item.asListItem().setChoiceValues(memberIDs);
      Logger.log(`Synced ${memberIDs.length} members to form`);
      return;
    }
  }
  const msg = '🔴 syncMembersToForm FAILED — "Member ID" field not found in form. Check form field title.';
  Logger.log(msg);
  const webhookUrl = getDiscordWebhook();
  if (webhookUrl) postToDiscord_(webhookUrl, msg);
}

// ── TRIGGER 2: Weekly Leaderboard (Email + Discord) ──────────
// Trigger: Time-driven → Every Monday → 7:00 AM
function weeklyLeaderboard() {
  const ss         = SpreadsheetApp.getActiveSpreadsheet();
  const processed  = ss.getSheetByName(SHEET.PROCESSED);
  const members    = ss.getSheetByName(SHEET.MEMBERS);
  const week       = getCurrentWeek() - 1; // prior week
  const year       = getCurrentYear();

  // Pull all processed rows for prior week
  const pData = processed.getDataRange().getValues().slice(1);
  const weekRows = pData.filter(r =>
    r[COL.P_WEEK - 1] === week &&
    r[COL.P_VALID - 1] === true &&
    r[COL.P_SCORE_FINAL - 1] > 0
  );

  if (weekRows.length === 0) {
    Logger.log(`No valid submissions found for week ${week}`);
    return;
  }

  // Aggregate by member
  const aggMap = {};
  weekRows.forEach(r => {
    const mid   = r[COL.P_MEMBER_ID - 1];
    const score = parseFloat(r[COL.P_SCORE_FINAL - 1]) || 0;
    if (!aggMap[mid]) aggMap[mid] = { score: 0, count: 0, handle: r[COL.P_HANDLE - 1] };
    aggMap[mid].score += score;
    aggMap[mid].count += 1;
  });

  // Sort by score desc
  const ranked = Object.entries(aggMap)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 10);

  // Build Discord message
  const medals = ['🥇', '🥈', '🥉'];
  let discordMsg = `**⚔️ ROADHOUSE // WEEK ${week} · ${year}**\n\`\`\`\n`;
  discordMsg += 'RANK  HANDLE              SCORE   OUTPUTS\n';
  discordMsg += '─'.repeat(44) + '\n';
  ranked.forEach(([mid, data], i) => {
    const medal  = medals[i] || ` #${i + 1} `;
    const handle = (data.handle || mid).padEnd(18);
    const score  = data.score.toFixed(1).padStart(7);
    const count  = String(data.count).padStart(8);
    discordMsg += `${medal}  ${handle}${score}${count}\n`;
  });
  discordMsg += '```\n';
  discordMsg += `📋 Submit → *pinned in #daily-log*\n`;
  discordMsg += `📊 Dashboard → *pinned in #leaderboard*`;

  // Post to Discord
  const webhookUrl = getDiscordWebhook();
  if (webhookUrl) {
    postToDiscord_(webhookUrl, discordMsg);
    Logger.log('Discord leaderboard posted');
  }

  // Email all active members
  const mData = members.getDataRange().getValues().slice(1);
  const emails = mData
    .filter(r => r[COL.M_ACTIVE - 1] === true && r[COL.M_EMAIL - 1])
    .map(r => r[COL.M_EMAIL - 1]);

  const htmlEmail = buildLeaderboardHtml_(ranked, week, year);
  if (emails.length > 0) {
    const adminEmail = getAdminEmail();
    for (let i = 0; i < emails.length; i += 99) {
      const chunk = emails.slice(i, i + 99);
      try {
        MailApp.sendEmail({
          to:      adminEmail,
          bcc:     chunk.join(','),
          subject: `⚔️ RoadHouse Week ${week} Results`,
          htmlBody: htmlEmail,
        });
      } catch (e) {
        Logger.log(`Email batch failed (offset ${i}): ${e.message}`);
      }
    }
  }
  Logger.log(`Leaderboard sent to ${emails.length} members`);
}

// ── TRIGGER 3: Inactive Member Alert ─────────────────────────
// Trigger: Time-driven → Daily → 9:00 AM
function inactiveAlert() {
  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const members = ss.getSheetByName(SHEET.MEMBERS);
  const data    = members.getDataRange().getValues().slice(1);
  const today   = new Date();
  const threshold = getInactiveThreshold() || 7;

  const inactive = [];
  const dormant  = [];

  data.forEach(row => {
    const lastSub = row[COL.M_LAST_SUB - 1];
    const active  = row[COL.M_ACTIVE - 1];
    const handle  = row[COL.M_HANDLE - 1];
    const mid     = row[COL.M_ID - 1];
    const email   = row[COL.M_EMAIL - 1];
    if (!mid) return;

    if (!active && lastSub && lastSub !== 'Never') {
      const days = Math.floor((today - new Date(lastSub)) / 86400000);
      if (days >= threshold * 2) {
        inactive.push({ mid, handle, days, email });
      } else if (days >= threshold) {
        dormant.push({ mid, handle, days, email });
      }
    } else if (!active && (!lastSub || lastSub === 'Never')) {
      inactive.push({ mid, handle, days: 999, email });
    }
  });

  if (inactive.length + dormant.length === 0) return;

  let body = 'ROADHOUSE OS — INACTIVE MEMBER REPORT\n';
  body += `Generated: ${today.toISOString()}\n\n`;

  if (inactive.length > 0) {
    body += `INACTIVE (${inactive.length}) — Silent ${threshold * 2}+ days:\n`;
    inactive.forEach(m => body += `  ${m.mid} | @${m.handle} | ${m.days}d silent\n`);
    body += '\n';
  }
  if (dormant.length > 0) {
    body += `DORMANT (${dormant.length}) — Silent ${threshold}+ days:\n`;
    dormant.forEach(m => body += `  ${m.mid} | @${m.handle} | ${m.days}d silent\n`);
  }

  MailApp.sendEmail({
    to:      getAdminEmail(),
    subject: `RH Alert: ${inactive.length + dormant.length} inactive members`,
    body:    body,
  });

  // Discord alert
  const webhookUrl = getDiscordWebhook();
  if (webhookUrl && inactive.length > 0) {
    const msg = `🔴 **${inactive.length} member(s) gone dark** (${threshold * 2}+ days). Check admin email.`;
    postToDiscord_(webhookUrl, msg);
  }
  Logger.log(`Inactive alert sent: ${inactive.length} inactive, ${dormant.length} dormant`);
}

// ── TRIGGER 4: Daily Submission Cap Enforcement ───────────────
// Trigger: Time-driven → Daily → 11:55 PM
function enforceSubmissionCap() {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const processed = ss.getSheetByName(SHEET.PROCESSED);
  const raw       = ss.getSheetByName(SHEET.RAW);
  const maxDaily  = getMaxDailySubmissions() || 3;

  const rawData = raw.getDataRange().getValues().slice(1);
  const countMap = {};

  const invalidRows = [];
  rawData.forEach((row, i) => {
    const mid  = row[2]; // col C = Member_ID
    const ts   = row[0]; // col A = Timestamp
    if (!mid || !ts) return;
    const date = new Date(ts).toDateString();
    const key  = `${mid}_${date}`;
    if (!countMap[key]) countMap[key] = 0;
    countMap[key]++;
    if (countMap[key] > maxDaily) {
      invalidRows.push(i + 2);
      Logger.log(`Capped: ${mid} row ${i + 2} (submission ${countMap[key]} on ${date})`);
    }
  });
  if (invalidRows.length > 0) {
    const rangeList = processed.getRangeList(invalidRows.map(r => `K${r}`));
    rangeList.setValue(false);
    SpreadsheetApp.flush();
  }
}

// ── TRIGGER 5: Weekly Score → $ROAD Accrual (V2) ─────────────
// Trigger: Time-driven → Every Monday → 6:00 AM
// V1: Exports CSV for manual distribution
// V2: Calls webhook → backend → Solana SPL transfer
function exportWeeklyRoadAccrual() {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const scoreboard = ss.getSheetByName(SHEET.SCOREBOARD);
  const members   = ss.getSheetByName(SHEET.MEMBERS);
  const week      = getCurrentWeek() - 1;
  const rate      = getRoadConversionRate() || 10; // 10 $ROAD per score point (default)

  const mData = members.getDataRange().getValues().slice(1);
  const walletMap = {};
  mData.forEach(r => {
    if (r[COL.M_ID - 1] && r[COL.M_WALLET - 1]) {
      walletMap[r[COL.M_ID - 1]] = r[COL.M_WALLET - 1];
    }
  });

  const sData = scoreboard.getDataRange().getValues().slice(1);
  const accruals = sData
    .filter(r => r[6] === week && r[4] > 0)
    .map(r => {
      const mid    = r[1];
      const score  = parseFloat(r[4]) || 0;
      const road   = Math.floor(score * rate);
      const wallet = walletMap[mid] || 'NO_WALLET';
      return { mid, wallet, score, road };
    })
    .filter(a => a.road > 0);

  if (accruals.length === 0) {
    Logger.log('No accruals to process this week');
    return;
  }

  // V1: Log to admin as CSV body
  let csv = 'member_id,wallet_address,week_score,road_accrual\n';
  accruals.forEach(a => {
    csv += `${a.mid},${a.wallet},${a.score},${a.road}\n`;
  });

  const totalRoad = accruals.reduce((sum, a) => sum + a.road, 0);
  MailApp.sendEmail({
    to:      getAdminEmail(),
    subject: `RH Week ${week} — $ROAD Accrual: ${totalRoad} $ROAD to distribute`,
    body:    `Week ${week} $ROAD distribution\n\nTotal: ${totalRoad} $ROAD\nRecipients: ${accruals.length}\n\n${csv}\n\nACTION: Run distribute-road-tokens.js with this data, or approve via multisig.`,
  });

  Logger.log(`$ROAD accrual export: ${totalRoad} $ROAD across ${accruals.length} members`);

  // V2: POST to distribution webhook (uncomment when backend ready)
  // const backendUrl = PropertiesService.getScriptProperties().getProperty('DISTRIBUTION_WEBHOOK');
  // if (backendUrl) {
  //   UrlFetchApp.fetch(backendUrl, {
  //     method: 'post',
  //     contentType: 'application/json',
  //     payload: JSON.stringify({ week, accruals }),
  //     headers: { 'Authorization': 'Bearer ' + PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET') }
  //   });
  // }
}

// ── HELPERS ───────────────────────────────────────────────────
function postToDiscord_(webhookUrl, content) {
  try {
    UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ content }),
      muteHttpExceptions: true,
    });
  } catch (e) {
    Logger.log(`Discord post failed: ${e.message}`);
  }
}

function buildLeaderboardHtml_(ranked, week, year) {
  const medals = ['🥇', '🥈', '🥉'];
  const rows = ranked.map(([mid, data], i) => `
    <tr style="border-bottom:1px solid #1a1a1a">
      <td style="padding:8px 12px;color:#888">${medals[i] || '#' + (i+1)}</td>
      <td style="padding:8px 12px;color:#fff;font-weight:600">@${data.handle || mid}</td>
      <td style="padding:8px 12px;color:#FFD700;text-align:right">${data.score.toFixed(1)}</td>
      <td style="padding:8px 12px;color:#888;text-align:right">${data.count} outputs</td>
    </tr>`).join('');

  return `
  <div style="background:#0a0a0a;color:#e0e0e0;padding:24px;font-family:monospace;max-width:520px">
    <h2 style="color:#FFD700;margin:0 0 4px;font-size:16px;letter-spacing:.1em">
      ⚔️ ROADHOUSE // WEEK ${week} · ${year}
    </h2>
    <p style="color:#555;font-size:11px;margin:0 0 20px">Weekly output rankings</p>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="border-bottom:1px solid #222">
          <th style="padding:6px 12px;color:#444;font-size:10px;text-align:left;letter-spacing:.08em">RANK</th>
          <th style="padding:6px 12px;color:#444;font-size:10px;text-align:left;letter-spacing:.08em">HANDLE</th>
          <th style="padding:6px 12px;color:#444;font-size:10px;text-align:right;letter-spacing:.08em">SCORE</th>
          <th style="padding:6px 12px;color:#444;font-size:10px;text-align:right;letter-spacing:.08em">OUTPUTS</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#333;font-size:10px;margin:20px 0 0">
      Submit → <a href="${PropertiesService.getScriptProperties().getProperty('FORM_URL') || '#'}" style="color:#FFD700">daily log</a>
      &nbsp;|&nbsp;
      Dashboard → <a href="https://docs.google.com/spreadsheets/d/${SpreadsheetApp.getActiveSpreadsheet().getId()}/edit" style="color:#FFD700">leaderboard</a>
    </p>
  </div>`;
}
