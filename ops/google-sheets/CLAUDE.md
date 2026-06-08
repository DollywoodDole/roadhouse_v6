# ops/google-sheets

Standalone Google Sheets OS layer — NOT part of Next.js app.
Uses clasp + googleapis + Apps Script. Node >=18 required.

## Files

```
src/
  Config.js           ← sheet/column constants; getConfig(); secrets via Script Properties
  RoadHouseOS.js      ← core automation engine; syncMembersToForm() + output processing triggers
  WalletRegistry.js   ← Web2↔Web3 identity bridge; maps RH-001 → Solana pubkey
  MotorsInventory.js  ← motors inventory ops
  Setup.js            ← one-time setup functions; M3 migration guide (setupStewardColumns etc.)
  appsscript.json     ← Apps Script manifest

scripts/
  gauth.js                  ← OAuth2 desktop flow → token.json
  bootstrap.js              ← idempotent full setup
  create-sheet.js           ← create spreadsheet
  create-form.js            ← create linked form
  link-form.js              ← link existing form to sheet
  finalize.js               ← finalize setup
  move-to-drive.js          ← move sheet to Drive folder
  backfill-stripe-ids.js    ← backfill Stripe customer IDs
  run-backfill.js           ← run backfill
  setup-accrual-cols.js     ← add accrual columns
  trigger-accrual.js        ← trigger $ROAD accrual
  distribute-road-tokens.js ← distribute $ROAD tokens
  test-discord-webhook.js   ← test Discord webhook

  ⚠ Referenced in package.json but files do not exist:
    test-sheets-connection.js · test-wallet-registry.js · export-weekly-scores.js

scoring.json · bootstrap.config.example.json · docs/AUDIT.md

⚠ Sensitive files present (should be gitignored):
  credentials.json · token.json · bootstrap.config.json · .clasp.json
```

## npm scripts (cd ops/google-sheets first)

```bash
npm run auth           # OAuth2 desktop flow → token.json (re-run if scopes change)
npm run bootstrap      # idempotent full setup
npm run push           # clasp push → deploy Apps Script
npm run pull           # clasp pull ← sync from Apps Script
npm run open           # clasp open → open in Apps Script editor
npm run deploy         # clasp push && clasp deployments
npm run logs           # clasp logs --watch
npm run create:sheet   # create spreadsheet
npm run move:drive     # move sheet to Drive folder
npm run test:webhook   # test Discord webhook
npm run distribute     # distribute $ROAD tokens
```

## Key IDs (Praetorian account)

```
Spreadsheet:  1AyMQbzOPHiceZEqjtZTlr8xnVgYCh2v-3E5SaA9cCHY
Form:         1Gh3sBchYq7LHVYtKz1RCJxEuO7-d3hwguOLCR1QMMHE
Script:       1DQauYe9yB-Z539gEITvBXV8sFVfOqxAZ2q1hz_CiizQTZqbjZtwpZY1T
Drive folder: 1bMJUoKQ0GUL9XpgEpCi8DPAImND_dWik
```

## Sheet structure

**Sheet names:** Members · Outputs_RAW · Outputs_PROCESSED · Scoreboard · Dashboard_View · Config

**Ops tiers** (column H — NOT subscription tiers): Observer / Contributor / Producer / Operator

**Subscription tiers** (column R): regular / ranch-hand / partner

**M3 columns** (S/T/U): Is_Steward (checkbox) · Verified_Bounties (count) · Last_Verification_Date

## Secrets

Secrets (`CRON_SECRET`, `STRIPE_SECRET_KEY`) live in Apps Script **Script Properties** — never in the spreadsheet.

Set once via Apps Script editor console:
```js
setScriptSecrets('your_cron_secret', 'sk_live_...')
```

`FORM_ID` is also stored in Script Properties (not hardcoded).

## Known issues

- Apps Script execution API (`googleapis scripts.run()`) returns 403 — not enabled. Use Sheets API directly + `clasp push` instead.
- 3 scripts referenced in package.json do not exist as files: `test-sheets-connection.js`, `test-wallet-registry.js`, `export-weekly-scores.js` — running those npm commands will fail.
