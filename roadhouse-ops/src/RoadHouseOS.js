// ============================================================
// RoadHouseOS.js — Core Automation Engine
// Deploy via: clasp push
// Triggers set in Apps Script editor → Triggers menu
// ============================================================

// ── Members sheet column indices (0-based) ────────────────────
// Matches the actual column layout from Config.js COL constants.
// Cols Q + R are new — add headers before running backfill.
//   Q: "Stripe Customer ID"   R: "Subscription Tier"
const COLS = {
  INTERNAL_ID:      0,  // A — RH-XXXX (COL.M_ID)
  HANDLE:           1,  // B
  NAME:             2,  // C
  EMAIL:            3,  // D
  OPS_TIER:         7,  // H — M_TIER formula (Observer/Contributor/Producer/Operator — NOT used for $ROAD rate)
  TOTAL_SCORE:      8,  // I — M_TOTAL_SCORE
  WALLET:           13, // N — Solana pubkey (COL.M_WALLET)
  WALLET_VERIFIED:  14, // O — checkbox (COL.M_WALLET_VERIFIED)
  NOTES:            15, // P — COL.M_NOTES
  STRIPE_CUS:       16, // Q — Stripe Customer ID (cus_xxx)
  SUB_TIER:         17, // R — Subscription tier (regular/ranch-hand/partner) — written by backfill
};

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
  // ── Write leaderboard to KV → Guild tab in dashboard reads this ──
  const baseUrl    = getPlatformBaseUrl() || 'https://roadhouse.capital';
  const cronSecret = getCronSecret();
  const isoWeek    = getISOWeek(new Date());

  if (baseUrl && cronSecret) {
    const top10 = ranked.map(([mid, data], i) => ({
      rank:        i + 1,
      memberId:    mid,
      handle:      data.handle || mid,
      score:       data.score,
      tier:        '',   // not tracked in Outputs_PROCESSED
      weeklyDelta: 0,    // week-over-week delta not tracked yet
    }));

    try {
      const res = UrlFetchApp.fetch(baseUrl + '/api/leaderboard/update', {
        method:           'post',
        contentType:      'application/json',
        headers:          { Authorization: 'Bearer ' + cronSecret },
        payload:          JSON.stringify({ week: isoWeek, top10 }),
        muteHttpExceptions: true,
      });
      Logger.log('Leaderboard KV write: code=' + res.getResponseCode());
    } catch (e) {
      Logger.log('Leaderboard KV write failed (non-fatal): ' + e.toString());
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

// ── TRIGGER 5a: Monthly Stripe Backfill ──────────────────────
// Trigger: Time-driven → 1st of month → 6:00 AM
// Runs 1 hour before exportWeeklyRoadAccrual() so col Q + R are fresh.
// Safe to run every month — skips rows where col Q already has cus_ value.
function monthlyStripeBackfill() {
  Logger.log('monthlyStripeBackfill: start');
  backfillStripeCustomerIds();
  Logger.log('monthlyStripeBackfill: complete');
}

// ── TRIGGER 5b: Monthly $ROAD Accrual → KV (V3) ──────────────
// Trigger: Time-driven → 1st of month → 7:00 AM
// V1: Exports CSV email for manual distribution (fallback)
// V2: POSTs to /api/road/accrue → updates KV directly
// V3: Reads col R (COLS.SUB_TIER) for subscription tier — orthogonal from ops tier (col H)
//
// Requires backfillStripeCustomerIds() to have run once — populates col Q + col R.
// Ops tier (col H) drives leaderboard scoring. Subscription tier (col R) drives $ROAD rate.
// NOTE: the platform /api/road/accrue cron also runs monthly from GitHub Actions.
// Only one should run — disable the GitHub Actions cron once this is verified working.
function exportWeeklyRoadAccrual() {
  const config = getConfig();
  const today  = new Date().toISOString().slice(0, 7); // "2026-03"

  // Idempotency guard — skip if already ran this month
  if (config.lastAccrualExport === today) {
    Logger.log('exportWeeklyRoadAccrual: already ran for ' + today + ', skipping');
    return;
  }

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET.MEMBERS);
  const rows  = sheet.getDataRange().getValues().slice(1);

  // Subscription tier → monthly $ROAD accrual rate
  const rateMap = { regular: 100, 'ranch-hand': 500, partner: 2000 };

  const accruals  = [];
  const noStripe  = [];
  const noSubTier = [];

  for (const row of rows) {
    const internalId = String(row[COLS.INTERNAL_ID] || '').trim();
    const customerId = String(row[COLS.STRIPE_CUS]  || '').trim();
    const subTier    = String(row[COLS.SUB_TIER]    || '').trim().toLowerCase();

    if (!customerId.startsWith('cus_')) {
      if (internalId) noStripe.push(internalId);
      continue;
    }

    const amount = rateMap[subTier];

    if (!amount) {
      // Empty = lapsed/cancelled (correct, skip silently).
      // Named ops tier = backfill didn't run yet or ran before rows 17-19 were added.
      if (subTier && !['regular', 'ranch-hand', 'partner'].includes(subTier)) {
        noSubTier.push({ internalId, subTier });
      }
      continue;
    }

    accruals.push({ customerId, amount, tier: subTier });
  }

  // Surface actionable warnings
  if (noStripe.length > 0) {
    Logger.log(
      `WARNING: ${noStripe.length} row(s) missing Stripe Customer ID — ` +
      `run backfillStripeCustomerIds():\n  ` + noStripe.join(', ')
    );
  }
  if (noSubTier.length > 0) {
    Logger.log(
      `WARNING: ${noSubTier.length} row(s) have unrecognised subscription tier — ` +
      `col R may contain ops tiers instead of sub tiers.\n` +
      `Run backfillStripeCustomerIds() to overwrite:\n  ` +
      noSubTier.map((m) => `${m.internalId} (tier="${m.subTier}")`).join('\n  ')
    );
  }

  if (accruals.length === 0) {
    Logger.log(
      'exportWeeklyRoadAccrual: no accruals to process.\n' +
      'If Members sheet col Q and R are empty, run backfillStripeCustomerIds() first.'
    );
    setConfig({ lastAccrualExport: today });
    return;
  }

  const week = getISOWeek(new Date());

  // V3: POST to platform API
  const baseUrl    = config.PLATFORM_BASE_URL;
  const cronSecret = config.CRON_SECRET;

  if (!baseUrl || !cronSecret) {
    Logger.log('PLATFORM_BASE_URL or CRON_SECRET missing — falling back to CSV');
    exportAccrualAsCSV_(accruals, week);
    setConfig({ lastAccrualExport: today });
    return;
  }

  try {
    const response = UrlFetchApp.fetch(baseUrl + '/api/road/accrue', {
      method:             'post',
      contentType:        'application/json',
      headers:            { Authorization: 'Bearer ' + cronSecret },
      payload:            JSON.stringify({ week, accruals }),
      muteHttpExceptions: true,
    });

    const code = response.getResponseCode();
    const body = JSON.parse(response.getContentText());

    Logger.log(
      '[V3 accrual] code=' + code +
      ' processed=' + (body.processed ?? '?') +
      ' capped=' + (body.capped ?? 0) +
      ' errors=' + (body.errors?.length ?? 0)
    );

    if (code !== 200) {
      Logger.log('Non-200 response — falling back to CSV. Body: ' + JSON.stringify(body));
      exportAccrualAsCSV_(accruals, week);
    }

  } catch (e) {
    Logger.log('V3 webhook threw — falling back to CSV: ' + e.toString());
    exportAccrualAsCSV_(accruals, week);
  }

  setConfig({ lastAccrualExport: today });
}

/**
 * Maps a Stripe price ID to a canonical subscription tier string.
 * Reads STRIPE_PRICE_REGULAR / _RANCH_HAND / _PARTNER from Config sheet
 * rows 17-19 so tier resolution doesn't require a code redeploy if price IDs rotate.
 * Returns null if the price ID isn't in the config map.
 */
function getSubTierFromPriceId_(priceId, config) {
  if (!priceId) return null;
  const map = {
    [config.STRIPE_PRICE_REGULAR]:    'regular',
    [config.STRIPE_PRICE_RANCH_HAND]: 'ranch-hand',
    [config.STRIPE_PRICE_PARTNER]:    'partner',
  };
  return map[priceId] ?? null;
}

/**
 * ONE-TIME backfill: searches Stripe by email and writes both:
 *   col Q (COLS.STRIPE_CUS) — cus_xxx customer ID
 *   col R (COLS.SUB_TIER)   — canonical subscription tier (regular/ranch-hand/partner)
 * Both values are resolved in a single Stripe API call by expanding subscriptions.
 *
 * Run from Apps Script editor after adding col Q + col R headers to Members sheet.
 * Requires Config sheet rows 16-19 populated (STRIPE_SECRET_KEY + 3 price IDs).
 * Clear row 16 (STRIPE_SECRET_KEY) after backfill is complete.
 * Safe to re-run: skips rows where col Q already has a cus_ value.
 */
function backfillStripeCustomerIds() {
  const config    = getConfig();
  const stripeKey = config.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    Logger.log('ERROR: STRIPE_SECRET_KEY not in Config sheet. Add it to row 16, run, then clear it.');
    return;
  }

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET.MEMBERS);
  const data  = sheet.getDataRange().getValues();

  let updated = 0, skipped = 0, notFound = 0, noActiveSub = 0;

  for (let i = 1; i < data.length; i++) {
    const row         = data[i];
    const email       = String(row[COLS.EMAIL]      || '').trim();
    const existingCus = String(row[COLS.STRIPE_CUS] || '').trim();

    // Already backfilled — skip
    if (existingCus.startsWith('cus_')) {
      skipped++;
      continue;
    }

    if (!email || !email.includes('@')) {
      Logger.log(`Row ${i + 1}: no valid email — skipping`);
      continue;
    }

    try {
      // Single call: find customer by email + expand subscriptions in one round-trip
      const searchRes = UrlFetchApp.fetch(
        `https://api.stripe.com/v1/customers/search?query=email:'${encodeURIComponent(email)}'&limit=1&expand[]=data.subscriptions`,
        {
          method:             'get',
          headers:            { Authorization: 'Bearer ' + stripeKey },
          muteHttpExceptions: true,
        }
      );

      const searchBody = JSON.parse(searchRes.getContentText());

      if (searchRes.getResponseCode() !== 200) {
        Logger.log(`Row ${i + 1} (${email}): Stripe API error — ${searchBody.error?.message}`);
        continue;
      }

      if (!searchBody.data || searchBody.data.length === 0) {
        Logger.log(`Row ${i + 1} (${email}): no Stripe customer`);
        notFound++;
        continue;
      }

      const customer   = searchBody.data[0];
      const customerId = customer.id; // cus_xxx

      // Derive subscription tier from first active/trialing subscription
      const activeSubs = (customer.subscriptions?.data || [])
        .filter((s) => s.status === 'active' || s.status === 'trialing');

      let subTier = null;

      if (activeSubs.length > 0) {
        const priceId = activeSubs[0]?.items?.data?.[0]?.price?.id;
        subTier = getSubTierFromPriceId_(priceId, config);

        if (!subTier) {
          Logger.log(
            `Row ${i + 1} (${email}): active sub found but price ${priceId} ` +
            `not in STRIPE_PRICE_* config rows 17-19. Defaulting to 'regular'.`
          );
          subTier = 'regular'; // under-credits rather than over-credits
        }
      } else {
        Logger.log(`Row ${i + 1} (${email}): ${customerId} has no active subscription`);
        noActiveSub++;
        subTier = ''; // empty = excluded from accrual; cus_xxx still written for future resubscribe
      }

      // Write col Q (cus_xxx) and col R (sub tier)
      sheet.getRange(i + 1, COLS.STRIPE_CUS + 1).setValue(customerId);
      sheet.getRange(i + 1, COLS.SUB_TIER   + 1).setValue(subTier);

      data[i][COLS.STRIPE_CUS] = customerId;
      data[i][COLS.SUB_TIER]   = subTier;

      updated++;
      Logger.log(`Row ${i + 1} (${email}): ${customerId} | tier=${subTier || 'none (lapsed)'}`);

      // Rate-limit buffer — Stripe search ~100 req/s
      if (updated % 20 === 0) Utilities.sleep(400);

    } catch (e) {
      Logger.log(`Row ${i + 1} (${email}): exception — ${e.toString()}`);
    }
  }

  Logger.log(
    `\nbackfillStripeCustomerIds complete:\n` +
    `  updated=${updated}  skipped=${skipped}  ` +
    `notFound=${notFound}  noActiveSub=${noActiveSub}`
  );
}

// Private: CSV email fallback for exportWeeklyRoadAccrual
function exportAccrualAsCSV_(accruals, week) {
  const totalRoad = accruals.reduce((sum, a) => sum + a.amount, 0);
  let csv = 'customer_id,tier,road_accrual\n';
  accruals.forEach(a => {
    csv += `${a.customerId},${a.tier},${a.amount}\n`;
  });
  MailApp.sendEmail({
    to:      getAdminEmail(),
    subject: `RH ${week} — $ROAD Accrual: ${totalRoad} $ROAD to distribute`,
    body:    `${week} $ROAD distribution\n\nTotal: ${totalRoad} $ROAD\nRecipients: ${accruals.length}\n\n${csv}\n\nACTION: Run distribute-road-tokens.js with this data, or approve via multisig.`,
  });
  Logger.log(`$ROAD accrual CSV sent: ${totalRoad} $ROAD across ${accruals.length} members`);
}

// ── HELPERS ───────────────────────────────────────────────────

/**
 * Returns ISO week string — e.g. "2026-W13"
 * Used by weeklyLeaderboard() for the KV leaderboard key.
 */
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return d.getUTCFullYear() + '-W' + String(weekNo).padStart(2, '0');
}

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
