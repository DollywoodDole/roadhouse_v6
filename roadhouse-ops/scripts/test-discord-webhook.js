#!/usr/bin/env node
// test-discord-webhook.js
// Usage: node scripts/test-discord-webhook.js
require('dotenv').config();
// Node 18+ native fetch — no node-fetch needed

async function test(name, url, payload) {
  if (!url || url.includes('REPLACE')) {
    console.log(`⚠  ${name}: Not configured (skipping)`);
    return;
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 204) {
      console.log(`✓ ${name}: OK (204)`);
    } else {
      const body = await res.text();
      console.log(`✗ ${name}: HTTP ${res.status} — ${body}`);
    }
  } catch (err) {
    console.log(`✗ ${name}: ${err.message}`);
  }
}

(async () => {
  console.log('\n⚔️  ROADHOUSE — Discord Webhook Test\n');
  
  await test('Leaderboard webhook', process.env.DISCORD_WEBHOOK_LEADERBOARD, {
    content: '```\n[TEST] RoadHouse OS leaderboard webhook — connection verified\n```',
  });

  await test('Alerts webhook', process.env.DISCORD_WEBHOOK_ALERTS, {
    content: '```\n[TEST] RoadHouse OS alerts webhook — connection verified\n```',
  });

  console.log('\nTest complete.\n');
})();
