"""
RoadHouse Motors — Facebook Social Manager
------------------------------------------
Pulls live inventory from the feed API, generates posts with Claude,
and publishes to the RoadHouse Motors Facebook Page.

Usage:
  python social_manager.py              # dry run (preview only)
  python social_manager.py --live       # post to Facebook
  python social_manager.py --limit 1   # post fewer vehicles
  python social_manager.py --reset     # clear posted.json and start fresh
"""

import os
import sys
import io
import json
import argparse
import requests
from datetime import datetime, timezone
from pathlib import Path
from anthropic import Anthropic
from dotenv import load_dotenv

# Force UTF-8 output on Windows terminals
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

load_dotenv()

# ── Config ────────────────────────────────────────────────────────────────────

FEED_URL       = "https://motors.roadhouse.capital/api/motors/feed?format=json"
FB_GRAPH_URL   = "https://graph.facebook.com/v20.0"
FB_PAGE_ID     = os.getenv("FB_PAGE_ID", "1047748735096733")
FB_PAGE_TOKEN  = os.getenv("FB_PAGE_ACCESS_TOKEN", "")
CRON_SECRET    = os.getenv("CRON_SECRET", "")
ANTHROPIC_KEY  = os.getenv("ANTHROPIC_API_KEY", "")
POSTED_FILE    = Path(__file__).parent / "posted.json"
POSTS_PER_RUN  = 3
CLAUDE_MODEL   = "claude-sonnet-4-6"

client = Anthropic(api_key=ANTHROPIC_KEY)

# ── Token health ──────────────────────────────────────────────────────────────

WARN_DAYS = 14  # warn when token expires within this many days

