"""
RoadHouse Motors — Image Watermarking
--------------------------------------
Downloads vehicle images and composites the RoadHouse logo in the
bottom-right corner before posting to Facebook and Instagram.

Requires Pillow (pip install Pillow).
"""

import io
import requests
from pathlib import Path
from PIL import Image

# Logo lives in the repo's public assets — works both locally and on the runner
LOGO_PATH         = Path(__file__).parent.parent / "public" / "motors" / "rh-logo.png"
LOGO_WIDTH_RATIO  = 0.18   # logo = 18% of image width (matches website card watermark)
LOGO_OPACITY      = 0.30   # 30% opacity
LOGO_PADDING_RATIO = 0.025  # 2.5% padding from edges


def apply_watermark(img_bytes: bytes) -> bytes:
    """
    Composite the RH logo onto the bottom-right corner of an image.
    Returns JPEG bytes. Falls back to original bytes on any error.
    """
    if not LOGO_PATH.exists():
        return img_bytes
    try:
        img  = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
        logo = Image.open(LOGO_PATH).convert("RGBA")

        # Scale logo to LOGO_WIDTH_RATIO of the image width, preserve aspect
        logo_w = max(40, int(img.width * LOGO_WIDTH_RATIO))
        logo_h = int(logo.height * logo_w / logo.width)
        logo   = logo.resize((logo_w, logo_h), Image.LANCZOS)

        # Apply opacity to the logo's alpha channel
        r, g, b, a = logo.split()
        a    = a.point(lambda px: int(px * LOGO_OPACITY))
        logo = Image.merge("RGBA", (r, g, b, a))

        # Paste in bottom-right corner with padding
        pad = int(img.width * LOGO_PADDING_RATIO)
        x   = img.width  - logo_w - pad
        y   = img.height - logo_h - pad
        img.paste(logo, (x, y), logo)

        out = io.BytesIO()
        img.convert("RGB").save(out, format="JPEG", quality=90, optimize=True)
        return out.getvalue()

    except Exception:
        return img_bytes


def download_and_watermark(url: str, timeout: int = 20) -> bytes | None:
    """
    Download an image from a CDN URL and apply the RH watermark.
    Returns watermarked JPEG bytes, or None on download/network failure.
    """
    try:
        r = requests.get(url, timeout=timeout)
        r.raise_for_status()
        return apply_watermark(r.content)
    except Exception:
        return None
