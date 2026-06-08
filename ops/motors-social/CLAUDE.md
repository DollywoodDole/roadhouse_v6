# ops/motors-social

Standalone Python social automation tool — NOT part of Next.js app.
Pulls live inventory from the feed API, generates captions with Claude, runs FCAA compliance lint,
and publishes to the RoadHouse Motors Facebook Page and Instagram Business account.

## Files

```
social_manager.py   ← main entry point; FB + IG posting pipeline
compliance.py       ← FCAA advertising compliance linter (Saskatchewan dealer rules)
watermark.py        ← Pillow-based; composites rh-logo.png (18% width, 30% opacity) onto vehicle images
reels.py            ← Ken Burns-style 9:16 MP4 (1080×1920 @ 30fps); publishes to Facebook Reels
posted.json         ← tracks posted VINs; committed back to repo by GitHub Actions after each run
requirements.txt    ← anthropic>=0.40.0 · Pillow>=10.0.0 · python-dotenv>=1.0.0 · requests>=2.32.0
MARKETPLACE_SETUP.md
tests/
  __init__.py
  test_compliance.py  ← pytest suite for compliance.lint(); run with: venv/Scripts/python -m pytest tests/test_compliance.py -v
```

`logs/compliance_violations.log` — created at runtime (directory does not exist statically)

## Commands (cd ops/motors-social first)

```bash
venv\Scripts\python social_manager.py                    # dry run (preview only)
venv\Scripts\python social_manager.py --live             # post to FB + IG (10-20 min, do NOT background)
venv\Scripts\python social_manager.py --live --auto-theme
venv\Scripts\python social_manager.py --limit 2         # post fewer vehicles
venv\Scripts\python social_manager.py --reset            # clear posted.json and start fresh
venv\Scripts\python social_manager.py --backfill --live  # post IG-only for previously FB-posted vehicles
venv\Scripts\python social_manager.py --reels-only       # Reels pipeline only (requires ENABLE_REELS=true)
venv\Scripts\python social_manager.py --reels-limit 1   # limit Reels per run (default 2)
venv\Scripts\python social_manager.py --lint-only post.txt  # lint a text file for FCAA violations
venv\Scripts\python social_manager.py --marketplace-only    # Marketplace info via FB feed pull
```

**GitHub Actions** (`.github/workflows/motors-social.yml`):
- Schedule: `0 15 * * *` (9am CST, same as motors sync)
- Runs: `python social_manager.py --live --auto-theme`
- Commits `posted.json` back to repo after each run (`[skip ci]`)
- Manual trigger: Actions tab → "RoadHouse Motors — Daily Social Post" → Run workflow

## Config constants (social_manager.py)

```python
POSTS_PER_RUN  = 6       # well below IG's 25/day cap
REELS_PER_RUN  = 2       # default Reels per run
FB_IMAGE_CAP   = 10      # FB attached_media reliable limit
IG_IMAGE_CAP   = 10      # IG carousel hard limit
CLAUDE_MODEL   = "claude-opus-4-6"
FEED_URL       = "https://motors.roadhouse.capital/api/motors/feed?format=json"
GRAPH_URL      = "https://graph.facebook.com/v25.0"
```

## GitHub secrets / vars

**Secrets:** `CRON_SECRET` · `ANTHROPIC_API_KEY` · `FB_PAGE_ACCESS_TOKEN`
**Vars:** `FB_PAGE_ID=1047748735096733` · `IG_USER_ID=17841417177506354` · `ENABLE_REELS=true` · `REELS_AUDIO_DIR`
**Meta App ID:** `915612138190380`

## Known issues

- IG Reels blocked (error 2207076) — needs Vercel Blob for public video URL. `reels.py` publishes to Facebook Reels; IG Reels is the M3 TODO. See `app/motors/CLAUDE.md` #17.
- `--live` takes 10-20 min — do NOT background; output needed for debugging.
- FB token expires — `check_fb_token()` warns 14 days before expiry. Refresh `FB_PAGE_ACCESS_TOKEN` in GitHub Secrets.
- FCAA compliance linter covers banned phrases (superlatives, urgency) + financing claims (monthly payments, APR, $0 down). Run `--lint-only` before any caption changes.