def check_fb_token() -> bool:
    """
    Validates FB_PAGE_ACCESS_TOKEN via /debug_token.
    - Exits (returns False) if token is invalid or expired.
    - Prints a warning if token expires within WARN_DAYS days.
    - Returns True if token is healthy.
    """
    if not FB_PAGE_TOKEN:
        print("ERROR: FB_PAGE_ACCESS_TOKEN not set.")
        return False

    resp = requests.get(
        f"{FB_GRAPH_URL}/debug_token",
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
        from datetime import datetime, timezone
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
    """Available only, not yet posted, has real CDN images, newest first."""
    candidates = [
        v for v in vehicles
        if v.get("status") == "available"
        and v.get("vin") not in posted
        and any(img.startswith("http") for img in (v.get("images") or []))
    ]
    candidates.sort(key=lambda v: v.get("updated_at", ""), reverse=True)
    return candidates[:limit]

# ── Post generation ───────────────────────────────────────────────────────────

def _fmt_price(val) -> str:
    return f"${int(val):,}" if isinstance(val, (int, float)) else str(val)

def _fmt_km(val) -> str:
    return f"{int(val):,} km" if isinstance(val, (int, float)) else str(val)


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

Write ONE Facebook post. Rules:

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

# ── Facebook ──────────────────────────────────────────────────────────────────

def post_to_facebook(message: str, link: str, image_urls: list[str]) -> bool:
    if len(image_urls) == 1:
        # Single photo post with caption
        resp = requests.post(
            f"{FB_GRAPH_URL}/{FB_PAGE_ID}/photos",
            data={
                "url":          image_urls[0],
                "caption":      message,
                "access_token": FB_PAGE_TOKEN,
            },
            timeout=30,
        )
        result = resp.json()
        if "id" in result:
            print(f"  Published: https://www.facebook.com/{result['id']}")
            return True
        err = result.get("error", {})
        print(f"  Failed [{err.get('code', '?')}]: {err.get('message', result)}")
        return False

    elif len(image_urls) > 1:
        # Multi-photo post: upload each as unpublished, then attach to a single feed post
        media_ids = []
        for img_url in image_urls:
            r = requests.post(
                f"{FB_GRAPH_URL}/{FB_PAGE_ID}/photos",
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
                print(f"  Warning: could not upload photo {img_url} [{err.get('code', '?')}]: {err.get('message', r_json)}")

        if not media_ids:
            print("  Failed: no photos uploaded successfully")
            return False

        attached = json.dumps([{"media_fbid": mid} for mid in media_ids])
        resp = requests.post(
            f"{FB_GRAPH_URL}/{FB_PAGE_ID}/feed",
            data={
                "message":        message,
                "attached_media": attached,
                "access_token":   FB_PAGE_TOKEN,
            },
            timeout=30,
        )
        result = resp.json()
        if "id" in result:
            print(f"  Published ({len(media_ids)} photos): https://www.facebook.com/{result['id']}")
            return True
        err = result.get("error", {})
        print(f"  Failed [{err.get('code', '?')}]: {err.get('message', result)}")
        return False

    else:
        # No images — text post with link attachment
        resp = requests.post(
            f"{FB_GRAPH_URL}/{FB_PAGE_ID}/feed",
            data={
                "message":      message,
                "link":         link,
                "access_token": FB_PAGE_TOKEN,
            },
            timeout=30,
        )
        result = resp.json()
        if "id" in result:
            print(f"  Published: https://www.facebook.com/{result['id']}")
            return True
        err = result.get("error", {})
        print(f"  Failed [{err.get('code', '?')}]: {err.get('message', result)}")
        return False

# ── Main ──────────────────────────────────────────────────────────────────────

def run(dry_run: bool = True, limit: int = POSTS_PER_RUN) -> None:
    print(f"\nRoadHouse Motors Social Manager")
    print(f"Mode : {'DRY RUN — preview only' if dry_run else 'LIVE — posting to Facebook'}")
    print(f"Time : {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print()

    # Guard
    if not CRON_SECRET:
        print("ERROR: CRON_SECRET not set in .env")
        return
    if not ANTHROPIC_KEY:
        print("ERROR: ANTHROPIC_API_KEY not set in .env")
        return
    if not dry_run:
        print("Checking FB token...")
        if not check_fb_token():
            return
        print()

    # Fetch inventory
    print("Fetching inventory...")
    try:
        vehicles = fetch_inventory()
    except Exception as e:
        print(f"ERROR: Could not fetch feed — {e}")
        return
    print(f"  {len(vehicles)} vehicles in feed")

    posted = load_posted()
    picks  = pick_vehicles(vehicles, posted, limit)

    if not picks:
        print("  Nothing new to post — all available inventory already in posted.json.")
        print("  Run with --reset to clear history and start fresh.")
        return

    print(f"  {len(picks)} selected\n")

    # Generate and post
    newly_posted: dict = {}

    for i, v in enumerate(picks, 1):
        vin       = v["vin"]
        title     = f"{v.get('year')} {v.get('make')} {v.get('model')} {v.get('trim', '')}".strip()
        url       = v.get("url", "https://motors.roadhouse.capital")
        price     = _fmt_price(v.get("price_cad"))
        km        = _fmt_km(v.get("mileage_km"))
        images      = [img for img in (v.get("images") or []) if img.startswith("http")]
        # Skip images[0] — O'Brian's first gallery shot is the branded hero overlay.
        # images[1:4] are the clean exterior/interior photos from the same batch (up to 3).
        post_images = images[1:4] if len(images) > 1 else (images[:1] if images else [])

        print(f"[{i}/{len(picks)}] {title}")
        print(f"  VIN: {vin}  |  {price} CAD  |  {km}")
        print(f"  Images: {len(post_images)} ({', '.join(post_images) or 'none'})")

        print("  Generating post...")
        try:
            post_text = generate_post(v)
        except Exception as e:
            print(f"  ERROR: Claude generation failed — {e}\n")
            continue

        print()
        print("  --- POST PREVIEW " + "-" * 40)
        for line in post_text.splitlines():
            print(f"  | {line}")
        print(f"  |")
        print(f"  | [link: {url}]")
        print("  " + "-" * 57)
        print()

        if dry_run:
            newly_posted[vin] = {
                "title": title,
                "posted_at": None,
                "dry_run": True,
            }
        else:
            success = post_to_facebook(post_text, url, post_images)
            newly_posted[vin] = {
                "title": title,
                "posted_at": datetime.now(timezone.utc).isoformat() if success else None,
                "dry_run": False,
                "success": success,
            }

    # Persist
    posted.update(newly_posted)
    save_posted(posted)

    if dry_run:
        print(f"Dry run complete. {len(newly_posted)} post(s) previewed and logged to posted.json.")
        print("Run with --live when ready to publish.")
    else:
        ok = sum(1 for r in newly_posted.values() if r.get("success"))
        print(f"Done. {ok}/{len(picks)} post(s) published to Facebook.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="RoadHouse Motors Facebook Social Manager")
    parser.add_argument(
        "--live",
        action="store_true",
        help="Publish posts to Facebook (default is dry run)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=POSTS_PER_RUN,
        help=f"Max posts per run (default: {POSTS_PER_RUN})",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Clear posted.json history and start fresh",
    )
    args = parser.parse_args()

    if args.reset:
        if POSTED_FILE.exists():
            POSTED_FILE.unlink()
            print("posted.json cleared.\n")
        else:
            print("posted.json not found — nothing to clear.\n")

    run(dry_run=not args.live, limit=args.limit)
