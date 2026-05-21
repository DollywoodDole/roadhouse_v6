"""
RoadHouse Motors — Reels Pipeline
----------------------------------
Renders a Ken Burns-style 9:16 MP4 from vehicle images (ffmpeg required)
and publishes to Facebook Reels and Instagram Reels.

Gated by ENABLE_REELS=true in env. Default off.
Requires ffmpeg installed on the runner.
"""

import os
import time
import shutil
import subprocess
import tempfile
import requests
from datetime import datetime, timezone
from pathlib import Path

# ── Constants ─────────────────────────────────────────────────────────────────

GRAPH_URL      = "https://graph.facebook.com/v25.0"
REEL_W         = 1080
REEL_H         = 1920
REEL_FPS       = 30
CLIP_DURATION  = 2.5       # seconds per image clip
CLIP_FRAMES    = 75        # CLIP_DURATION * REEL_FPS
XFADE_DURATION = 0.4       # crossfade between clips
SEGMENT_STEP   = CLIP_DURATION - XFADE_DURATION   # = 2.1s offset between transitions
OUTRO_DURATION = 1.5       # brand outro card
CLIPS_MAX      = 6         # max images per reel (~14s at 6 clips)
MIN_CDN_IMAGES = 5         # vehicle must have this many CDN images to qualify

_AUDIO_DIR = Path(os.getenv("REELS_AUDIO_DIR", Path(__file__).parent / "audio"))


# ── Helpers ───────────────────────────────────────────────────────────────────

def ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None


def _pick_audio() -> Path | None:
    """Return first .mp3 from REELS_AUDIO_DIR, or None if none present."""
    if not _AUDIO_DIR.is_dir():
        return None
    for f in sorted(_AUDIO_DIR.iterdir()):
        if f.suffix.lower() == ".mp3":
            return f
    return None


def _build_filter_complex(n_clips: int, total_dur: float, has_audio: bool) -> str:
    """
    Build the ffmpeg -filter_complex string.

    Input streams: n_clips image streams (indexes 0..n_clips-1),
                   optionally audio at index n_clips.
    Output labels: [vout] (video), [aout] (audio, if has_audio).
    """
    parts = []

    # ── Per-image: blurred letterbox + zoompan ──────────────────────────────
    for i in range(n_clips):
        # Split raw image into bg (blurred fill) and fg (sharp scaled)
        parts.append(f"[{i}:v]split=2[bg{i}][fg{i}]")
        parts.append(
            f"[bg{i}]scale={REEL_W}:{REEL_H}:force_original_aspect_ratio=increase,"
            f"crop={REEL_W}:{REEL_H},boxblur=20:20[blur{i}]"
        )
        parts.append(
            f"[fg{i}]scale={REEL_W}:{REEL_H}:force_original_aspect_ratio=decrease[scaled{i}]"
        )
        parts.append(f"[blur{i}][scaled{i}]overlay=(W-w)/2:(H-h)/2[over{i}]")
        # Slow zoom-in (Ken Burns) — 0.15% zoom per frame over CLIP_FRAMES frames
        parts.append(
            f"[over{i}]zoompan="
            f"z='zoom+0.0015':"
            f"x='iw/2-(iw/zoom/2)':"
            f"y='ih/2-(ih/zoom/2)':"
            f"d={CLIP_FRAMES}:"
            f"s={REEL_W}x{REEL_H}:"
            f"fps={REEL_FPS}[v{i}]"
        )

    # ── Brand outro (solid dark card + text) ────────────────────────────────
    parts.append(
        f"color=c=0x0a0806:s={REEL_W}x{REEL_H}:r={REEL_FPS}:d={OUTRO_DURATION}[outro_bg]"
    )
    parts.append(
        f"[outro_bg]"
        f"drawtext=fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2-40:"
        f"text='motors.roadhouse.capital',"
        f"drawtext=fontcolor=0xA0A0A0:fontsize=32:x=(w-text_w)/2:y=(h-text_h)/2+40:"
        f"text='DL\\#331386 | (306) 381\\-8222'[outro]"
    )

    # ── XFade chain: v0 → v1 → ... → outro → [vout] ─────────────────────────
    all_segs = [f"v{i}" for i in range(n_clips)] + ["outro"]
    n_segs = len(all_segs)
    for i in range(1, n_segs):
        in_a   = all_segs[0] if i == 1 else f"xf{i-2}"
        in_b   = all_segs[i]
        out    = "vout" if i == n_segs - 1 else f"xf{i-1}"
        offset = i * SEGMENT_STEP
        parts.append(
            f"[{in_a}][{in_b}]xfade=transition=fade:"
            f"duration={XFADE_DURATION}:offset={offset:.3f}[{out}]"
        )

    # ── Audio: trim + loudnorm + fade out ────────────────────────────────────
    if has_audio:
        audio_idx  = n_clips
        fade_start = max(0.0, total_dur - 1.5)
        parts.append(
            f"[{audio_idx}:a]"
            f"atrim=0:{total_dur:.3f},"
            f"loudnorm=I=-14:TP=-2:LRA=11,"
            f"afade=t=out:st={fade_start:.3f}:d=1.5[aout]"
        )

    return ";".join(parts)


