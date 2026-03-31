'use strict';
const fs   = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { getAuthClient } = require('./gauth.js');

const ROOT        = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'bootstrap.config.json');

const SHEETS = [
  { title:'Members',            color:{red:0.2,green:0.4,blue:0.8}, frozen:1,
    headers:['Member_ID','Handle','Full_Name','Email','Join_Date','Cohort','Status','Tier','Total_Score_AllTime','Total_Outputs_AllTime','Streak_Current','Last_Submission_Date','Active','Wallet_Pubkey','Wallet_Verified','Notes'],
    widths: [80,90,120,160,100,90,90,110,120,130,100,150,65,200,110,120] },
  { title:'Outputs_RAW',        color:{red:0.8,green:0.2,blue:0.2}, frozen:1, protect:true,
    headers:['Timestamp','Email_Address','Member_ID','Output_Type','Output_Title','Output_Description','Output_URL','Self_Score','Week_Number','Notes_Optional'],
    widths: [160,160,80,150,180,220,200,90,90,160] },
  { title:'Outputs_PROCESSED',  color:{red:0.8,green:0.5,blue:0.1}, frozen:1,
    headers:['Row_ID','Member_ID','Handle','Submission_Date','Week_Number','Output_Type','Output_Title','Score_Final','Score_Raw','Type_Multiplier','Valid_Member','Output_URL','Day_of_Week','Is_Weekend','Score_Override','Flag_Review'],
    widths: [60,80,80,110,80,150,180,90,80,110,90,180,80,80,100,90] },
  { title:'Scoreboard',         color:{red:0.1,green:0.6,blue:0.3}, frozen:1,
    headers:['Rank','Member_ID','Handle','Tier','Week_Score','Week_Outputs','Week_Number','Avg_Score','Prior_Week_Score','Score_Delta','Rank_Change','Status'],
    widths: [60,80,90,110,90,100,90,130,130,90,100,100] },
  { title:'Dashboard_View',     color:{red:0.3,green:0.7,blue:0.3}, frozen:1,
    headers:['Rank','Handle','Tier','Week_Score','Outputs','Avg_Score','Delta'],
    widths: [60,110,110,100,80,90,90] },
  { title:'Config',             color:{red:0.5,green:0.5,blue:0.5}, frozen:1,
    headers:['Parameter','Value'], widths:[220,200] },
];

const CFG_ROWS = [
  ['CURRENT_WEEK','=ISOWEEKNUM(TODAY())'],['CURRENT_YEAR','=YEAR(TODAY())'],
  ['SEASON_START','2026-01-01'],['INACTIVE_THRESHOLD_DAYS','7'],
  ['TIER_OBSERVER_MIN','0'],['TIER_CONTRIBUTOR_MIN','500'],
  ['TIER_PRODUCER_MIN','2000'],['TIER_OPERATOR_MIN','5000'],
  ['WEEKEND_BONUS_MULT','1.1'],['MAX_DAILY_SUBMISSIONS','3'],
  ['ADMIN_EMAIL','admin@roadhouse.capital'],['DISCORD_WEBHOOK',''],
  ['ROAD_CONVERSION_RATE','10'],['DISTRIBUTION_ENABLED','FALSE'],
];

