# RoadHouse OS — Full Stack Audit
## Web2/Web3 Hurdles, Gap Analysis, Optimized Architecture
> Version: Post-Build Audit v1.0

---

## AUDIT SUMMARY

10 friction points identified. Ranked by severity × frequency.

| # | Hurdle | Severity | Layer | Fix Version |
|---|---|---|---|---|
| 1 | Identity fragmentation (email vs wallet) | 🔴 Critical | Auth | V2 |
| 2 | Score → $ROAD bridge missing | 🔴 Critical | Economy | V1 partial |
| 3 | Form spoofing (no auth) | 🔴 High | Trust | V1/V2 |
| 4 | Self-score gaming | 🟡 Medium | Integrity | V1 patch |
| 5 | No wallet column in Members | 🟡 Medium | Data | V1 add |
| 6 | Discord role sync gap | 🟡 Medium | UX | V2 |
| 7 | DeSci data locked in Google | 🟡 Medium | Data sovereignty | V2 |
| 8 | No immutable score record | 🟠 Low-Med | Audit | V3 |
| 9 | Apps Script quota risk at 200 members | 🟠 Low | Scale | V2 |
| 10 | Dashboard not wallet-gated | 🟢 Low | UX | V3 |

---

## HURDLE 1 — Identity Fragmentation (CRITICAL)

### The Problem
- Web2 identity: `RH-001` + email + Google account
- Web3 identity: Solana pubkey (base58, 32-44 chars)
- These are entirely separate identity systems with no bridge
- A member can earn 500 points in Google Sheets but there's nothing connecting those points to their wallet

### Current State
Members sheet has no `Wallet_Address` column. No verification flow exists.

### Fix — V1 (Manual)
Add column N (`Wallet_Pubkey`) to Members sheet.
Admin manually collects wallets via Discord DM and enters them.
`WalletRegistry.js` is already built for this.

### Fix — V2 (Self-service verification)
```
1. Member visits /verify page (Next.js)
2. Connects Phantom wallet
3. Signs message: "I am RH-001, email@example.com, signing on [date]"
4. Signature verified server-side
5. Wallet address auto-populated in Members sheet via Sheets API
```
Verification message format:
```
RoadHouse Capital — Identity Verification
Member ID: RH-001
Timestamp: 1711742400
Nonce: [random 8-char string]
```

### Fix — V3 (On-chain attestation)
- Use Solana Name Service or custom attestation program
- Wallet → RH-ID mapping lives on-chain
- Immutable, decentralized, trustless

---

## HURDLE 2 — Score → $ROAD Bridge (CRITICAL)

### The Problem
Weekly scores live in Google Sheets. $ROAD is an SPL token on Solana.
There is no automated mechanism to convert scores to tokens.

### Current State
`exportWeeklyRoadAccrual()` in Apps Script emails the admin a CSV.
Admin manually reviews and triggers a distribution.

### Fix — V1 (Manual distribution)
```
1. Apps Script runs Monday 6AM → exports accrual CSV via email
2. Admin reviews: node scripts/distribute-road-tokens.js --dry-run < accrual.csv
3. Admin approves: node scripts/distribute-road-tokens.js < accrual.csv
4. Logs written to /logs/distribution-week-[ts].json
```

### Fix — V2 (Semi-automated)
```
Apps Script → HTTPS POST to webhook endpoint (Cloud Function or Railway app)
→ Validates payload + signature
→ Calls distribute-road-tokens.js logic server-side
→ Returns tx signatures
→ Apps Script logs tx signatures in Members sheet
```

### Fix — V3 (On-chain)
- Weekly cron job (Clockwork/Squads automation)
- Reads from verifiable oracle (score data posted to Solana)
- Auto-distributes without admin approval for amounts < threshold
- Multisig required for amounts > threshold

### Conversion Rate
Default: 10 score points = 1 $ROAD
Weekly top performer (87.5 pts) → ~8.75 $ROAD
Weekly average active member (31 pts) → ~3.1 $ROAD
Adjust `pointsPerRoad` in `config/scoring.json`

---

## HURDLE 3 — Form Spoofing (HIGH)

### The Problem
Google Form has a **dropdown** for Member_ID. Anyone with the form link can
select any member's ID and submit on their behalf. There is no authentication.

### Current State
Outputs_PROCESSED col K validates that the Member_ID exists in Members sheet.
But it can't detect spoofed submissions from the correct ID.

### Fix — V1 (Partial)
- Collect email on form (already specced)
- Add formula in col K to also check that email matches the member's registered email:
```
=IF(B2="",FALSE,AND(
  IFERROR(MATCH(B2,Members!A:A,0)>0,FALSE),
  IFERROR(VLOOKUP(B2,Members!A:D,4,FALSE)=Outputs_RAW!B2,FALSE)
))
```
- Form setting: Restrict to users in org (if using Google Workspace)

### Fix — V2 (Proper)
Replace Google Form with a Next.js web app:
```
/submit → wallet.connect() → wallet.signMessage("Submit: [form data hash]")
→ API validates signature → writes to Sheets via Google Sheets API
→ Member identity is cryptographically proven
```

