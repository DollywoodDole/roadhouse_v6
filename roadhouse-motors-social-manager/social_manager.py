"""
RoadHouse Motors — Social Manager (Facebook + Instagram)
---------------------------------------------------------
Pulls live inventory from the feed API, generates platform-differentiated
captions with Claude, runs FCAA compliance lint, and publishes to the
RoadHouse Motors Facebook Page and Instagram Business account.

Usage:
  python social_manager.py                    # dry run (preview only)
  python social_manager.py --live             # post to Facebook + Instagram
  python social_manager.py --limit 2          # post fewer vehicles
  python social_manager.py --reset            # clear posted.json and start fresh
  python social_manager.py --backfill --live  # post IG-only for previously FB-posted vehicles
  python social_manager.py --reels-only       # Reels pipeline only (requires ENABLE_REELS=true)
  python social_manager.py --reels-limit 1    # limit Reels per run (default 2)
  python social_manager.py --lint-only post.txt   # lint a text file for FCAA violations
  python social_manager.py --marketplace-only     # Marketplace info (runs via FB feed pull)
"""

import os
import sys
import io
import json
import time
import argparse
import requests
from datetime import datetime, timezone
from pathlib import Path
from anthropic import Anthropic
from dotenv import load_dotenv
from compliance import lint
import reels as reels_mod

# Force UTF-8 output on Windows terminals
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────

FEED_URL       = "https://motors.roadhouse.capital/api/motors/feed?format=json"
GRAPH_URL      = "https://graph.facebook.com/v25.0"
FB_PAGE_ID     = os.getenv("FB_PAGE_ID", "1047748735096733")
FB_PAGE_TOKEN  = os.getenv("FB_PAGE_ACCESS_TOKEN", "")
IG_USER_ID     = os.getenv("IG_USER_ID", "")
CRON_SECRET    = os.getenv("CRON_SECRET", "")
ANTHROPIC_KEY  = os.getenv("ANTHROPIC_API_KEY", "")
POSTED_FILE    = Path(__file__).parent / "posted.json"
VIOLATION_LOG  = Path(__file__).parent / "logs" / "compliance_violations.log"
POSTS_PER_RUN  = 6    # 6/day — well below IG's 25/day cap
BACKFILL_LIMIT = 15
REELS_PER_RUN  = 2    # default Reels per day
CLAUDE_MODEL   = "claude-opus-4-6"
ENABLE_REELS   = os.getenv("ENABLE_REELS", "false").lower() == "true"

# Image caps per platform
FB_IMAGE_CAP = 20   # FB multi-photo post
IG_IMAGE_CAP = 10   # IG carousel hard limit

client = Anthropic(api_key=ANTHROPIC_KEY)

# ── Token health ──────────────────────────────────────────────────────────────

WARN_DAYS = 14

def check_fb_token() -> bool:
    if not FB_PAGE_TOKEN:
        print("ERROR: FB_PAGE_ACCESS_TOKEN not set.")
        return False

    resp = requests.get(
        f"{GRAPH_URL}/debug_token",
        params={"input_token": FB_PAGE_TOKEN, "access_token": FB_PAGE_TOKEN},
        timeout=15,
    )
    data = resp.json().get("data", {})

    if not data.get("is_valid", False):
        error = data.get("error", {})
        print(f"ERROR: FB token is invalid or expired — {error.get('message', data)}")
        print("       Refresh FB_PAGE_ACCESS_TOKEN in GitHub Secrets before the next run.")
        return False

    expires_at = data.get("expires_at", 0)
    if expires_at:
        expires_dt = datetime.fromtimestamp(expires_at, tz=timezone.utc)
        days_left  = (expires_dt - datetime.now(timezone.utc)).days
        if days_left <= WARN_DAYS:
            print(f"WARNING: FB token expires in {days_left} day(s) ({expires_dt.strftime('%Y-%m-%d')}).")
            print("         Refresh FB_PAGE_ACCESS_TOKEN in GitHub Secrets soon.")
        else:
            print(f"  FB token valid — expires {expires_dt.strftime('%Y-%m-%d')} ({days_left} days)")
    else:
        print("  FB token valid (no expiry date — likely a non-expiring token)")

    return True


# ── Inventory ─────────────────────────────────────────────────────────────────

