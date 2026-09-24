#!/usr/bin/env python3
"""Checks on the generated public/series.json. Run: python3 test_precompute.py

Verifies the invariants Task 2 promises: ISO dates, sorted, sane counts, and that the
Foothills winter gap (Jan-Mar) is preserved rather than interpolated.
"""

import datetime as dt
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "public", "series.json")


def fail(msg):
    print(f"FAIL: {msg}")
    sys.exit(1)


def main():
    if not os.path.exists(OUT):
        fail("public/series.json missing — run `python3 precompute.py` first")

    with open(OUT) as fh:
        doc = json.load(fh)

    series = doc["series"]

    # Every expected series is present and non-empty.
    expected = {
        "toc", "alk", "turbidity", "conductance", "ph", "water_temp",
        "dissolved_oxygen", "flow", "swe", "precip", "snow", "air_tmax", "air_tmin",
    }
    missing = expected - set(series)
    if missing:
        fail(f"missing series: {sorted(missing)}")
    for name, pts in series.items():
        if not pts:
            fail(f"series {name!r} is empty")

    # Dates are ISO YYYY-MM-DD and strictly sorted ascending, values numeric.
    for name, pts in series.items():
        prev = None
        for p in pts:
            try:
                d = dt.date.fromisoformat(p["t"])
            except ValueError:
                fail(f"{name}: non-ISO date {p['t']!r}")
            if prev is not None and d <= prev:
                fail(f"{name}: dates not strictly sorted at {p['t']}")
            prev = d
            if not isinstance(p["v"], (int, float)):
                fail(f"{name}: non-numeric value {p['v']!r} at {p['t']}")

    # Sanity: TOC and alkalinity are the target pair and should match in length.
    if len(series["toc"]) != len(series["alk"]):
        fail("toc and alk lengths differ; expected the same target dates")

    # The Foothills winter gap must be preserved: no Jan/Feb/Mar dates in the target.
    winter = [p["t"] for p in series["toc"] if p["t"][5:7] in ("01", "02", "03")]
    if winter:
        fail(f"toc has Jan-Mar dates that should be a gap: {winter[:3]}...")

    # Count sanity against the ~1,100 rows the guide describes.
    if not (1000 <= len(series["toc"]) <= 1200):
        fail(f"toc count {len(series['toc'])} outside expected ~1100 range")

    total = sum(len(v) for v in series.values())
    print(f"OK: {len(series)} series, {total} points, all dates ISO & sorted, "
          f"winter gap preserved, toc/alk aligned ({len(series['toc'])} each)")


if __name__ == "__main__":
    main()