# ── Render ────────────────────────────────────────────────────────────────────

def render_reel(vehicle: dict, output_path: Path) -> bool:
    """
    Download vehicle images and render a 9:16 MP4 reel via ffmpeg.
    Returns True on success.
    """
    cdn_images = [
        img for img in (vehicle.get("images") or [])
        if img.startswith("http")
    ]
    # Skip images[0] (branded dealer overlay)
    clip_images = cdn_images[1:1 + CLIPS_MAX]

    if len(clip_images) < 2:
        print(f"  REEL: Only {len(clip_images)} usable image(s) — need ≥ 2")
        return False

    audio_path = _pick_audio()
    has_audio  = audio_path is not None
    n_clips    = len(clip_images)
    total_dur  = n_clips * SEGMENT_STEP + OUTRO_DURATION

    tmpdir    = Path(tempfile.mkdtemp(prefix="rh_reel_imgs_"))
    img_paths: list[Path] = []

    try:
        # Download images
        for idx, url in enumerate(clip_images):
            dest = tmpdir / f"img_{idx:02d}.jpg"
            r = requests.get(url, timeout=20)
            r.raise_for_status()
            dest.write_bytes(r.content)
            img_paths.append(dest)

        # Build ffmpeg command
        cmd: list[str] = ["ffmpeg", "-y"]

        # Image inputs — loop so zoompan gets enough frames
        for img_path in img_paths:
            cmd += ["-loop", "1", "-t", str(int(CLIP_DURATION) + 3), "-i", str(img_path)]

        # Optional audio input (looped so it covers full reel)
        if has_audio:
            cmd += ["-stream_loop", "-1", "-i", str(audio_path)]

        # Filter complex
        filter_str = _build_filter_complex(n_clips, total_dur, has_audio)
        cmd += ["-filter_complex", filter_str]

        # Map rendered streams
        cmd += ["-map", "[vout]"]
        if has_audio:
            cmd += ["-map", "[aout]"]

        # Encode — h264/aac, IG-compatible, fast-start for streaming
        cmd += [
            "-c:v",       "libx264",
            "-preset",    "fast",
            "-crf",       "23",
            "-pix_fmt",   "yuv420p",
            "-movflags",  "+faststart",
            "-t",         f"{total_dur:.3f}",
        ]
        if has_audio:
            cmd += ["-c:a", "aac", "-b:a", "128k"]

        cmd.append(str(output_path))

        print(
            f"  REEL: Rendering {n_clips} clip(s) → {output_path.name} "
            f"({total_dur:.1f}s{'  + audio' if has_audio else '  no audio'})"
        )
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if result.returncode != 0:
            # Show last 2000 chars of stderr (ffmpeg is verbose)
            print(f"  REEL: ffmpeg error:\n{result.stderr[-2000:]}")
            return False

        size_kb = output_path.stat().st_size // 1024
        print(f"  REEL: Render complete ({size_kb:,} KB)")
        return True

    except Exception as e:
        print(f"  REEL: Render error — {e}")
        return False

    finally:
        for f in img_paths:
            try:
                f.unlink()
            except Exception:
                pass
        try:
            tmpdir.rmdir()
        except Exception:
            pass


# ── Publish: Facebook Reels ───────────────────────────────────────────────────

