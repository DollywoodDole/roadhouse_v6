"""
RoadHouse Motors — Social Manager (Facebook + Instagram)
---------------------------------------------------------
Pulls live inventory from the feed API, generates posts with Claude,
and publishes to the RoadHouse Motors Facebook Page and Instagram account.

Usage:
  python social_manager.py              # dry run (preview only)
  python social_manager.py --live       # post to Facebook + Instagram
  python social_manager.py --limit 1    # post fewer vehicles
  python social_manager.py --reset      # clear posted.json and start fresh
  python social_manager.py --backfill --live   # post IG-only for previously FB-posted vehicles
  python social_manager.py --backfill --limit 10   # preview backfill (dry run)
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
POSTED_FILE       = Path(__file__).parent / "posted.json"
VIOLATION_LOG     = Path(__file__).parent / "logs" / "compliance_violations.log"
POSTS_PER_RUN     = 3
BACKFILL_LIMIT = 10   # default IG-only backfill per run (IG cap: 25/day)
CLAUDE_MODEL   = "claude-sonnet-4-6"

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


def generate_post(vehicle: dict) -> str:
    year  = vehicle.get("year", "")
    make  = vehicle.get("make", "")
    model = vehicle.get("model", "")
    trim  = vehicle.get("trim", "")
    url   = vehicle.get("url", "https://motors.roadhouse.capital")

    details = "\n".join(filter(None, [
        f"- {year} {make} {model} {trim}".strip(),
        f"- Price: {_fmt_price(vehicle.get('price_cad'))} CAD",
        f"- Mileage: {_fmt_km(vehicle.get('mileage_km'))}",
        f"- Colour: {vehicle.get('exterior_color', '')}" if vehicle.get("exterior_color") else "",
        f"- Transmission: {vehicle.get('transmission', '')}" if vehicle.get("transmission") else "",
        f"- Fuel: {vehicle.get('fuel_type', '')}" if vehicle.get("fuel_type") else "",
        f"- Listing: {url}",
    ]))

    prompt = f"""You are the social media voice for RoadHouse Motors — a Saskatchewan-based used vehicle dealership licensed under the Saskatchewan Motor Dealer Act (DL#331386).

Vehicle:
{details}

Brand voice: Direct. Unfiltered. High-standard. No filler, no hype, no urgency tactics. "Where Standards Matter."

Write ONE social media post (used for both Facebook and Instagram). Rules:

FCAA / Saskatchewan dealer compliance (non-negotiable):
- Advertised price must be presented as-is with no financing or payment breakdown unless fully disclosed — do not mention monthly payments, interest rates, or financing terms
- Do not claim "best price", "lowest price", or any superlative you cannot substantiate
- Do not imply the vehicle is certified, inspected, or under warranty unless the vehicle data confirms it
- No misleading mileage or year claims — use only what is in the vehicle data above
- Saskatchewan delivery is fine to mention as a factual service offering

Content rules:
- Lead with the vehicle itself, not a hook or gimmick
- Mention Saskatchewan delivery available
- Include the listing URL naturally
- Close the post on its own line with exactly: DL#331386 | (306) 381-8222 | Prices exclude taxes & licensing
- 200–320 characters for the body (not counting the closing line)
- 1–2 emojis max, only where natural — none is fine too
- No exclamation spam. No all-caps. No fake urgency (ACT NOW, LIMITED TIME, Don't miss out)
- Never mention O'Brian's or any other dealer name
- Return ONLY the final post text, nothing else"""

    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text.strip()


def _regenerate_compliant(vehicle: dict, violations: list[str], original_text: str) -> str:
    """
    Ask Claude to rewrite *original_text* after flagging specific violations.
    Called at most once per vehicle — if the second attempt also fails lint,
    the vehicle is skipped.
    """
    violation_lines = "\n".join(f"- {v}" for v in violations)
    prompt = f"""The following social media post for a vehicle listing was rejected by our
FCAA compliance linter for Saskatchewan dealer advertising rules:

--- REJECTED POST ---
{original_text}
--- END ---

Violations detected:
{violation_lines}

Rewrite the post removing ALL of the violations above. Keep the same vehicle
facts, brand voice (direct, unfiltered, high-standard), and mandatory closing
line. Do not introduce any new financing claims, urgency language, or
unsubstantiated superlatives. Return ONLY the rewritten post text."""

    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text.strip()


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

        images      = [img for img in (v.get("images") or []) if img.startswith("http")]
        raw_images  = images[1:4] if len(images) > 1 else (images[:1] if images else [])
        post_images = [raw_images[1], raw_images[0]] + raw_images[2:] if len(raw_images) >= 2 else raw_images

        print(f"[{i}/{len(picks)}] {title}")
        print(f"  VIN: {vin}  |  {price} CAD  |  {km}")
        print(f"  Images: {len(post_images)} ({', '.join(post_images) or 'none'})")
        print("  Generating post...")

        try:
            post_text = generate_post(v)
        except Exception as e:
            print(f"  ERROR: Claude generation failed — {e}\n")
            continue

        # ── Compliance lint ────────────────────────────────────────────────────
        violations = lint(post_text)
        if violations:
            print(f"  COMPLIANCE: {len(violations)} violation(s) on attempt 1 — regenerating...")
            for viol in violations:
                print(f"    - {viol}")
            try:
                text_2 = _regenerate_compliant(v, violations, post_text)
            except Exception as e:
                print(f"  ERROR: Regeneration failed — {e}\n")
                _log_violation(vin, violations, post_text, None, None, "generation_error")
                continue

            violations_2 = lint(text_2)
            if violations_2:
                print(f"  COMPLIANCE: Attempt 2 also failed — skipping {vin}")
                for viol in violations_2:
                    print(f"    - {viol}")
                _log_violation(vin, violations, post_text, violations_2, text_2, "skipped")
                continue
            else:
                print("  COMPLIANCE: Clean on attempt 2.")
                post_text = text_2
        else:
            print("  COMPLIANCE: Clean.")

        ig_caption = post_text + _ig_hashtags(v)

        print()
        print("  --- POST PREVIEW " + "-" * 40)
        for line in post_text.splitlines():
            print(f"  | {line}")
        print(f"  |")
        print(f"  | [link: {url}]")
        if IG_USER_ID or backfill:
            print(f"  | [IG caption appends: {_ig_hashtags(v).strip()}]")
        print("  " + "-" * 57)
        print()

        existing = posted.get(vin, {"title": title})

        if dry_run:
            newly_posted[vin] = {
                **existing,
                "title": title,
                "dry_run": True,
            }
        elif backfill:
            ig_ok = post_to_instagram(ig_caption, post_images)
            newly_posted[vin] = {
                **existing,
                "ig_posted_at": datetime.now(timezone.utc).isoformat() if ig_ok else None,
                "ig_success":   ig_ok,
            }
        else:
            fb_ok = post_to_facebook(post_text, url, post_images)
            ig_ok = post_to_instagram(ig_caption, post_images) if (IG_USER_ID and post_images) else None

            entry = {
                **existing,
                "title":        title,
                "posted_at":    datetime.now(timezone.utc).isoformat() if fb_ok else None,
                "dry_run":      False,
                "success":      fb_ok,
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
    parser.add_argument("--live",      action="store_true", help="Publish posts (default is dry run)")
    parser.add_argument("--limit",     type=int, default=None, help="Max posts per run")
    parser.add_argument("--reset",     action="store_true", help="Clear posted.json history and start fresh")
    parser.add_argument("--backfill",  action="store_true", help="Post IG-only for previously FB-posted vehicles")
    parser.add_argument("--lint-only", metavar="FILE", help="Lint a text file for FCAA violations and exit")
    args = parser.parse_args()

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

    default_limit = BACKFILL_LIMIT if args.backfill else POSTS_PER_RUN
    limit = args.limit if args.limit is not None else default_limit

    success = run(dry_run=not args.live, limit=limit, backfill=args.backfill)
    sys.exit(0 if success else 1)