def fetch_inventory() -> list[dict]:
    resp = requests.get(
        FEED_URL,
        headers={"Authorization": f"Bearer {CRON_SECRET}"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json().get("vehicles", [])


def load_posted() -> dict:
    if POSTED_FILE.exists():
        return json.loads(POSTED_FILE.read_text(encoding="utf-8"))
    return {}


def save_posted(posted: dict) -> None:
    POSTED_FILE.write_text(json.dumps(posted, indent=2, ensure_ascii=False), encoding="utf-8")


def pick_vehicles(vehicles: list[dict], posted: dict, limit: int) -> list[dict]:
    """
    Available, not yet posted, has real CDN images — diversified by make+model so
    the same model never appears twice in one run.
    """
    candidates = [
        v for v in vehicles
        if v.get("status") == "available"
        and v.get("vin") not in posted
        and any(img.startswith("http") for img in (v.get("images") or []))
    ]
    candidates.sort(key=lambda v: v.get("updated_at", ""), reverse=True)

    picks: list[dict] = []
    seen_models: set[str] = set()
    for v in candidates:
        key = f"{v.get('make', '').lower()}:{v.get('model', '').lower()}"
        if key in seen_models:
            continue
        seen_models.add(key)
        picks.append(v)
        if len(picks) >= limit:
            break
    return picks


def pick_ig_backfill(vehicles: list[dict], posted: dict, limit: int) -> list[dict]:
    """
    Vehicles already FB-posted (in posted.json) but not yet on IG.
    Oldest FB post first so we backfill chronologically.
    """
    vin_map = {v["vin"]: v for v in vehicles if v.get("vin")}
    candidates = []
    for vin, entry in posted.items():
        if entry.get("ig_posted_at"):
            continue                       # already on IG
        if not entry.get("success", entry.get("fb_success", True)):
            continue                       # FB post itself failed
        if vin not in vin_map:
            continue                       # no longer in inventory feed
        vehicle = vin_map[vin]
        if vehicle.get("status") != "available":
            continue
        images = [img for img in (vehicle.get("images") or []) if img.startswith("http")]
        if not images:
            continue
        candidates.append((entry.get("posted_at", entry.get("fb_posted_at", "")), vehicle))

    candidates.sort(key=lambda x: x[0] or "")   # chronological order, None-safe
    return [v for _, v in candidates[:limit]]


# ── Post generation ───────────────────────────────────────────────────────────

def _fmt_price(val) -> str:
    return f"${int(val):,}" if isinstance(val, (int, float)) else str(val)

def _fmt_km(val) -> str:
    return f"{int(val):,} km" if isinstance(val, (int, float)) else str(val)

def _ig_hashtags(vehicle: dict) -> str:
    make  = vehicle.get("make", "").replace(" ", "").replace("-", "")
    model = vehicle.get("model", "").replace(" ", "").replace("-", "")
    tags  = ["#Saskatchewan", "#UsedVehicles", "#RoadHouseMotors", "#SaskatchewanCars"]
    if make:
        tags.append(f"#{make}")
    if model and model.lower() != make.lower():
        tags.append(f"#{model}")
    return "\n\n" + " ".join(tags)


def generate_captions(vehicle: dict) -> dict[str, str]:
    """
    One Claude call → {"fb": fb_caption, "ig": ig_caption}.

    FB: 200–320 char body, URL inline, closing line.
    IG: up to 1,200 char body, no raw URL ("Link in bio"), scroll-stop hook,
        searchable Saskatchewan keywords, full specs, closing line.
        Hashtags are appended separately by _ig_hashtags().
    """
    year  = vehicle.get("year", "")
    make  = vehicle.get("make", "")
    model = vehicle.get("model", "")
    trim  = vehicle.get("trim", "")
    url   = vehicle.get("url", "https://motors.roadhouse.capital")
    body  = vehicle.get("body_style", "")
    feats = (vehicle.get("features") or [])[:6]

    details = "\n".join(filter(None, [
        f"- {year} {make} {model} {trim}".strip(),
        f"- Price: {_fmt_price(vehicle.get('price_cad'))} CAD",
        f"- Mileage: {_fmt_km(vehicle.get('mileage_km'))}",
        f"- Colour: {vehicle.get('exterior_color', '')}" if vehicle.get("exterior_color") else "",
        f"- Body style: {body}" if body else "",
        f"- Transmission: {vehicle.get('transmission', '')}" if vehicle.get("transmission") else "",
        f"- Fuel: {vehicle.get('fuel_type', '')}" if vehicle.get("fuel_type") else "",
        f"- Features: {'; '.join(feats[:3])}" if feats else "",
        f"- Listing URL: {url}",
    ]))

    prompt = f"""You are the social media voice for RoadHouse Motors — a Saskatchewan-based used vehicle dealership licensed under the Saskatchewan Motor Dealer Act (DL#331386).

Vehicle data:
{details}

Brand voice: Direct. Unfiltered. High-standard. No filler, no hype, no urgency tactics. "Where Standards Matter."

FCAA / Saskatchewan dealer compliance (applies to BOTH captions — non-negotiable):
- Present the advertised price as-is. No monthly payments, interest rates, or financing terms.
- No superlatives you cannot substantiate: no "best price", "lowest price", "cheapest", "unbeatable".
- Do not claim the vehicle is certified, inspected, or under warranty unless confirmed in data.
- Use only the mileage and year from the data above.
- Saskatchewan delivery is fine to state as a factual service.
- No urgency language: no "act now", "limited time", "don't miss", "won't last", "going fast".
- Never mention O'Brian's or any other dealer name.

Write TWO captions and return ONLY a JSON object with keys "fb" and "ig". No markdown fences, no explanation — raw JSON only.

Facebook caption ("fb"):
- Body: 200–320 characters (not counting the closing line)
- Lead with the vehicle itself
- Include the listing URL naturally in the body
- End the body with Saskatchewan delivery available
- Final line (mandatory, exact): DL#331386 | (306) 381-8222 | Prices exclude taxes & licensing
- 1–2 emojis max where natural; none is fine

Instagram caption ("ig"):
- Open with a scroll-stop first line that makes someone pause (no fake urgency — lead with what the vehicle is or who it's for)
- Body: up to 1,200 characters
- Do NOT include a raw URL — IG does not linkify; write "Link in bio." instead
- Pack searchable keywords naturally: Saskatchewan, Saskatoon, Regina, used {body if body else "vehicles"}, {year} {make} {model}, full trim name spelled out
- Include: year, make, model, trim, mileage, colour, transmission, 3–4 standout features
- Close with: Saskatchewan delivery available. Link in bio.
- Final line (mandatory, exact): DL#331386 | (306) 381-8222 | Prices exclude taxes & licensing
- Do NOT add hashtags — they are added separately

Return exactly: {{"fb": "...", "ig": "..."}}"""

    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=700,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text.strip()

    # Strip markdown code fences if Claude wraps the JSON
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        data = json.loads(raw)
        return {"fb": str(data["fb"]).strip(), "ig": str(data["ig"]).strip()}
    except (json.JSONDecodeError, KeyError):
        # Graceful fallback: use the full response as the FB caption, derive IG from it
        text = raw.strip()
        return {"fb": text, "ig": text}


def _regenerate_compliant(
    vehicle: dict,
    violations_fb: list[str],
    violations_ig: list[str],
    fb_caption: str,
    ig_caption: str,
) -> dict[str, str]:
    """
    Ask Claude to rewrite captions that failed lint, providing specific violations.
    Called at most once per vehicle — if the second attempt also fails, the vehicle is skipped.
    """
    parts = []
    if violations_fb:
        vlines = "\n".join(f"  - {v}" for v in violations_fb)
        parts.append(f"Facebook caption violations:\n{vlines}\n\nFacebook caption (rejected):\n{fb_caption}")
    if violations_ig:
        vlines = "\n".join(f"  - {v}" for v in violations_ig)
        parts.append(f"Instagram caption violations:\n{vlines}\n\nInstagram caption (rejected):\n{ig_caption}")

    prompt = f"""The following vehicle listing captions were rejected by our FCAA compliance linter
for Saskatchewan dealer advertising rules. Rewrite them removing ALL violations.
Keep the same vehicle facts, brand voice (direct, unfiltered, high-standard),
and mandatory closing line. Do not introduce any new financing claims, urgency
language, or unsubstantiated superlatives.

{chr(10).join(parts)}

Return ONLY a JSON object: {{"fb": "rewritten fb caption", "ig": "rewritten ig caption"}}
No markdown, no explanation."""

    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=700,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        data = json.loads(raw)
        return {"fb": str(data["fb"]).strip(), "ig": str(data["ig"]).strip()}
    except (json.JSONDecodeError, KeyError):
        text = raw.strip()
        return {"fb": text, "ig": text}


def _log_violation(
    vin: str,
    violations_1: list[str],
    text_1: str,
    violations_2: list[str] | None,
    text_2: str | None,
    action: str,
) -> None:
    """Append a structured entry to logs/compliance_violations.log."""
    ts = datetime.now(timezone.utc).isoformat()
    lines = [
        f"[{ts}] VIN={vin} action={action}",
        "  Attempt 1 violations:",
    ]
    for v in violations_1:
        lines.append(f"    - {v}")
    lines.append(f"  Attempt 1 text: {text_1!r}")
    if violations_2 is not None:
        lines.append("  Attempt 2 violations:")
        for v in violations_2:
            lines.append(f"    - {v}")
    if text_2 is not None:
        lines.append(f"  Attempt 2 text: {text_2!r}")
    lines.append("")

    VIOLATION_LOG.parent.mkdir(exist_ok=True)
    with VIOLATION_LOG.open("a", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


# ── Facebook ──────────────────────────────────────────────────────────────────

def post_to_facebook(message: str, link: str, image_urls: list[str]) -> bool:
    image_urls = image_urls[:FB_IMAGE_CAP]  # hard cap — FB multi-photo limit
    if len(image_urls) == 1:
        resp = requests.post(
            f"{GRAPH_URL}/{FB_PAGE_ID}/photos",
            data={
                "url":          image_urls[0],
                "caption":      message,
                "access_token": FB_PAGE_TOKEN,
            },
            timeout=30,
        )
        result = resp.json()
        if "id" in result:
            print(f"  FB:  Published: https://www.facebook.com/{result['id']}")
            return True
        err = result.get("error", {})
        print(f"  FB:  Failed [{err.get('code', '?')}]: {err.get('message', result)}")
        return False

    elif len(image_urls) > 1:
        media_ids = []
        for img_url in image_urls:
            r = requests.post(
                f"{GRAPH_URL}/{FB_PAGE_ID}/photos",
                data={
                    "url":          img_url,
                    "published":    "false",
                    "access_token": FB_PAGE_TOKEN,
                },
                timeout=30,
            )
            r_json = r.json()
            if "id" in r_json:
                media_ids.append(r_json["id"])
            else:
                err = r_json.get("error", {})
                print(f"  FB:  Warning: could not upload photo [{err.get('code', '?')}]: {err.get('message', r_json)}")

        if not media_ids:
            print("  FB:  Failed: no photos uploaded successfully")
            return False

        attached = json.dumps([{"media_fbid": mid} for mid in media_ids])
        resp = requests.post(
            f"{GRAPH_URL}/{FB_PAGE_ID}/feed",
            data={
                "message":        message,
                "attached_media": attached,
                "access_token":   FB_PAGE_TOKEN,
            },
            timeout=30,
        )
        result = resp.json()
        if "id" in result:
            print(f"  FB:  Published ({len(media_ids)} photos): https://www.facebook.com/{result['id']}")
            return True
        err = result.get("error", {})
        print(f"  FB:  Failed [{err.get('code', '?')}]: {err.get('message', result)}")
        return False

    else:
        resp = requests.post(
            f"{GRAPH_URL}/{FB_PAGE_ID}/feed",
            data={
                "message":      message,
                "link":         link,
                "access_token": FB_PAGE_TOKEN,
            },
            timeout=30,
        )
        result = resp.json()
        if "id" in result:
            print(f"  FB:  Published: https://www.facebook.com/{result['id']}")
            return True
        err = result.get("error", {})
        print(f"  FB:  Failed [{err.get('code', '?')}]: {err.get('message', result)}")
        return False


# ── Instagram helpers ─────────────────────────────────────────────────────────

def _wait_for_ig_container(container_id: str, timeout: int = 60) -> bool:
    """Poll IG media container until FINISHED or timeout. Returns True if ready."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        r = requests.get(
            f"{GRAPH_URL}/{container_id}",
            params={"fields": "status_code", "access_token": FB_PAGE_TOKEN},
            timeout=15,
        )
        status = r.json().get("status_code", "")
        if status == "FINISHED":
            return True
        if status in ("ERROR", "EXPIRED"):
            print(f"  IG:  Container {container_id} status: {status}")
            return False
        time.sleep(4)
    print(f"  IG:  Container {container_id} timed out waiting for FINISHED")
    return False


# ── Instagram ─────────────────────────────────────────────────────────────────

def post_to_instagram(caption: str, image_urls: list[str]) -> bool:
    """
    Publish to Instagram Business via Graph API.
    Requires IG_USER_ID env var and FB_PAGE_ACCESS_TOKEN with:
      instagram_basic + instagram_content_publish scopes.
    """
    if not IG_USER_ID:
        print("  IG:  Skipped — IG_USER_ID not set")
        return False

    images = image_urls[:10]  # IG carousel max is 10

    if len(images) == 1:
        # Single image container
        r = requests.post(
            f"{GRAPH_URL}/{IG_USER_ID}/media",
            data={
                "image_url":    images[0],
                "caption":      caption,
                "access_token": FB_PAGE_TOKEN,
            },
            timeout=30,
        )
        result = r.json()
        if "id" not in result:
            err = result.get("error", {})
            print(f"  IG:  Failed [{err.get('code','?')}]: {err.get('message', result)}")
            return False
        creation_id = result["id"]
        if not _wait_for_ig_container(creation_id):
            print("  IG:  Failed — single image container not ready")
            return False

    elif len(images) > 1:
        # Carousel: upload each item, poll until ready, then create carousel container
        item_ids = []
        for img_url in images:
            r = requests.post(
                f"{GRAPH_URL}/{IG_USER_ID}/media",
                data={
                    "image_url":        img_url,
                    "is_carousel_item": "true",
                    "access_token":     FB_PAGE_TOKEN,
                },
                timeout=30,
            )
            rj = r.json()
            if "id" in rj:
                item_ids.append(rj["id"])
            else:
                err = rj.get("error", {})
                print(f"  IG:  Warning: carousel item failed [{err.get('code','?')}]: {err.get('message', rj)}")

        if not item_ids:
            print("  IG:  Failed — no carousel items uploaded")
            return False

        # Wait for all item containers to finish processing
        item_ids = [cid for cid in item_ids if _wait_for_ig_container(cid)]
        if not item_ids:
            print("  IG:  Failed — no carousel items reached FINISHED state")
            return False

        r = requests.post(
            f"{GRAPH_URL}/{IG_USER_ID}/media",
            data={
                "media_type":   "CAROUSEL",
                "children":     ",".join(item_ids),
                "caption":      caption,
                "access_token": FB_PAGE_TOKEN,
            },
            timeout=30,
        )
        result = r.json()
        if "id" not in result:
            err = result.get("error", {})
            print(f"  IG:  Failed [{err.get('code','?')}]: {err.get('message', result)}")
            return False
        creation_id = result["id"]

    else:
        print("  IG:  Skipped — no images")
        return False

    # Publish the container
    r = requests.post(
        f"{GRAPH_URL}/{IG_USER_ID}/media_publish",
        data={
            "creation_id":  creation_id,
            "access_token": FB_PAGE_TOKEN,
        },
        timeout=30,
    )
    result = r.json()
    if "id" in result:
        print(f"  IG:  Published ({len(images)} photo{'s' if len(images) > 1 else ''}): post id {result['id']}")
        return True
    err = result.get("error", {})
    code = err.get("code")
    # Codes 4 and 9007 are confirmed false negatives — Meta returns the error
    # but the post publishes successfully. Treat as success.
    if code in (4, 9007):
        print(f"  IG:  Published (confirmed false negative [{code}]: {err.get('message', '')})")
        return True
    print(f"  IG:  Failed [{code}]: {err.get('message', result)}")
    return False


# ── Main ──────────────────────────────────────────────────────────────────────

def run(dry_run: bool = True, limit: int = POSTS_PER_RUN, backfill: bool = False) -> bool:
    platforms = []
    if not backfill:
        platforms.append("Facebook")
    if IG_USER_ID or backfill:
        platforms.append("Instagram")
    platform_str = " + ".join(platforms) if platforms else "Facebook + Instagram"

    if backfill:
        mode_label = f"BACKFILL — IG-only for previously FB-posted vehicles ({'dry run' if dry_run else 'live'})"
    elif dry_run:
        mode_label = "DRY RUN — preview only"
    else:
        mode_label = f"LIVE — posting to {platform_str}"

    print(f"\nRoadHouse Motors Social Manager")
    print(f"Mode : {mode_label}")
    print(f"Time : {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print()

    if not CRON_SECRET:
        print("ERROR: CRON_SECRET not set in .env")
        return False
    if not ANTHROPIC_KEY:
        print("ERROR: ANTHROPIC_API_KEY not set in .env")
        return False
    if not dry_run:
        print("Checking FB token...")
        if not check_fb_token():
            return False
        if IG_USER_ID:
            print(f"  IG user ID: {IG_USER_ID}")
        else:
            if backfill:
                print("ERROR: IG_USER_ID not set — required for backfill")
                return False
            print("  IG_USER_ID not set — Instagram will be skipped")
        print()

    print("Fetching inventory...")
    try:
        vehicles = fetch_inventory()
    except Exception as e:
        print(f"ERROR: Could not fetch feed — {e}")
        return False
    print(f"  {len(vehicles)} vehicles in feed")

    posted = load_posted()

    if backfill:
        picks = pick_ig_backfill(vehicles, posted, limit)
        action_label = "IG backfill"
    else:
        picks = pick_vehicles(vehicles, posted, limit)
        action_label = "new post"

    if not picks:
        if backfill:
            print("  Nothing to backfill — all FB-posted vehicles are already on Instagram.")
        else:
            print("  Nothing new to post — all available inventory already in posted.json.")
            print("  Run with --reset to clear history and start fresh.")
        return True

    print(f"  {len(picks)} selected ({action_label})\n")

    newly_posted: dict = {}

    for i, v in enumerate(picks, 1):
        vin   = v["vin"]
        title = f"{v.get('year')} {v.get('make')} {v.get('model')} {v.get('trim', '')}".strip()
        url   = v.get("url", "https://motors.roadhouse.capital")
        price = _fmt_price(v.get("price_cad"))
        km    = _fmt_km(v.get("mileage_km"))

        # ── Images — separate caps for FB (20) and IG (10) ────────────────────
        all_images = [img for img in (v.get("images") or []) if img.startswith("http")]
        # images[0] is the branded dealer overlay — skip it for posts
        fb_images = all_images[1:1 + FB_IMAGE_CAP]
        ig_images = all_images[1:1 + IG_IMAGE_CAP]

        print(f"[{i}/{len(picks)}] {title}")
        print(f"  VIN: {vin}  |  {price} CAD  |  {km}")
        print(f"  Images: {len(all_images)} total | FB: {len(fb_images)} | IG: {len(ig_images)}")
        print("  Generating captions...")

        try:
            captions = generate_captions(v)
        except Exception as e:
            print(f"  ERROR: Claude generation failed — {e}\n")
            continue

        fb_caption = captions["fb"]
        ig_caption = captions["ig"] + _ig_hashtags(v)

        # ── Compliance lint — FB and IG independently ──────────────────────────
        v_fb = lint(fb_caption)
        v_ig = lint(captions["ig"])  # lint before hashtags (hashtags are always clean)

        if v_fb or v_ig:
            total = len(v_fb) + len(v_ig)
            print(f"  COMPLIANCE: {total} violation(s) on attempt 1 — regenerating...")
            if v_fb:
                print(f"    FB ({len(v_fb)}):")
                for viol in v_fb:
                    print(f"      - {viol}")
            if v_ig:
                print(f"    IG ({len(v_ig)}):")
                for viol in v_ig:
                    print(f"      - {viol}")
            try:
                captions2 = _regenerate_compliant(v, v_fb, v_ig, fb_caption, captions["ig"])
            except Exception as e:
                print(f"  ERROR: Regeneration failed — {e}\n")
                _log_violation(vin, v_fb + v_ig, fb_caption, None, None, "generation_error")
                continue

            v_fb2 = lint(captions2["fb"])
            v_ig2 = lint(captions2["ig"])
            if v_fb2 or v_ig2:
                print(f"  COMPLIANCE: Attempt 2 also failed — skipping {vin}")
                for viol in v_fb2 + v_ig2:
                    print(f"    - {viol}")
                _log_violation(vin, v_fb + v_ig, fb_caption, v_fb2 + v_ig2, captions2["fb"], "skipped")
                continue
            else:
                print("  COMPLIANCE: Clean on attempt 2.")
                fb_caption = captions2["fb"]
                ig_caption = captions2["ig"] + _ig_hashtags(v)
        else:
            print("  COMPLIANCE: Clean.")

        print()
        print("  --- FB CAPTION " + "-" * 42)
        for line in fb_caption.splitlines():
            print(f"  | {line}")
        print(f"  | [images: {len(fb_images)}]")
        print()
        print("  --- IG CAPTION " + "-" * 42)
        for line in ig_caption.splitlines():
            print(f"  | {line}")
        print(f"  | [images: {len(ig_images)}]")
        print("  " + "-" * 57)
        print()

        existing = posted.get(vin, {"title": title})

        if dry_run:
            newly_posted[vin] = {
                **existing,
                "title":   title,
                "dry_run": True,
            }
        elif backfill:
            ig_ok = post_to_instagram(ig_caption, ig_images)
            newly_posted[vin] = {
                **existing,
                "ig_posted_at": datetime.now(timezone.utc).isoformat() if ig_ok else None,
                "ig_success":   ig_ok,
            }
        else:
            fb_ok = post_to_facebook(fb_caption, url, fb_images)
            ig_ok = post_to_instagram(ig_caption, ig_images) if (IG_USER_ID and ig_images) else None

            entry = {
                **existing,
                "title":     title,
                "posted_at": datetime.now(timezone.utc).isoformat() if fb_ok else None,
                "dry_run":   False,
                "success":   fb_ok,
            }
            if ig_ok is not None:
                entry["ig_posted_at"] = datetime.now(timezone.utc).isoformat() if ig_ok else None
                entry["ig_success"]   = ig_ok
            newly_posted[vin] = entry

        print()

    posted.update(newly_posted)
    save_posted(posted)

    if dry_run:
        print(f"Dry run complete. {len(newly_posted)} post(s) previewed.")
        print("Run with --live when ready to publish.")
        return True
    elif backfill:
        ok = sum(1 for r in newly_posted.values() if r.get("ig_success"))
        print(f"Backfill done. {ok}/{len(picks)} post(s) published to Instagram.")
        if ok == 0:
            print("ERROR: All IG posts failed — check IG_USER_ID and token scopes.")
            return False
        return True
    else:
        fb_ok = sum(1 for r in newly_posted.values() if r.get("success"))
        ig_ok = sum(1 for r in newly_posted.values() if r.get("ig_success"))
        print(f"Done. {fb_ok}/{len(picks)} post(s) published to Facebook.", end="")
        if IG_USER_ID:
            print(f"  {ig_ok}/{len(picks)} published to Instagram.")
        else:
            print()
        if fb_ok == 0:
            print("ERROR: All FB posts failed — check FB token and page permissions.")
            return False
        return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RoadHouse Motors Social Manager (Facebook + Instagram)")
    parser.add_argument("--live",             action="store_true", help="Publish posts (default is dry run)")
    parser.add_argument("--limit",            type=int, default=None, help="Max feed posts per run")
    parser.add_argument("--reset",            action="store_true", help="Clear posted.json history and start fresh")
    parser.add_argument("--backfill",         action="store_true", help="Post IG-only for previously FB-posted vehicles")
    parser.add_argument("--feed-only",        action="store_true", help="Run feed posts only (skip Reels even if ENABLE_REELS=true)")
    parser.add_argument("--reels-only",       action="store_true", help="Reels pipeline only — skip regular feed posts")
    parser.add_argument("--reels-limit",      type=int, default=None, help=f"Max Reels per run (default {REELS_PER_RUN})")
    parser.add_argument("--marketplace-only", action="store_true", help="(v1 no-op) Marketplace runs via FB-side scheduled feed pull")
    parser.add_argument("--lint-only",        metavar="FILE", help="Lint a text file for FCAA violations and exit")
    args = parser.parse_args()

    if args.marketplace_only:
        print("Marketplace runs via FB-side scheduled feed pull. See MARKETPLACE_SETUP.md.")
        print("Feed URL: https://motors.roadhouse.capital/api/motors/feed/catalog")
        sys.exit(0)

    if args.lint_only:
        path = Path(args.lint_only)
        text = path.read_text(encoding="utf-8") if path.exists() else args.lint_only
        violations = lint(text)
        if violations:
            print(f"FCAA violations ({len(violations)}):")
            for v in violations:
                print(f"  - {v}")
            sys.exit(1)
        else:
            print("Clean — no FCAA violations detected.")
            sys.exit(0)

    if args.reset:
        if POSTED_FILE.exists():
            POSTED_FILE.unlink()
            print("posted.json cleared.\n")
        else:
            print("posted.json not found — nothing to clear.\n")

    # ── Reels-only mode ───────────────────────────────────────────────────────
    if args.reels_only:
        if not ENABLE_REELS:
            print("ERROR: ENABLE_REELS is not set to true — Reels pipeline is disabled.")
            print("       Set ENABLE_REELS=true in your environment to enable.")
            sys.exit(1)
        if not CRON_SECRET:
            print("ERROR: CRON_SECRET not set in .env")
            sys.exit(1)
        reels_limit = args.reels_limit if args.reels_limit is not None else REELS_PER_RUN
        print(f"\nRoadHouse Motors Social Manager — Reels Pipeline")
        print(f"Mode : {'LIVE' if args.live else 'DRY RUN'}")
        print(f"Time : {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        print("Fetching inventory...")
        try:
            vehicles = fetch_inventory()
        except Exception as e:
            print(f"ERROR: Could not fetch feed — {e}")
            sys.exit(1)
        print(f"  {len(vehicles)} vehicles in feed")
        posted = load_posted()
        reel_results = reels_mod.run_reels(
            vehicles=vehicles,
            posted=posted,
            page_id=FB_PAGE_ID,
            page_token=FB_PAGE_TOKEN,
            ig_user_id=IG_USER_ID,
            dry_run=not args.live,
            limit=reels_limit,
        )
        for vin, entry in reel_results.items():
            posted[vin] = {**posted.get(vin, {}), **entry}
        save_posted(posted)
        fb_ok = sum(1 for r in reel_results.values() if r.get("reel_fb_success"))
        ig_ok = sum(1 for r in reel_results.values() if r.get("reel_ig_success"))
        n = len(reel_results)
        if n:
            print(f"\nReels done. {fb_ok}/{n} published to FB Reels.  {ig_ok}/{n} published to IG Reels.")
        sys.exit(0 if (not reel_results or fb_ok > 0) else 1)

    # ── Regular feed posts ────────────────────────────────────────────────────
    default_limit = BACKFILL_LIMIT if args.backfill else POSTS_PER_RUN
    limit = args.limit if args.limit is not None else default_limit

    success = run(dry_run=not args.live, limit=limit, backfill=args.backfill)

    # ── Reels pipeline (runs after feed posts unless --feed-only) ─────────────
    if ENABLE_REELS and not args.feed_only and not args.backfill and success:
        reels_limit = args.reels_limit if args.reels_limit is not None else REELS_PER_RUN
        print(f"\n{'─' * 60}")
        print("Reels pipeline enabled (ENABLE_REELS=true)")
        try:
            vehicles = fetch_inventory()
        except Exception as e:
            print(f"REEL: Could not fetch inventory — {e}")
            sys.exit(0 if success else 1)
        posted = load_posted()
        reel_results = reels_mod.run_reels(
            vehicles=vehicles,
            posted=posted,
            page_id=FB_PAGE_ID,
            page_token=FB_PAGE_TOKEN,
            ig_user_id=IG_USER_ID,
            dry_run=not args.live,
            limit=reels_limit,
        )
        for vin, entry in reel_results.items():
            posted[vin] = {**posted.get(vin, {}), **entry}
        save_posted(posted)
        fb_reel_ok = sum(1 for r in reel_results.values() if r.get("reel_fb_success"))
        ig_reel_ok = sum(1 for r in reel_results.values() if r.get("reel_ig_success"))
        n = len(reel_results)
        if n:
            print(f"Reels done. {fb_reel_ok}/{n} FB Reels  |  {ig_reel_ok}/{n} IG Reels")

    sys.exit(0 if success else 1)
