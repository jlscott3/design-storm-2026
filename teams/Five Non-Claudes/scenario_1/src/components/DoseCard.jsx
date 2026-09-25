import React from 'react'

const MOCK_DISCLAIMER =
  'Illustrative only. Anchored to one unverified example (≈3 mg/L TOC → ≈11 alum) ' +
  'from the Denver Water Q&A; not a calibrated formula and not a real dose.'

/**
 * MOCK aluminium sulfate (alum) dose — the "what to do now" recommendation, shown as
 * its own section above the forecast. This is NOT a real dosing calculation: it is a
 * toy relation anchored to a single unverified example from the Denver Water Q&A. The
 * full caveat lives in a tooltip on the MOCK tag to keep the dashboard uncluttered.
 *
 * @param {object} props
 * @param {{rateMgL:number, grams:number, basis:number, lowAlkBump:number}|null} props.dose
 */
export default function DoseCard({ dose }) {
  return (
    <div className="dose-card" data-testid="dose-card">
      <div className="dose-head">
        <span className="mock-tag" title={MOCK_DISCLAIMER} tabIndex={0} aria-label={MOCK_DISCLAIMER}>
          MOCK
        </span>
        <span className="dose-title">Recommended now · aluminium sulfate (alum) dose</span>
      </div>
      {dose ? (
        <>
          <div className="dose-value">
            ≈ {dose.rateMgL.toFixed(1)} <span className="dose-unit">mg/L</span>
            <span className="dose-grams"> (≈ {dose.grams.toFixed(3)} g per L)</span>
          </div>
          <div className="dose-basis">
            toy relation: {'~'}3.7 mg/L alum per mg/L forecast TOC (basis{' '}
            {dose.basis.toFixed(2)} mg/L TOC)
            {dose.lowAlkBump > 0
              ? `, +${Math.round(dose.lowAlkBump * 100)}% for low alkalinity`
              : ''}
          </div>
        </>
      ) : (
        <div className="dose-value">— (no TOC forecast)</div>
      )}
    </div>
  )
}