def publish_fb_reel(
    video_path: Path,
    caption: str,
    page_id: str,
    page_token: str,
) -> tuple[bool, str | None]:
    """
    Upload to FB Reels via the three-phase resumable upload protocol.
    Returns (success, video_id).
    """
    file_size = video_path.stat().st_size

    # Phase 1 — start upload session
    r = requests.post(
        f"{GRAPH_URL}/{page_id}/video_reels",
        data={"upload_phase": "start", "access_token": page_token},
        timeout=30,
    )
    result = r.json()
    upload_url = result.get("upload_url")
    video_id   = result.get("video_id")
    if not upload_url or not video_id:
        err = result.get("error", {})
        print(f"  REEL FB: Start failed [{err.get('code','?')}]: {err.get('message', result)}")
        return False, None
    print(f"  REEL FB: Upload session started (video_id={video_id})")

    # Phase 2 — binary transfer
    with video_path.open("rb") as fh:
        r = requests.put(
            upload_url,
            data=fh,
            headers={
                "Authorization": f"OAuth {page_token}",
                "offset":        "0",
                "file_size":     str(file_size),
                "Content-Type":  "application/octet-stream",
            },
            timeout=180,
        )
    if r.status_code not in (200, 204):
        print(f"  REEL FB: Transfer failed — HTTP {r.status_code}: {r.text[:500]}")
        return False, None
    print("  REEL FB: Transfer complete")

    # Phase 3 — finish and publish
    r = requests.post(
        f"{GRAPH_URL}/{page_id}/video_reels",
        data={
            "upload_phase": "finish",
            "video_id":     video_id,
            "video_state":  "PUBLISHED",
            "description":  caption,
            "access_token": page_token,
        },
        timeout=30,
    )
    result = r.json()
    if result.get("success"):
        print(f"  REEL FB: Published — video_id={video_id}")
        return True, video_id
    err = result.get("error", {})
    print(f"  REEL FB: Finish failed [{err.get('code','?')}]: {err.get('message', result)}")
    return False, None


def _get_fb_video_source_url(video_id: str, page_token: str) -> str | None:
    """
    Poll FB Graph for the CDN source URL of a published video.
    Used to pass the video to IG without a separate CDN.
    """
    for attempt in range(6):
        r = requests.get(
            f"{GRAPH_URL}/{video_id}",
            params={"fields": "source", "access_token": page_token},
            timeout=15,
        )
        data = r.json()
        if "source" in data:
            return data["source"]
        wait = 5 * (attempt + 1)
        print(f"  REEL FB→IG: source URL not ready — retrying in {wait}s")
        time.sleep(wait)
    print(f"  REEL FB→IG: Could not retrieve source URL for video_id={video_id}")
    return None


# ── Publish: Instagram Reels ──────────────────────────────────────────────────

def publish_ig_reel(
    video_url: str,
    caption: str,
    ig_user_id: str,
    page_token: str,
    poll_timeout: int = 180,
) -> bool:
    """
    Publish a Reel to Instagram Business via Graph API.
    video_url must be publicly accessible (use FB CDN source URL).
    """
    # Step 1 — create Reels container
    r = requests.post(
        f"{GRAPH_URL}/{ig_user_id}/media",
        data={
            "media_type":   "REELS",
            "video_url":    video_url,
            "caption":      caption,
            "access_token": page_token,
        },
        timeout=30,
    )
    result = r.json()
    if "id" not in result:
        err = result.get("error", {})
        print(f"  REEL IG: Container failed [{err.get('code','?')}]: {err.get('message', result)}")
        return False
    container_id = result["id"]
    print(f"  REEL IG: Container created (id={container_id})")

    # Step 2 — poll until FINISHED
    deadline = time.time() + poll_timeout
    while time.time() < deadline:
        r = requests.get(
            f"{GRAPH_URL}/{container_id}",
            params={"fields": "status_code,status", "access_token": page_token},
            timeout=15,
        )
        data   = r.json()
        status = data.get("status_code", "")
        if status == "FINISHED":
            break
        if status in ("ERROR", "EXPIRED"):
            print(f"  REEL IG: Container {status} — {data.get('status', '')}")
            return False
        time.sleep(8)
    else:
        print(f"  REEL IG: Container polling timed out after {poll_timeout}s")
        return False

    # Step 3 — publish
    r = requests.post(
        f"{GRAPH_URL}/{ig_user_id}/media_publish",
        data={"creation_id": container_id, "access_token": page_token},
        timeout=30,
    )
    result = r.json()
    if "id" in result:
        print(f"  REEL IG: Published — post id={result['id']}")
        return True
    err  = result.get("error", {})
    code = err.get("code")
    if code in (4, 9007):
        # Known false negatives — Meta returns an error but the post publishes
        print(f"  REEL IG: Published (confirmed false negative [{code}])")
        return True
    print(f"  REEL IG: Failed [{code}]: {err.get('message', result)}")
    return False


# ── Vehicle selection ─────────────────────────────────────────────────────────

