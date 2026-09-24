# TOC & Alkalinity Prediction Viewer — Team Five Non-Claudes

Scenario 1 for the [Design Storm 2026](../../../README.md) challenge: a purpose-built web
app that shows the upstream signals behind a prediction of TOC and alkalinity arriving
at Denver Water's Foothills treatment plant, lets you change the forecast lead time
with a slider, and displays a simple, explainable model's prediction against the actual
lab values.

The model is a single-feature linear regression fitted **live in the browser**. Move
the lead-time slider and it re-fits and re-scores instantly, so an audience can watch
the trade between warning time and accuracy in real time.

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

The app runs fully offline off the bundled `series.json`. If you happen to be online,
a small badge in the header shows the latest live USGS reading at the upstream gage;
if you are not, it quietly says so and nothing else changes.

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
  selectable, along with a few others.
- **Lead time (lag)**: the predictor is shifted forward N days, so the model learns
  "the river N days ago → the plant today". Defaults are 2 days for TOC, 4 for
  alkalinity, matching Jake's notebooks.
- **Honest scoring**: trained on the earlier half of the timeline, scored on the later
  half it never saw, no shuffling. R² of 0 means no better than guessing the average.

## On-stage script (about a minute)

1. "Denver Water only learns TOC and alkalinity after the water reaches the plant — a
   lab runs a grab sample. We're trying to see it coming a few days out from cheap
   upstream sensors."
2. "Here's TOC. The orange line is what the lab actually measured. The dashed blue line
   is a one-variable model: TOC from turbidity times flow, the muddy-high-water signal,
   measured two days upstream." Point at the train/test divider: "it only learned from
   the left; everything right of the line is the honest test."
3. Read the formula and the test R² aloud. "One number, one line — and it already
   tracks the big spring peaks."
4. Drag the lead-time slider. "More lead time for the operators costs some accuracy —
   watch the score move. That trade is the whole question Denver Water put to us."
5. Toggle to Alkalinity. "Different signal — specific conductance, dissolved minerals —
   and a straight line explains about half the variation on its own."
6. Gesture at the upstream-signals panel. "These are the things that arrive before the
   water does. The one outlined in blue is what's driving the prediction right now."

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