---

## HURDLE 4 — Self-Score Gaming (MEDIUM)

### The Problem
Members always self-score 5/5. Score inflation makes rankings meaningless.
No mechanism to challenge or verify self-reported scores.

### Fix — V1 (Soft gate)
Add to Outputs_PROCESSED col O — `Score_Override` (manually set by admin):
```
H2 formula updated:
=IF(O2<>"",ROUND(O2*J2*IF(N2=TRUE,1.1,1),1),ROUND(I2*J2*IF(N2=TRUE,1.1,1),1))
```

Add data validation: if Score_Raw >= 4 AND Output_URL is blank → flag for admin review.
Flag formula in col P:
```
=IF(AND(I2>=4,L2=""),"REVIEW","")
```

### Fix — V2 (Peer validation)
3 members can flag a submission for admin review.
A flagged submission is auto-scored at 3 until reviewed.
Peer review Discord bot: /challenge RH-001 [submission-id]

### Fix — V3 (Proof-of-output)
Require on-chain attestation for scores 4+:
- URL must resolve
- Content must exist (web scrape verification)
- For research: DOI or IPFS hash required
- For code: GitHub commit hash
- Attestation stored as Solana program data

---

## HURDLE 5 — Members Sheet Missing Wallet Column (MEDIUM)

### Fix (Immediate — V1)
Add to Members sheet:
- Col N: `Wallet_Pubkey` (text, Solana base58)
- Col O: `Wallet_Verified` (checkbox, admin-set)
- Col P: `Road_Total_Distributed` (formula: SUMIF from distribution log)

Updated tier formula to only accrue $ROAD for verified wallets.

---

## HURDLE 6 — Discord Role Sync Gap (MEDIUM)

### The Problem
When a member tier changes in the Members sheet (Observer → Contributor),
their Discord role is NOT automatically updated. Manual admin action required.

### Fix — V2 (Apps Script → Discord API)
```javascript
function syncDiscordRoles() {
  const BOT_TOKEN = PropertiesService.getScriptProperties().getProperty('DISCORD_BOT_TOKEN');
  const GUILD_ID  = PropertiesService.getScriptProperties().getProperty('DISCORD_GUILD_ID');
  
  // Role IDs from your Discord server
  const ROLE_IDS = {
    'Observer':    '111111111111111111',
    'Contributor': '222222222222222222',
    'Producer':    '333333333333333333',
    'Operator':    '444444444444444444',
  };
  
  const members = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('Members').getDataRange().getValues().slice(1);
  
  members.forEach(row => {
    const discordId = row[14]; // Col O — Discord User ID (add this column)
    const tier      = row[7];  // Col H — Tier
    if (!discordId || !tier) return;
    
    const roleId = ROLE_IDS[tier];
    if (!roleId) return;
    
    // Add role via Discord API
    const url = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`;
    UrlFetchApp.fetch(url, {
      method: 'put',
      headers: { 'Authorization': `Bot ${BOT_TOKEN}` },
      muteHttpExceptions: true,
    });
  });
}
```
Trigger: Time-driven → Daily → 2:00 AM
Add col O `Discord_User_ID` to Members sheet.

---

## HURDLE 7 — DeSci Data Locked in Google (MEDIUM)

### The Problem
Research outputs (Protocol 001/002/003) submitted via the form are stored in
Google Sheets — a centralized, non-persistent, non-decentralized store.
DeSci protocols expect IPFS/Arweave + NFT/IP-NFT registration.

### Current State
Output URL is just a text field. No pipeline to IPFS or Molecule.

### Fix — V2 (IPFS archival)
For submissions where Output_Type = "Research Published":
```javascript
// In Apps Script onFormSubmit trigger:
function onResearchSubmit(formData) {
  if (formData.outputType !== 'Research Published') return;
  
  // POST to Pinata via UrlFetchApp
  const pinataApiKey = PropertiesService.getScriptProperties().getProperty('PINATA_API_KEY');
  const metadata = {
    member_id:   formData.memberId,
    title:       formData.title,
    description: formData.description,
    url:         formData.url,
    timestamp:   new Date().toISOString(),
    protocol:    detectProtocol(formData.title), // 001/002/003
  };
  
  const res = UrlFetchApp.fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${pinataApiKey}`,
    },
    payload: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: `RH-Research-${formData.memberId}-${Date.now()}` },
    }),
  });
  
  const ipfsHash = JSON.parse(res.getContentText()).IpfsHash;
  // Write IPFS hash back to Outputs_PROCESSED col Q
  return `ipfs://${ipfsHash}`;
}
```

### Fix — V3 (IP-NFT via Molecule)
- High-value research outputs minted as IP-NFTs
- IP-NFT address stored in Members sheet
- Fractionalization via $ROAD token for community-funded research

---

## HURDLE 8 — No Immutable Score Record (LOW-MED)

### The Problem
Scores can be retroactively edited in Google Sheets.
A malicious admin (or sheet corruption) could alter historical records.

### Fix — V3
Weekly: hash the Scoreboard state → post as Solana transaction memo:
```javascript
const hash = crypto.createHash('sha256')
  .update(JSON.stringify(weeklyScores))
  .digest('hex');
