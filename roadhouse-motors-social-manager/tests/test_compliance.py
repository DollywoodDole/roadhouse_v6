"""
Unit tests for compliance.lint()

Run from roadhouse-motors-social-manager/:
    venv/Scripts/python -m pytest tests/test_compliance.py -v
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from compliance import lint


# ── Positive cases — MUST flag ─────────────────────────────────────────────────

class TestBannedPhrases:
    def test_best_price(self):
        assert lint("We have the best price on this F-150.") != []

    def test_lowest_price(self):
        assert lint("Lowest price in Saskatchewan — guaranteed.") != []

    def test_cheapest(self):
        assert lint("The cheapest way to get into a pickup truck.") != []

    def test_unbeatable(self):
        assert lint("Unbeatable value on this CR-V.") != []

    def test_act_now(self):
        assert lint("Act now before it's gone.") != []

    def test_limited_time(self):
        assert lint("Limited time offer on all SUVs.") != []

    def test_dont_miss_straight_apostrophe(self):
        assert lint("Don't miss this deal on the Equinox.") != []

    def test_dont_miss_curly_apostrophe(self):
        assert lint("Don\u2019t miss your chance on this Tacoma.") != []

    def test_hurry(self):
        assert lint("Hurry in today — this one won't stick around.") != []

    def test_guaranteed(self):
        assert lint("Guaranteed approval on financing.") != []

    def test_certified(self):
        assert lint("Certified pre-owned condition.") != []

    def test_wont_last_straight_apostrophe(self):
        assert lint("This RAV4 won't last at this price.") != []

    def test_wont_last_curly_apostrophe(self):
        assert lint("Won\u2019t last long — only one in stock.") != []

    def test_going_fast(self):
        assert lint("These Silverados are going fast.") != []

    def test_case_insensitive(self):
        assert lint("BEST PRICE guaranteed, ACT NOW!") != []


class TestBannedFinancial:
    def test_monthly_payment_slash_mo(self):
        assert lint("Own it for $399/mo with approved credit.") != []

    def test_monthly_payment_slash_month(self):
        assert lint("Only $499/month OAC.") != []

    def test_weekly_payment(self):
        assert lint("$199/wk with zero hassle.") != []

    def test_biweekly_payment_hyphen(self):
        assert lint("As low as $250/bi-weekly.") != []

    def test_apr_rate(self):
        assert lint("Financing available at 5.99% APR.") != []

    def test_interest_rate(self):
        assert lint("3.9% interest on all inventory.") != []

    def test_zero_down(self):
        assert lint("Drive away for $0 down today.") != []

    def test_multiple_violations_returns_all(self):
        text = "Best price guaranteed! Only $299/mo. Act now!"
        violations = lint(text)
        assert len(violations) >= 3, f"Expected 3+ violations, got {len(violations)}: {violations}"


# ── Negative cases — MUST NOT flag ────────────────────────────────────────────

class TestCleanText:
    def test_clean_standard_post(self):
        text = (
            "2022 Honda CR-V EX-L AWD — Platinum White Pearl, 85,700 km, automatic. "
            "Leather, sunroof, heated seats. Priced at $36,800. "
            "Saskatchewan delivery available. Full listing: motors.roadhouse.capital/vehicle/123\n\n"
            "DL#331386 | (306) 381-8222 | Prices exclude taxes & licensing"
        )
        assert lint(text) == []

    def test_price_without_payment_terms(self):
        # Dollar amount is fine — just can't be broken into payments without disclosure
        assert lint("Priced at $28,999 CAD.") == []

    def test_certification_not_certified(self):
        # "certification" contains "certif" but \bcertified\b should not match
        assert lint("Full service certification on file.") == []

    def test_guarantee_not_guaranteed(self):
        # "guarantee" is not "guaranteed"
        assert lint("We stand behind every vehicle with a satisfaction guarantee.") == []

    def test_zero_price_not_zero_down(self):
        # "$0" in different context
        assert lint("No hidden fees. $0 markup on dealer cost.") == []

    def test_going_in_different_context(self):
        # "going" alone should not trigger "going fast"
        assert lint("Saskatchewan delivery going across the province.") == []

    def test_standard_closing_line(self):
        assert lint("DL#331386 | (306) 381-8222 | Prices exclude taxes & licensing") == []

    def test_empty_string(self):
        assert lint("") == []
