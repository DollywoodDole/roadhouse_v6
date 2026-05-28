"""
RoadHouse Motors — FCAA Compliance Linter
------------------------------------------
Scans generated post text for patterns that violate Saskatchewan's FCAA
(Financial and Consumer Affairs Authority) dealer advertising rules.

Usage:
    from compliance import lint
    violations = lint(text)  # returns [] if clean
"""

import re
from typing import List


# ── Banned patterns ────────────────────────────────────────────────────────────
# Case-insensitive, word-boundary matched.
# Each entry is (pattern, human_label) for readable violation messages.

BANNED_PHRASES: List[tuple[str, str]] = [
    (r"\bbest price\b",       "superlative: 'best price'"),
    (r"\blowest price\b",     "superlative: 'lowest price'"),
    (r"\bcheapest\b",         "superlative: 'cheapest'"),
    (r"\bunbeatable\b",       "superlative: 'unbeatable'"),
    (r"\bact now\b",          "urgency: 'act now'"),
    (r"\blimited time\b",     "urgency: 'limited time'"),
    (r"\bdon['\u2018\u2019]?t miss\b", "urgency: 'don't miss'"),
    (r"\bhurry\b",            "urgency: 'hurry'"),
    (r"\bguaranteed\b",       "unsubstantiated claim: 'guaranteed'"),
    (r"\bcertified\b",        "unsubstantiated claim: 'certified' (only allowed if vehicle data confirms)"),
    (r"\bwon['\u2018\u2019]?t last\b", "urgency: 'won\u2019t last'"),
    (r"\bgoing fast\b",       "urgency: 'going fast'"),
]

BANNED_FINANCIAL: List[tuple[str, str]] = [
    (
        r"\$\d[\d,]*\s*/\s*(mo|month|wk|week|bi[\s\-]?weekly)\b",
        "financing claim: monthly/weekly payment quoted without full disclosure",
    ),
    (
        r"\b\d+(\.\d+)?\s*%\s*(apr|interest|financing)\b",
        "financing claim: interest/APR rate quoted",
    ),
    (
        r"\$0\s+down\b",
        "financing claim: '$0 down' without full disclosure",
    ),
]

_ALL_PATTERNS = BANNED_PHRASES + BANNED_FINANCIAL


def lint(text: str) -> List[str]:
    """
    Scan *text* for FCAA advertising violations.

    Returns a list of human-readable violation strings.
    Returns an empty list if the text is compliant.
    """
    violations: List[str] = []
    for pattern, label in _ALL_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            # Find the matched substring for context
            m = re.search(pattern, text, re.IGNORECASE)
            snippet = m.group(0) if m else ""
            violations.append(f"{label} (matched: {snippet!r})")
    return violations
