#!/usr/bin/env python3
"""Precompute a single bundled series.json for the TOC & Alkalinity Prediction Viewer.

Reads Denver Water's original CSVs from ../../data/ (never modifying them) and emits
public/series.json, one entry per series, each a {"t": ISO-date, "v": number} array.
This lets the front end load everything offline and instantly.

Run once from the team folder:

    python3 precompute.py

Design notes:
- Two date formats appear in the source CSVs: M/D/YYYY and ISO YYYY-MM-DD. Both are
  normalized to ISO YYYY-MM-DD here.
- Snowpack uses HoosierPass.csv (guide.md: MichiganCreek.csv has a known bad patch,
  May 12-15 2026).
- The DWR Precip column is intentionally skipped (guide.md: dirty, running-total that
  resets). Precipitation comes from the NOAA station instead.
- Gaps stay gaps: days absent from a source (e.g. the Foothills Jan-Mar winter gap)
  are simply absent from that series. No interpolation, no zero-fill.
"""

import csv
import datetime as dt
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.normpath(os.path.join(HERE, "..", "..", "..", "data"))
OUT = os.path.join(HERE, "public", "series.json")


def iso(date_str):
    """Normalize a date cell to ISO YYYY-MM-DD, accepting M/D/YYYY or YYYY-MM-DD."""
    s = date_str.strip()
    if not s:
        return None
    for fmt in ("%m/%d/%Y", "%Y-%m-%d"):
        try:
            return dt.datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            continue
    raise ValueError(f"Unrecognized date format: {date_str!r}")


def num(cell):
    """Parse a numeric cell, returning None for blanks/non-numbers."""
    s = (cell or "").strip()
    if s == "":
        return None
    try:
        return float(s)
    except ValueError:
        return None


def read_series(filename, date_col, value_col):
    """Read one column from a CSV as a list of {t, v}, sorted by date, gaps dropped."""
    path = os.path.join(DATA, filename)
    rows = []
    with open(path, newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            t = iso(row[date_col])
            v = num(row.get(value_col))
            if t is None or v is None:
                continue
            rows.append({"t": t, "v": v})
    rows.sort(key=lambda r: r["t"])
    return rows


def main():
    series = {
        # Target: what we are predicting, from Denver Water's own lab.
        "toc": read_series("FoothillsInfluent.csv", "DATE", "TOC_mg_L"),
        "alk": read_series("FoothillsInfluent.csv", "DATE", "Alk_mg_L"),
        # Upstream USGS river sensor (site 06707525, above Strontia).
        "turbidity": read_series("USGS_South_Platte.csv", "Date", "Turbidity_Median"),
        "conductance": read_series("USGS_South_Platte.csv", "Date", "Specific_Cond_Mean"),
        "ph": read_series("USGS_South_Platte.csv", "Date", "pH_Median"),
        "water_temp": read_series("USGS_South_Platte.csv", "Date", "Temp_C_Mean"),
        "dissolved_oxygen": read_series("USGS_South_Platte.csv", "Date", "Dissolved_Oxygen_Mean"),
        # Streamflow from Colorado DWR.
        "flow": read_series("SouthPlatteFlow.csv", "measDate", "Flow_CFS"),
        # Snowpack (snow water equivalent) from SNOTEL, Hoosier Pass.
        "swe": read_series("HoosierPass.csv", "DATE", "SWE"),
        # Weather from the NOAA GHCN station.
        "precip": read_series("USC00058022.csv", "DATE", "PRCP"),
        "snow": read_series("USC00058022.csv", "DATE", "SNOW"),
        "air_tmax": read_series("USC00058022.csv", "DATE", "TMAX"),
        "air_tmin": read_series("USC00058022.csv", "DATE", "TMIN"),
    }

    meta = {
        "units": {
            "toc": "mg/L", "alk": "mg/L", "turbidity": "FNU",
            "conductance": "uS/cm", "ph": "pH", "water_temp": "degC",
            "dissolved_oxygen": "mg/L", "flow": "cfs", "swe": "in",
            "precip": "in", "snow": "in", "air_tmax": "degF", "air_tmin": "degF",
        },
        "labels": {
            "toc": "TOC (Foothills influent)",
            "alk": "Alkalinity (Foothills influent)",
            "turbidity": "Turbidity (upstream gage)",
            "conductance": "Specific conductance (upstream gage)",
            "ph": "pH (upstream gage)",
            "water_temp": "Water temperature (upstream gage)",
            "dissolved_oxygen": "Dissolved oxygen (upstream gage)",
            "flow": "Streamflow (South Platte)",
            "swe": "Snowpack SWE (Hoosier Pass)",
            "precip": "Precipitation (NOAA)",
            "snow": "Snowfall (NOAA)",
            "air_tmax": "Air temp max (NOAA)",
            "air_tmin": "Air temp min (NOAA)",
        },
        "sources": {
            "toc/alk": "FoothillsInfluent.csv (Denver Water lab)",
            "turbidity/conductance/ph/water_temp/dissolved_oxygen":
                "USGS_South_Platte.csv, USGS site 06707525",
            "flow": "SouthPlatteFlow.csv, Colorado DWR",
            "swe": "HoosierPass.csv, USDA NRCS SNOTEL (MichiganCreek.csv omitted: known bad patch)",
            "precip/snow/air_tmax/air_tmin": "USC00058022.csv, NOAA GHCN Daily",
        },
        "provisional_note": (
            "Water quality data is provisional and subject to change. USGS publishes "
            "immediately and revises later; a fresh API pull can differ from this file. "
            "Data provided by Denver Water; USGS, DWR, NRCS, NOAA data is public domain."
        ),
        "generated": dt.datetime.now().isoformat(timespec="seconds"),
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as fh:
        json.dump({"_meta": meta, "series": series}, fh, separators=(",", ":"))

    counts = {k: len(v) for k, v in series.items()}
    total = sum(counts.values())
    print(f"Wrote {OUT}")
    print(f"{len(series)} series, {total} points total")
    for k in sorted(counts):
        first = series[k][0]["t"] if series[k] else "-"
        last = series[k][-1]["t"] if series[k] else "-"
        print(f"  {k:18s} {counts[k]:5d} pts   {first} .. {last}")


if __name__ == "__main__":
    main()