// Post as memo instruction on Solana
// tx signature = immutable timestamp proof
```
This creates a verifiable weekly audit trail without storing all data on-chain.

---

## HURDLE 9 — Apps Script Quota Risk at Scale (LOW)

### The Problem
Free Google accounts: 20,000 UrlFetch calls/day, 100 email recipients/day
Google Workspace: 100,000 UrlFetch, 1,500 emails/day

At 200 members + weekly email: 200 emails → hits free quota immediately.

### Fix
- Google Workspace account (required at 50+ members anyway)
- For email: BCC all members in one send (1 email = 1 API call)
  OR: Use SendGrid/Mailgun via UrlFetchApp (external API, not MailApp quota)
- For webhooks: Batch multiple Discord calls into one message

Updated weekly emailer (batch BCC):
```javascript
// Instead of: emails.forEach(e => MailApp.sendEmail({ to: e, ... }))
// Use:
MailApp.sendEmail({
  to:      getAdminEmail(),
  bcc:     emails.join(','),  // Single call, up to 1500 addresses
  subject: `⚔️ RoadHouse Week ${week} Results`,
  htmlBody: htmlEmail,
});
```

---

## HURDLE 10 — Dashboard Not Wallet-Gated (LOW)

### The Problem
Google Sheets "share view-only link" = anyone with the link can see all member data.
No Web3-native access control.

### Fix — V2
Move Dashboard_View to a Next.js page:
- Connect wallet → verify membership (wallet in Members sheet)
- Show personalized stats based on connected wallet
- Leaderboard visible to all connected members
- Raw data (emails, notes) only visible to admin

```
/dashboard → wallet.connect()
→ lookup wallet in Members sheet (via Sheets API)
→ if found: render personal stats + leaderboard
→ if not found: "Not a RoadHouse member — apply at [link]"
```

---

## OPTIMIZED ARCHITECTURE — VERSION MAP

### V1 Stack (NOW — Week 1)
```
Input:     Google Form (7 fields, email-validated)
Processing: Google Sheets (6 sheets, formula engine)
Automation: Apps Script (5 triggers via clasp)
Output:    Email + Discord webhook (manual weekly)
Auth:      Email match validation only
$ROAD:     Manual CSV export + admin distribution
Web3:      Wallet column added to Members (no automation yet)
```

### V2 Stack (Month 2-3)
```
Input:     Next.js /submit (Phantom wallet auth + signature)
Processing: Google Sheets (same engine, + wallet columns)
Automation: Apps Script + Cloud Function bridge
Output:    Discord bot (role sync + auto-post)
Auth:      Wallet signature verification
$ROAD:     Apps Script → Cloud Function → Solana SPL transfer
DeSci:     IPFS archival for research outputs (Pinata)
```

### V3 Stack (Month 4+)
```
Input:     Wallet-signed submissions
Processing: Hybrid (Sheets operational + Solana for scores)
Automation: Clockwork (on-chain cron) + Apps Script
Output:    Wallet-gated dashboard + Discord bot
Auth:      Solana wallet + NFT membership credential
$ROAD:     On-chain distribution (Squads multisig)
DeSci:     IP-NFTs via Molecule, IPFS + Arweave
Audit:     Weekly score hash posted to Solana
```

---

## STACK REVIEW

| Tool | Role | Why | Limitations |
|---|---|---|---|
| Google Sheets | Backend DB | Free, formula engine, real-time, shareable | Not decentralized, quota limits |
| Google Forms | Input layer | Zero friction, 60-sec submit, validates to Sheets | No auth, spoofable |
| Google Apps Script | Automation | Native to Sheets, no external infra needed | 6-min execution limit, daily quotas |
| clasp | Local dev | Version control, VSCode workflow, CI/CD possible | Google auth required per environment |
| Discord Webhook | Output | Zero-config announcements to existing community | One-way only; need bot for roles |
| Node.js | Bridge scripts | Distribution, wallet ops, testing | Requires server/manual execution |
| @solana/web3.js | Solana ops | Official SDK, SPL transfers, wallet verification | V2+ only |
| @solana/spl-token | $ROAD transfers | SPL token standard, ATA creation | V2+ only |
| Pinata | IPFS archival | DeSci research output persistence | Paid at volume |
| dotenv | Env management | Standard, works with clasp + Node | |

### NOT in stack (intentionally excluded)
- Zapier/Make: external paid, fragile, not owned infra
- Firebase: overkill for V1, adds complexity
- Supabase: right move for V2+ but not needed yet
- GraphQL: premature for this data shape
- Redis/Upstash: moved to Sheets KV as the cache layer

---

*Audit complete. Next: implement Hurdle 5 fix (wallet column) immediately before any V2 work.*
