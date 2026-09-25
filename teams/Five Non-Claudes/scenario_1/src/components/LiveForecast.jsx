import React, { useMemo, useState } from 'react'
import { useLiveInputs } from '../lib/useLiveInputs.js'
import { buildForecast } from '../lib/forecast.js'
import { assess, assessBanded, DEFAULT_THRESHOLDS } from '../lib/recommend.js'
import { mockAlumDose, valueAtHorizon } from '../lib/mockDose.js'
import { TARGETS } from '../lib/features.js'
import RecommendationCard from './RecommendationCard.jsx'
import DoseCard from './DoseCard.jsx'
import CurrentInputs from './CurrentInputs.jsx'
import ThresholdControls from './ThresholdControls.jsx'
import ForecastChart from './ForecastChart.jsx'
import CombinedForecast from './CombinedForecast.jsx'

const TARGET_COLORS = { toc: '#ffb454', alk: '#4ecab0' }

/**
 * The live forecast dashboard. Fetches current upstream conditions, resolves each to
 * a value (live or last-bundled fallback), builds a 1-7 day forecast for TOC and
 * alkalinity, and assesses each against an adjustable threshold. fetchImpl is
 * injectable for tests.
 */
export default function LiveForecast({ doc, fetchImpl }) {
  const { series } = doc
  const { loading, resolved } = useLiveInputs(series, fetchImpl)
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS)

  const forecasts = useMemo(() => {
    const toc = buildForecast(series, 'toc', 'turb_flow', resolved.turb_flow.value)
    const alk = buildForecast(series, 'alk', 'conductance', resolved.conductance.value)
    return { toc, alk }
  }, [series, resolved])

  const tocAssess = assess(forecasts.toc.points, thresholds.toc)
  const alkAssess = assessBanded(forecasts.alk.points, thresholds.alk)

  // MOCK alum dose from the near-term (first-horizon) forecast values. Illustrative
  // only; the mockDose module documents why this is not a real calculation.
  const dose = useMemo(() => {
    const tocNow = valueAtHorizon(forecasts.toc.points, 1)
    const alkNow = valueAtHorizon(forecasts.alk.points, 1)
    return mockAlumDose(tocNow, alkNow, thresholds.alk.watch)
  }, [forecasts, thresholds.alk.watch])

  // TOC has one threshold field ('value'); alkalinity has two ('watch', 'act').
  const handleThreshold = (target, key, value) =>
    setThresholds((t) => ({ ...t, [target]: { ...t[target], [key]: value } }))

  return (
    <section className="live-forecast">
      {loading && <p className="placeholder">Fetching current upstream conditions…</p>}

      <DoseCard dose={dose} />

      <RecommendationCard toc={tocAssess} alk={alkAssess} />

      <CurrentInputs resolved={resolved} />

      <ThresholdControls thresholds={thresholds} onChange={handleThreshold} />

      <div className="forecast-grid">
        <ForecastChart
          points={forecasts.toc.points}
          thresholds={[{ value: thresholds.toc.value, label: 'threshold', color: '#ff8a8a' }]}
          color={TARGET_COLORS.toc}
          unit="mg/L"
          label={TARGETS.toc.label}
        />
        <ForecastChart
          points={forecasts.alk.points}
          thresholds={[
            { value: thresholds.alk.watch, label: 'watch', color: '#ffd27a' },
            { value: thresholds.alk.act, label: 'act', color: '#ff8a8a' },
          ]}
          color={TARGET_COLORS.alk}
          unit="mg/L"
          label={TARGETS.alk.label}
        />
      </div>

      <CombinedForecast tocPoints={forecasts.toc.points} alkPoints={forecasts.alk.points} />

      <p className="note">
        Each horizon uses its own model (feature lagged that many days), applied to
        today's reading. The shaded band is that horizon's historical test error
        (±RMSE). Longer horizons mean more warning but usually wider bands.
      </p>
    </section>
  )
}
