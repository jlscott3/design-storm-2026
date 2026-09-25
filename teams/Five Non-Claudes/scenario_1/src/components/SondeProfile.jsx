import React, { useMemo, useRef, useState } from 'react'
import { murkyLayer, GATES, PRIMARY_GATE, gateBand, primaryGateCheck } from '../lib/sondeProfile.js'

const DAY_FMT = { month: 'short', day: 'numeric', timeZone: 'UTC' }
const dayLabel = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', DAY_FMT)
const FT_PER_M = 1 / 0.3048

// Chart geometry (SVG user units).
const W = 380
const H = 380
const PAD = { top: 26, right: 34, bottom: 34, left: 92 }
const PW = W - PAD.left - PAD.right
const PH = H - PAD.top - PAD.bottom

function Reading({ label, value, unit, sub }) {
  return (
    <div className="sonde-reading">
      <span className="sonde-reading-label">{label}</span>
      <span className="sonde-reading-num">{value ?? '—'} <span className="sonde-unit">{unit}</span></span>
      {sub && <span className="sonde-reading-sub">{sub}</span>}
    </div>
  )
}

/**
 * Inside Strontia Springs Reservoir: the sonde's last week of casts by depth, with
 * the intake gates marked. Pick a gate to see what the water there looked like;
 * the panel checks whether the primary gate sat in a murky layer. Descriptive
 * only: gate choice does not feed the plant forecast.
 */
