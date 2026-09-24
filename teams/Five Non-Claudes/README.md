# TOC & Alkalinity Prediction Viewer — Team Five Non-Claudes

Scenario 1 for the [Design Storm 2026](../../README.md) challenge: a purpose-built web
app that shows the upstream signals behind a prediction of TOC and alkalinity arriving
at Denver Water's Foothills treatment plant, lets you change the forecast lead time
with a slider, and displays a simple, explainable model's prediction against the actual
lab values.

## Stack

- Vite + React front end.
- Recharts for charts.
- Vitest for tests.
- A one-time Python precompute step (`precompute.py`) that turns the repo's CSVs into a
  single bundled `series.json` the app loads offline.

## Running it

```
# 1. From this folder, build the bundled data once (reads ../../data/*.csv):
python3 precompute.py

# 2. Install and run the app:
npm install
npm run dev
```

Then open the URL Vite prints. `npm run build` produces a static bundle; `npm run
preview` serves it.

## Tests

```
npm test
```

## Data terms

This app is built on data Denver Water provided. Their terms travel with it and with
anything derived from it:

> The water quality data is provided "as is." Water quality data provided to the user
> is provisional and subject to change, and the user should not assume that the data
> has undergone any quality assurance or quality control review. Denver Water makes no
> warranty of any kind, express or implied, concerning the data, including accuracy,
> reliability, completeness, timeliness, or usefulness.
> Copyright 2026, Denver Water. https://www.denverwater.org/about-us/how-we-operate/public-records

See [`data/TERMS.md`](../../data/TERMS.md) for the full notices. Data from USGS, Colorado
DWR, USDA NRCS, and NOAA is public domain.