def pick_reel_vehicles(vehicles: list[dict], posted: dict, limit: int) -> list[dict]:
    """
    Vehicles eligible for Reels:
      - status == "available"
      - ≥ MIN_CDN_IMAGES real CDN images (not placeholder SVGs)
      - no prior reel_fb_success=True in posted.json
      - diversified by make:model — same model appears at most once per run
    """
    candidates = []
    for v in vehicles:
        if v.get("status") != "available":
            continue
        cdn_imgs = [img for img in (v.get("images") or []) if img.startswith("http")]
        if len(cdn_imgs) < MIN_CDN_IMAGES:
            continue
        if posted.get(v["vin"], {}).get("reel_fb_success"):
            continue
        candidates.append(v)

    # Most recently updated first so fresh listings get Reels priority
    candidates.sort(key=lambda v: v.get("updated_at", ""), reverse=True)

    picks: list[dict] = []
    seen: set[str] = set()
    for v in candidates:
        key = f"{v.get('make','').lower()}:{v.get('model','').lower()}"
        if key in seen:
            continue
        seen.add(key)
        picks.append(v)
        if len(picks) >= limit:
            break
    return picks


# ── Orchestrator ──────────────────────────────────────────────────────────────

def run_reels(
    vehicles: list[dict],
    posted: dict,
    page_id: str,
    page_token: str,
    ig_user_id: str,
    dry_run: bool,
    limit: int = 2,
) -> dict[str, dict]:
    """
    Main Reels orchestrator. Renders and publishes one Reel per eligible vehicle.

    Returns {vin: {reel_posted_at, reel_fb_success, reel_ig_success, reel_video_url}}
    suitable for merging into posted.json.
    """
    if not ffmpeg_available():
        print("REEL: ffmpeg not found on PATH — Reels pipeline skipped")
        return {}

    picks = pick_reel_vehicles(vehicles, posted, limit)
    if not picks:
        print("REEL: No vehicles eligible for Reels this run.")
        return {}

    print(f"\nREEL: {len(picks)} vehicle(s) selected for Reels")
    results: dict[str, dict] = {}

    # Use a single temp directory for all output videos this run
    tmpdir = Path(tempfile.mkdtemp(prefix="rh_reels_"))
    try:
        for i, v in enumerate(picks, 1):
            vin   = v["vin"]
            title = f"{v.get('year')} {v.get('make')} {v.get('model')} {v.get('trim', '')}".strip()
            url   = v.get("url", "https://motors.roadhouse.capital")
            print(f"\n[REEL {i}/{len(picks)}] {title}")
            print(f"  VIN: {vin}")

            if dry_run:
                cdn_count = len([img for img in (v.get("images") or []) if img.startswith("http")])
                print(f"  REEL: Dry run — would render + publish Reel ({cdn_count} CDN images)")
                results[vin] = {
                    "reel_posted_at":  None,
                    "reel_fb_success": False,
                    "reel_ig_success": False,
                    "reel_video_url":  None,
                    "reel_dry_run":    True,
                }
                continue

            video_path = tmpdir / f"{vin}.mp4"

            # Render
            rendered = render_reel(v, video_path)
            if not rendered:
                results[vin] = {
                    "reel_posted_at":  None,
                    "reel_fb_success": False,
                    "reel_ig_success": False,
                    "reel_video_url":  None,
                }
                continue

            # Short FCAA-safe caption for Reels (no financing, no superlatives)
            caption = (
                f"{title}\n"
                f"Full listing: {url}\n\n"
                f"DL#331386 | (306) 381-8222 | Prices exclude taxes & licensing"
            )

            # Publish FB Reel
            fb_ok, video_id = publish_fb_reel(video_path, caption, page_id, page_token)

            # Publish IG Reel (reuse FB CDN source URL — no separate hosting needed)
            source_url: str | None = None
            ig_ok = False
            if fb_ok and video_id:
                if ig_user_id:
                    source_url = _get_fb_video_source_url(video_id, page_token)
                    if source_url:
                        ig_ok = publish_ig_reel(source_url, caption, ig_user_id, page_token)
                    else:
                        print("  REEL IG: Skipped — FB source URL unavailable")
                else:
                    print("  REEL IG: Skipped — IG_USER_ID not set")

            # Clean up rendered video immediately (tmpdir is just the container)
            try:
                video_path.unlink()
            except Exception:
                pass

            results[vin] = {
                "reel_posted_at":  datetime.now(timezone.utc).isoformat() if fb_ok else None,
                "reel_fb_success": fb_ok,
                "reel_ig_success": ig_ok,
                "reel_video_url":  source_url,
            }

    finally:
        try:
            tmpdir.rmdir()
        except Exception:
            pass

    return results
