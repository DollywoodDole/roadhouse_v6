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
import json
import argparse
import requests
from datetime import datetime, timezone
from pathlib import Path
from anthropic import Anthropic
from dotenv import load_dotenv

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
    """Available only, not yet posted, newest first."""
    candidates = [
        v for v in vehicles
        if v.get("status") == "available" and v.get("vin") not in posted
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

    prompt = f"""You are the social media voice for RoadHouse Motors — a Saskatchewan-based used vehicle dealership.

Vehicle:
{details}

Brand voice: Direct. Unfiltered. High-standard. No filler, no hype, no urgency tactics. "Where Standards Matter."

Write ONE Facebook post. Rules:
- Lead with the vehicle itself, not a hook or gimmick
- Saskatchewan delivery available is worth mentioning
- Include the listing URL naturally (not as a separate line)
- Close the post on its own line with exactly: DL#331386 | (306) 381-8222
- 200–320 characters for the body (not counting the closing line)
- 1–2 emojis max, only where they feel natural — none is fine too
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

def post_to_facebook(message: str, link: str) -> bool:
    resp = requests.post(
        f"{FB_GRAPH_URL}/{FB_PAGE_ID}/feed",
        data={
            "message": message,
            "link": link,
            "access_token": FB_PAGE_TOKEN,
        },
        timeout=30,
    )
    result = resp.json()
    if "id" in result:
        post_id = result["id"]
        print(f"  Published: https://www.facebook.com/{post_id}")
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
    if not dry_run and not FB_PAGE_TOKEN:
        print("ERROR: FB_PAGE_ACCESS_TOKEN not set in .env — required for live posting")
        print("       See .env.example for instructions on getting your token.")
        return

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
        vin   = v["vin"]
        title = f"{v.get('year')} {v.get('make')} {v.get('model')} {v.get('trim', '')}".strip()
        url   = v.get("url", "https://motors.roadhouse.capital")
        price = _fmt_price(v.get("price_cad"))
        km    = _fmt_km(v.get("mileage_km"))

        print(f"[{i}/{len(picks)}] {title}")
        print(f"  VIN: {vin}  |  {price} CAD  |  {km}")

        print("  Generating post...")
        try:
            post_text = generate_post(v)
        except Exception as e:
            print(f"  ERROR: Claude generation failed — {e}\n")
            continue

        print()
        print("  ┌─ POST PREVIEW " + "─" * 40)
        for line in post_text.splitlines():
            print(f"  │ {line}")
        print(f"  │")
        print(f"  │ [link attachment: {url}]")
        print("  └" + "─" * 55)
        print()

        if dry_run:
            newly_posted[vin] = {
                "title": title,
                "posted_at": None,
                "dry_run": True,
            }
        else:
            success = post_to_facebook(post_text, url)
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