export default function SondeProfile({ profile }) {
  const { bands } = profile
  const murky = useMemo(() => murkyLayer(bands), [bands])
  const check = useMemo(() => primaryGateCheck(bands), [bands])
  const [gateId, setGateId] = useState(PRIMARY_GATE.id)
  const svgRef = useRef(null)

  // Everything on screen is in feet, the unit the gates are named in.
  const maxFt = bands[bands.length - 1].bottom * FT_PER_M
  const xMax = Math.ceil(Math.max(...bands.map((b) => b.turbidity[2])))
  const x = (v) => PAD.left + (v / xMax) * PW
  const y = (ft) => PAD.top + (ft / maxFt) * PH
  const yM = (m) => y(m * FT_PER_M)
  const mid = (b) => (b.top + b.bottom) / 2

  const medianPath = bands.map((b, i) => `${i ? 'L' : 'M'}${x(b.turbidity[1])},${yM(mid(b))}`).join(' ')
  const rangePath =
    bands.map((b, i) => `${i ? 'L' : 'M'}${x(b.turbidity[2])},${yM(mid(b))}`).join(' ') +
    [...bands].reverse().map((b) => `L${x(b.turbidity[0])},${yM(mid(b))}`).join(' ') + 'Z'

  const gate = GATES.find((g) => g.id === gateId)
  const at = gateBand(bands, gate)
  const ratio = at.turbidity[1] / check.clearestTurbidity
  const inMurky = murky && at.top >= murky.top && at.bottom <= murky.bottom

  // A click or drag on the chart picks the nearest gate.
  function pickFromPointer(e) {
    const r = svgRef.current.getBoundingClientRect()
    const ft = ((e.clientY - r.top) / r.height * H - PAD.top) / PH * maxFt
    const nearest = GATES.reduce((a, g) => (Math.abs(g.ft - ft) < Math.abs(a.ft - ft) ? g : a))
    setGateId(nearest.id)
  }

  const xTicks = Array.from({ length: Math.floor(xMax / 2) + 1 }, (_, i) => i * 2)
  const yTicks = Array.from({ length: Math.floor(maxFt / 50) + 1 }, (_, i) => i * 50)
  const ntu = (v) => `${v.toFixed(1)} NTU`

  return (
    <section className="sonde-panel" aria-labelledby="sonde-title">
      <div className="map-card-head">
        <span className="map-chip">Intake gates</span>
        <span className="map-date">archived · last 7 days of sonde casts, {dayLabel(profile.from)}–{dayLabel(profile.to)}</span>
      </div>
      <h3 id="sonde-title">Inside Strontia Springs Reservoir</h3>

      <div className="sonde-body">
        <figure className="sonde-chart">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`Turbidity by depth in Strontia Springs Reservoir with the intake gates marked.${murky ? ` Murky layer ${Math.round(murky.top * FT_PER_M)} to ${Math.round(murky.bottom * FT_PER_M)} ft.` : ''}`}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pickFromPointer(e) }}
            onPointerMove={(e) => { if (e.buttons) pickFromPointer(e) }}
          >
            {murky && <rect x={PAD.left} y={yM(murky.top)} width={PW} height={yM(murky.bottom) - yM(murky.top)} className="sonde-murky-band" />}

            {xTicks.map((t) => (
              <g key={`x${t}`}>
                <line x1={x(t)} x2={x(t)} y1={PAD.top} y2={PAD.top + PH} className="sonde-grid" />
                <text x={x(t)} y={H - PAD.bottom + 16} textAnchor="middle" className="sonde-axis">{t}</text>
              </g>
            ))}
            {yTicks.map((t) => (
              <text key={`y${t}`} x={W - PAD.right + 2} y={y(t) + 4} textAnchor="start" className="sonde-axis sonde-axis-ft">{t}</text>
            ))}
            <text x={PAD.left + PW / 2} y={H - 4} textAnchor="middle" className="sonde-axis">Turbidity, NTU</text>
            <text x={PAD.left} y={14} className="sonde-axis">Surface · depth in ft</text>

            <path d={rangePath} className="sonde-range" />
            <path d={medianPath} className="sonde-median" />

            {GATES.map((g) => {
              const on = g.id === gateId
              const gy = y(g.ft)
              return (
                <g key={g.id} className={on ? 'sonde-gate on' : 'sonde-gate'}>
                  <line x1={PAD.left - 6} x2={PAD.left + PW} y1={gy} y2={gy} className="sonde-gate-line" />
                  <text x={PAD.left - 10} y={gy + 4} textAnchor="end" className="sonde-gate-label">
                    {g.label}{g.primary ? ' ★' : ''}
                  </text>
                  {on && <circle cx={x(gateBand(bands, g).turbidity[1])} cy={gy} r="6" className="sonde-pick-dot" />}
                </g>
              )
            })}

            {/* Band label last, so gate lines never draw over it. */}
            {murky && <text x={PAD.left + PW - 6} y={yM(murky.top) + 14} textAnchor="end" className="sonde-band-label">Murky layer</text>}
          </svg>
          <div className="sonde-gates" role="radiogroup" aria-label="Intake gate">
            {GATES.map((g) => (
              <button
                key={g.id}
                type="button"
                role="radio"
                aria-checked={g.id === gateId}
                className={g.id === gateId ? 'sonde-gate-btn on' : 'sonde-gate-btn'}
                onClick={() => setGateId(g.id)}
              >
                {g.label}{g.primary ? ' ★' : ''}
              </button>
            ))}
          </div>
          <figcaption className="sonde-caption">
            ★ primary gate. Line: typical turbidity at each depth; shading: the middle half
            of readings. Tap a gate or the chart.
          </figcaption>
        </figure>

        <div className="sonde-side">
          <div className={check.murky ? 'sonde-suggest look' : 'sonde-suggest'}>
            <div className="sonde-suggest-label">Primary gate, {dayLabel(profile.from)}–{dayLabel(profile.to)}</div>
            <div className="sonde-suggest-num">
              {check.murky ? 'Worth a second look' : 'Looks normal'}
            </div>
            <p>
              {check.murky
                ? `The ${check.gate.label} gate sat in a murky layer, typically ${ntu(check.turbidity)}. The clearest gate was ${check.clearest.label} at ${ntu(check.clearestTurbidity)}.`
                : `The ${check.gate.label} gate typically read ${ntu(check.turbidity)}, outside any murky layer.`}
            </p>
            {gateId !== PRIMARY_GATE.id && (
              <button type="button" className="sonde-jump" onClick={() => setGateId(PRIMARY_GATE.id)}>
                Back to {PRIMARY_GATE.label}
              </button>
            )}
          </div>

          <div className="sonde-at" aria-live="polite">
            <div className="sonde-at-head">
              {gate.id === 'top' ? 'At the top intake' : `At the ${gate.label} gate`}
              {gate.primary ? ' (primary)' : ''}
            </div>
            <Reading
              label="Turbidity"
              value={at.turbidity[1].toFixed(1)}
              unit="NTU"
              sub={
                gate.id === check.clearest.id ? 'Clearest gate that week'
                  : `${ratio.toFixed(1)}× the clearest gate${inMurky ? ' · in the murky layer' : ''}`
              }
            />
            <Reading label="Temperature" value={at.temp?.toFixed(1)} unit="°C" />
            <Reading label="Conductivity" value={at.cond != null ? Math.round(at.cond) : null} unit="µS/cm" />
            <Reading label="Chlorophyll" value={at.chl?.toFixed(1)} unit="µg/L" />
          </div>
        </div>
      </div>

      <p className="map-note">
        Turbidity is only part of the choice: Denver Water prefers {PRIMARY_GATE.label} for
        reasons this panel doesn't measure. The panel flags weeks when that gate sat in murky
        water; it doesn't pick a gate. Choosing a gate does not change the plant forecasts
        above, because this season's sonde readings don't yet track the plant's lab values.
        Gate depths are from Cassidi's whiteboard sketch, taken here as feet below the actual
        surface; if they are from full pool, each gate sits shallower. The sonde is not a live
        feed here: its data ends {dayLabel(profile.to)}.
      </p>
    </section>
  )
}
