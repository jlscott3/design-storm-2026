import React from 'react'

/**
 * Adjustable operating thresholds for TOC and alkalinity. Denver Water's own guide
 * questions whether 60 is the number operators act on, so both are editable rather
 * than fixed.
 */
export default function ThresholdControls({ thresholds, onChange }) {
  return (
    <div className="threshold-controls">
      <span className="control-label">Thresholds</span>
      <label className="threshold-field">
        TOC ≥
        <input
          type="number"
          step="0.1"
          value={thresholds.toc.value}
          onChange={(e) => onChange('toc', Number(e.target.value))}
          aria-label="TOC threshold"
        />
        mg/L
      </label>
      <label className="threshold-field">
        Alkalinity ≤
        <input
          type="number"
          step="1"
          value={thresholds.alk.value}
          onChange={(e) => onChange('alk', Number(e.target.value))}
          aria-label="Alkalinity threshold"
        />
        mg/L
      </label>
    </div>
  )
}
