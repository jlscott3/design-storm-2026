import React from 'react'

/**
 * The "Do Next / Recommendation" card from the sketch — the headline takeaway.
 * DESCRIPTIVE only: it states what the forecast implies against each threshold and
 * does not prescribe chemical dosing or treatment actions (those are the operator's
 * professional call). It answers, at a glance, the sketch's two questions by simply
 * surfacing what is coming. (The mock alum dose lives in its own DoseCard above.)
 *
 * @param {object} props
 * @param {{level:string, message:string}} props.toc
 * @param {{level:string, message:string}} props.alk
 */
export default function RecommendationCard({ toc, alk }) {
  const overall = worstLevel([toc.level, alk.level])
  return (
    <div className={`reco-card reco-${overall}`} data-testid="reco-card">
      <div className="reco-head">
        <span className="reco-badge" data-level={overall}>
          {overall === 'breach' ? 'Act soon' : overall === 'approaching' ? 'Watch' : 'Clear'}
        </span>
        <span className="reco-title">Forecast summary — next 7 days</span>
      </div>
      <ul className="reco-list">
        <li data-testid="reco-toc">{toc.message}</li>
        <li data-testid="reco-alk">{alk.message}</li>
      </ul>
      <p className="reco-disclaimer">
        Descriptive forecast only, from a simple single-feature model on provisional
        data. Not treatment or dosing guidance — decisions stay with the operator.
      </p>
    </div>
  )
}

function worstLevel(levels) {
  if (levels.includes('breach')) return 'breach'
  if (levels.includes('approaching')) return 'approaching'
  return 'clear'
}
