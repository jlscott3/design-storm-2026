// Turn a forecast curve plus an operating threshold into a plain-language,
// DESCRIPTIVE status. It states what the forecast implies relative to the threshold;
// it deliberately gives no chemical-dosing or treatment advice — those are
// professional decisions for the operator, not this demo.

// Default operating thresholds. TOC's is a demo cutoff (the guide uses >3 mg/L only
// as an "unusual day" weighting); alkalinity's 60 mg/L is Jake's low-alkalinity line.
// Both are adjustable in the UI, per Denver Water's own "is 60 the right number?".
export const DEFAULT_THRESHOLDS = {
  toc: { value: 3, direction: 'above', label: 'Elevated TOC' },
  alk: { value: 60, direction: 'below', label: 'Low alkalinity' },
}

/**
 * Does a forecast value breach the threshold, given the direction of concern?
 * direction 'above' => breach when value >= threshold; 'below' => value <= threshold.
 */
export function breaches(value, threshold, direction) {
  return direction === 'above' ? value >= threshold : value <= threshold
}

/**
 * Evaluate a forecast against a threshold and produce a descriptive status.
 *
 * @param {{horizon:number, date:string, predicted:number}[]} points  forecast curve
 * @param {{value:number, direction:'above'|'below', label:string}} threshold
 * @returns {{
 *   level: 'clear'|'approaching'|'breach',
 *   firstBreachHorizon: number|null,
 *   message: string,
 * }}
 */
export function assess(points, threshold) {
  if (!points || points.length === 0) {
    return { level: 'clear', firstBreachHorizon: null, message: 'No forecast available.' }
  }
  const { value, direction, label } = threshold
  const word = direction === 'above' ? 'above' : 'below'

  const firstBreach = points.find((p) => breaches(p.predicted, value, direction))
  if (firstBreach) {
    const h = firstBreach.horizon
    const day = h === 1 ? '1 day' : `${h} days`
    // If the very first horizon already breaches, it is arriving now, not "in N days".
    const lead =
      h === points[0].horizon
        ? `within the next ${day}`
        : `in about ${day}`
    return {
      level: h <= 2 ? 'breach' : 'approaching',
      firstBreachHorizon: h,
      message:
        `${label}: forecast crosses ${word} the ${value} threshold ${lead} ` +
        `(predicted ${firstBreach.predicted.toFixed(2)} on ${firstBreach.date}).`,
    }
  }

  // No breach in the window — report the closest approach.
  const closest = points.reduce((a, b) =>
    Math.abs(b.predicted - value) < Math.abs(a.predicted - value) ? b : a,
  )
  return {
    level: 'clear',
    firstBreachHorizon: null,
    message:
      `${label}: forecast stays ${direction === 'above' ? 'below' : 'above'} the ` +
      `${value} threshold across the next ${points[points.length - 1].horizon} days ` +
      `(closest ${closest.predicted.toFixed(2)} on ${closest.date}).`,
  }
}
