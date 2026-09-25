# TOC & Alkalinity Prediction Viewer — Team Five Non-Claudes

Scenario 1 for the [Design Storm 2026](../../../README.md) challenge: a purpose-built web
app that predicts TOC and alkalinity arriving at Denver Water's Foothills treatment
plant from upstream signals. The model is a single-feature linear regression fitted
**live in the browser**.

The app has two tabs:

- **Live forecast** — the operator-facing view. It pulls *current* upstream conditions
  from public feeds, forecasts TOC and alkalinity for the next 1-7 days, checks each
  against an adjustable operating threshold, and states plainly what's coming. It
  answers the sketch's two questions ("do I need to change chemicals / request an
  upstream change?") descriptively — it never prescribes dosing, which stays the
  operator's call.
- **Explorer** — the analysis view. Pick a target, a feature, and a lead time (lag)
  and watch the model re-fit and re-score against the historical lab values, so you
  can judge which signals and lead times actually predict well. Includes the
  upstream-gage-vs-Strontia-sonde comparison.

### Live data sources (keyless, CORS-open)

The Live forecast tab fetches these in the browser; each falls back to the last
archived value if offline:

| Signal | Source |
|---|---|
| Turbidity, conductance | USGS IV, gage 06707525 (params 63680, 00095) |
| Streamflow | USGS IV, gage 06701900 (param 00060 — the WQ gage publishes no flow) |
| Snowpack SWE | NRCS SNOTEL, Hoosier Pass (531:CO:SNTL, WTEQ) |

### Thresholds

Adjustable in the Live forecast tab. Defaults: TOC ≥ 3 mg/L (a demo "elevated" cutoff,
not a regulatory limit) and alkalinity ≤ 60 mg/L (Jake's low-alkalinity line). Denver
Water's own guide questions whether 60 is the number operators act on, so it's editable.

## Stack

- Vite + React front end.
- Recharts for charts.
- Vitest for the JS logic and components.
- A one-time Python precompute step (`precompute.py`) that turns the repo's CSVs into a
  single bundled `series.json` the app loads offline.

## Running it

```
# 1. From this folder, build the bundled data once (reads ../../../data/*.csv):
python3 precompute.py

# 2. Install and run the app:
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173/). `npm run build`
produces a static bundle in `dist/`; `npm run preview` serves that bundle.

The Explorer tab runs fully offline off the bundled `series.json`. The Live forecast
tab fetches current readings when online and falls back to the last archived value per
signal when not, labeling each as "live" or "archived" so nothing is misrepresented.

## Tests

```
npm test            # JS: data layer, features, regression, formatting, components
python3 test_precompute.py   # checks the generated series.json (run precompute first)
```

## How it works

```
../../../data/*.csv
      │  precompute.py  (once, offline; normalizes dates, drops the dirty DWR precip,
      │                  prefers Hoosier Pass snow, keeps gaps as gaps)
      ▼
public/series.json   {t, v} arrays per series, bundled into the app
      │  loadSeries + alignByDate            (src/lib/dataLayer.js)
      ▼
align by date → shift the predictor by N days → pair (feature, target)   (src/lib/features.js)
      │  fit y = a·x + b on the earlier half, score on the later half     (src/lib/regression.js)
      ▼
predicted-vs-actual chart + formula + R²/RMSE/MAE   (src/components/*)
```

- **Target**: TOC or alkalinity at the Foothills influent (the lab values).
- **Feature**: for TOC, turbidity × flow (the "loading" term the guide flags as the
  strongest single TOC predictor); for alkalinity, specific conductance. Both are
  selectable, along with a few others — including the **Strontia profiling sonde**
  (near-surface turbidity and conductivity), the closer-in sensor Cassidi starred.
- **Upstream gage vs Strontia sonde**: a comparison card contrasts the two sources for
  the current target. The upstream gage gives days of warning; the sonde sits at the
  plant intake and gives hours. The sonde only covers one partial 2026 season, so the
  card leads with that caveat rather than declaring a winner — the point is the
  lead-time-vs-proximity trade, and that more sonde data is needed to judge it.
- **Lead time (lag)**: the predictor is shifted forward N days, so the model learns
  "the river N days ago → the plant today". Defaults are 2 days for TOC, 4 for
  alkalinity, matching Jake's notebooks.
- **Honest scoring**: trained on the earlier half of the timeline, scored on the later
  half it never saw, no shuffling. R² of 0 means no better than guessing the average.

## On-stage script (about two minutes)

**Live forecast tab (the operator's view):**

1. "Denver Water only learns TOC and alkalinity after the water reaches the plant — a
   lab runs a grab sample. We're trying to see it coming a few days out from cheap
   upstream sensors."
2. Point at the current-conditions row. "This is the South Platte right now — turbidity,
   flow, conductance, snowpack, pulled live from USGS and NRCS." (If offline: "here it's
   showing the last archived day, labeled as such.")
3. Point at the recommendation card and the two threshold charts. "From today's reading
   the model projects TOC and alkalinity out seven days and checks each against the
   operating threshold. The card says, in plain language, whether and when we cross it —
   that's the heads-up an operator wants. It describes what's coming; it doesn't tell
   them what to dose."
4. Nudge a threshold. "Denver Water asks whether 60 is really the number they act on —
   so it's adjustable, and the recommendation updates."

**Explorer tab (how good is the model, really):**

5. "Here's TOC over four years. The orange line is what the lab actually measured. The
   dashed blue line is that same one-variable model." Point at the train/test divider:
   "it only learned from the left; everything right of the line is the honest test."
6. Read the formula and the test R² aloud. "One number, one line — and it already
   tracks the big spring peaks."
7. Drag the lead-time slider. "More lead time for the operators costs some accuracy —
   watch the score move. That trade is the whole question Denver Water put to us."
8. Toggle to Alkalinity. "Different signal — specific conductance, dissolved minerals —
   and a straight line explains about half the variation on its own."
9. Gesture at the upstream-signals panel. "These are the things that arrive before the
   water does. The one outlined in blue is what's driving the prediction right now."
10. Drop to the comparison card. "Cassidi starred one idea: the reservoir sonde, which
   sits right at the plant intake. It should be a sharper signal — but it buys you
   hours of warning instead of days, and we only have one partial season of it. So the
   honest answer is 'promising, go collect more,' not 'it wins.'"

## Known limitations (honest for the booth)

- One feature, one straight line, by design — it is the explainable baseline, not a
  finished forecaster. Jake's random forest / CatBoost do better and are documented in
  the repo's [`guide.md`](../../../guide.md).
- The data is **provisional**: USGS publishes immediately and revises later, so a live
  pull can differ from the bundled file, and a forecast inherits that.
- TOC is genuinely nonlinear; a single line catches the peaks but is unstable
  elsewhere. Alkalinity is the steadier of the two.

## Data terms

This app is built on data Denver Water provided. Their terms travel with it and with
anything derived from it:

> The water quality data is provided "as is." Water quality data provided to the user
> is provisional and subject to change, and the user should not assume that the data
> has undergone any quality assurance or quality control review. Denver Water makes no
> warranty of any kind, express or implied, concerning the data, including accuracy,
> reliability, completeness, timeliness, or usefulness.
> Copyright 2026, Denver Water. https://www.denverwater.org/about-us/how-we-operate/public-records

See [`data/TERMS.md`](../../../data/TERMS.md) for the full notices. Data from USGS, Colorado
DWR, USDA NRCS, and NOAA is public domain.