async function main() {
  const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH,'utf8'));
  if (cfg.google.spreadsheetId && cfg.google.spreadsheetId.length > 10) {
    console.log('✓ Spreadsheet already exists: ' + cfg.google.spreadsheetId); return cfg.google.spreadsheetId;
  }
  console.log('\n⚔️  Creating RoadHouse OS Spreadsheet...\n');
  const auth   = await getAuthClient();
  const sheets = google.sheets({ version:'v4', auth });

  // Create spreadsheet
  const res = await sheets.spreadsheets.create({ requestBody: {
    properties: { title: cfg.google.sheetTitle || 'RoadHouse OS — Operations', timeZone: cfg.admin.timezone || 'America/Regina' },
    sheets: SHEETS.map(s => ({ properties: { title:s.title, tabColor:s.color, gridProperties:{ frozenRowCount:s.frozen, rowCount:1002, columnCount:s.headers.length+2 } } })),
  }});
  const sid = res.data.spreadsheetId;
  const idMap = {};
  res.data.sheets.forEach(s => { idMap[s.properties.title] = s.properties.sheetId; });
  console.log('✓ Created: ' + sid);

  // Write headers + config
  const updates = SHEETS.map(s => ({ range: s.title+'!A1', values:[s.headers] }));
  updates.push({ range:'Config!A2', values:CFG_ROWS });
  // Pre-populate Scoreboard B column with Members refs
  updates.push({ range:'Scoreboard!B2', values: Array.from({length:50},(_,i) => [`=IF(Members!A${i+2}="","",Members!A${i+2})`]) });
  await sheets.spreadsheets.values.batchUpdate({ spreadsheetId:sid, requestBody:{ valueInputOption:'USER_ENTERED', data:updates } });

  // Column widths + header formatting
  const reqs = [];
  SHEETS.forEach(s => {
    const shId = idMap[s.title];
    s.widths.forEach((px,i) => reqs.push({ updateDimensionProperties:{ range:{sheetId:shId,dimension:'COLUMNS',startIndex:i,endIndex:i+1}, properties:{pixelSize:px}, fields:'pixelSize' } }));
    reqs.push({ repeatCell:{ range:{sheetId:shId,startRowIndex:0,endRowIndex:1,startColumnIndex:0,endColumnIndex:s.headers.length},
      cell:{ userEnteredFormat:{ backgroundColor:{red:0.15,green:0.15,blue:0.15}, textFormat:{foregroundColor:{red:1,green:1,blue:1},bold:true,fontSize:10}, horizontalAlignment:'LEFT' } },
      fields:'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)' }});
  });

  // Protect Outputs_RAW
  reqs.push({ addProtectedRange:{ protectedRange:{ range:{sheetId:idMap['Outputs_RAW'],startRowIndex:1,endRowIndex:10000,startColumnIndex:0,endColumnIndex:10}, description:'DO NOT EDIT — Form output only', warningOnly:false, editors:{users:[]} } } });

  // Conditional formatting — Scoreboard rank colours
  const scId = idMap['Scoreboard'];
  [{v:'1',r:1.0,g:0.85,b:0.0},{v:'2',r:0.85,g:0.85,b:0.85},{v:'3',r:0.8,g:0.55,b:0.2}].forEach((m,i) => {
    reqs.push({ addConditionalFormatRule:{ rule:{ ranges:[{sheetId:scId,startRowIndex:1,endRowIndex:200,startColumnIndex:0,endColumnIndex:12}], booleanRule:{ condition:{type:'TEXT_EQ',values:[{userEnteredValue:m.v}]}, format:{backgroundColor:{red:m.r,green:m.g,blue:m.b}} } }, index:i } });
  });

  await sheets.spreadsheets.batchUpdate({ spreadsheetId:sid, requestBody:{requests:reqs} });

  // Named ranges
  await sheets.spreadsheets.batchUpdate({ spreadsheetId:sid, requestBody:{ requests:[
    { addNamedRange:{ namedRange:{ name:'CURRENT_WEEK', range:{sheetId:idMap['Config'],startRowIndex:1,endRowIndex:2,startColumnIndex:1,endColumnIndex:2} } } },
    { addNamedRange:{ namedRange:{ name:'CURRENT_YEAR', range:{sheetId:idMap['Config'],startRowIndex:2,endRowIndex:3,startColumnIndex:1,endColumnIndex:2} } } },
  ]}});

  // PROCESSED formulas
  const pf = [];
  for (let i=2;i<=201;i++) pf.push([
    `=IF(Outputs_RAW!C${i}="","",ROW()-1)`,
    `=IF(Outputs_RAW!C${i}="","",Outputs_RAW!C${i})`,
    `=IF(B${i}="","",IFERROR(VLOOKUP(B${i},Members!A:B,2,FALSE),"[Unknown]"))`,
    `=IF(Outputs_RAW!A${i}="","",INT(Outputs_RAW!A${i}))`,
    `=IF(D${i}="","",ISOWEEKNUM(D${i}))`,
    `=IF(Outputs_RAW!D${i}="","",Outputs_RAW!D${i})`,
    `=IF(Outputs_RAW!E${i}="","",Outputs_RAW!E${i})`,
    `=IF(I${i}="",0,ROUND(IF(O${i}<>"",O${i},I${i})*J${i}*IF(N${i}=TRUE,1.1,1),1))`,
    `=IF(Outputs_RAW!H${i}="","",VALUE(Outputs_RAW!H${i}))`,
    `=IFERROR(SWITCH(F${i},"Content Published",2.0,"Code Shipped",2.0,"Deal Closed",2.5,"Research Published",1.8,"Strategic Output",1.7,"Community Build",1.5,"Training Log",1.2,"Daily Check-In",1.0),1.0)`,
    `=IF(B${i}="","",IFERROR(MATCH(B${i},Members!A:A,0)>0,FALSE))`,
    `=IF(Outputs_RAW!G${i}="","",Outputs_RAW!G${i})`,
    `=IF(D${i}="","",TEXT(D${i},"DDD"))`,
    `=IF(D${i}="","",OR(WEEKDAY(D${i},2)=6,WEEKDAY(D${i},2)=7))`,
    ``,
    `=IF(AND(I${i}>=4,L${i}=""),"REVIEW","")`,
  ]);
  await sheets.spreadsheets.values.update({ spreadsheetId:sid, range:'Outputs_PROCESSED!A2', valueInputOption:'USER_ENTERED', requestBody:{values:pf} });

  // Members formula cols G onwards (rows 2-201)
  const mf = [];
  for (let i=2;i<=201;i++) mf.push([
    `=IF(A${i}="","",IF(COUNTIFS(Outputs_PROCESSED!B:B,A${i},Outputs_PROCESSED!D:D,">="&(TODAY()-30))>=20,"Active",IF(COUNTIFS(Outputs_PROCESSED!B:B,A${i},Outputs_PROCESSED!D:D,">="&(TODAY()-30))>=10,"Engaged",IF(COUNTIFS(Outputs_PROCESSED!B:B,A${i},Outputs_PROCESSED!D:D,">="&(TODAY()-30))>=1,"Dormant","Inactive"))))`,
    `=IF(A${i}="","",IF(I${i}>=Config!B8,"Operator",IF(I${i}>=Config!B7,"Producer",IF(I${i}>=Config!B6,"Contributor","Observer"))))`,
    `=IF(A${i}="","",IFERROR(SUMIF(Outputs_PROCESSED!B:B,A${i},Outputs_PROCESSED!H:H),0))`,
    `=IF(A${i}="","",IFERROR(COUNTIF(Outputs_PROCESSED!B:B,A${i}),0))`,
    ``,
    `=IF(A${i}="","",IFERROR(TEXT(MAXIFS(Outputs_PROCESSED!D:D,Outputs_PROCESSED!B:B,A${i}),"YYYY-MM-DD"),"Never"))`,
    `=IF(A${i}="",FALSE,IF(L${i}="Never",FALSE,DATEVALUE(L${i})>=TODAY()-Config!B4))`,
  ]);
  await sheets.spreadsheets.values.update({ spreadsheetId:sid, range:'Members!G2', valueInputOption:'USER_ENTERED', requestBody:{values:mf} });

  // Scoreboard formulas
  const sf = [];
  for (let i=2;i<=201;i++) sf.push([
    `=IF(E${i}=0,"—",RANK(E${i},$E$2:$E$201,0)+COUNTIFS($E$2:$E$201,E${i},$I$2:$I$201,">"&I${i})*0.001)`,
    ``,
    `=IF(B${i}="","",IFERROR(VLOOKUP(B${i},Members!A:B,2,FALSE),""))`,
    `=IF(B${i}="","",IFERROR(VLOOKUP(B${i},Members!A:H,8,FALSE),""))`,
    `=IF(B${i}="","",SUMIFS(Outputs_PROCESSED!H:H,Outputs_PROCESSED!B:B,B${i},Outputs_PROCESSED!E:E,CURRENT_WEEK,Outputs_PROCESSED!K:K,TRUE))`,
    `=IF(B${i}="","",COUNTIFS(Outputs_PROCESSED!B:B,B${i},Outputs_PROCESSED!E:E,CURRENT_WEEK,Outputs_PROCESSED!K:K,TRUE))`,
    `=IF(B${i}="","",CURRENT_WEEK)`,
    `=IF(F${i}=0,"—",ROUND(E${i}/F${i},2))`,
    `=IF(B${i}="","",SUMIFS(Outputs_PROCESSED!H:H,Outputs_PROCESSED!B:B,B${i},Outputs_PROCESSED!E:E,CURRENT_WEEK-1,Outputs_PROCESSED!K:K,TRUE))`,
    `=IF(B${i}="","",E${i}-I${i})`,
    ``,
    `=IF(B${i}="","",IFERROR(VLOOKUP(B${i},Members!A:G,7,FALSE),""))`,
  ]);
  await sheets.spreadsheets.values.update({ spreadsheetId:sid, range:'Scoreboard!A2', valueInputOption:'USER_ENTERED', requestBody:{values:sf} });

  // Dashboard QUERY
  await sheets.spreadsheets.values.update({ spreadsheetId:sid, range:'Dashboard_View!A2', valueInputOption:'USER_ENTERED',
    requestBody:{values:[[`=IFERROR(QUERY({Scoreboard!A2:L201},"SELECT Col1,Col3,Col4,Col5,Col6,Col8,Col10 WHERE Col5>0 ORDER BY Col5 DESC",0),"No data yet")`]]} });

  cfg.google.spreadsheetId = sid;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg,null,2));
  console.log('\n════════════════════════════════════');
  console.log('⚔️  SHEET CREATED');
  console.log('ID:  ' + sid);
  console.log('URL: https://docs.google.com/spreadsheets/d/'+sid+'/edit');
  console.log('════════════════════════════════════\n');
  return sid;
}

if (require.main === module) { main().catch(e => { console.error(e.message); process.exit(1); }); }
module.exports = { main };
