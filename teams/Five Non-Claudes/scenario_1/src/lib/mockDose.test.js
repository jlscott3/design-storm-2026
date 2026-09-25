import { describe, it, expect } from 'vitest'
import { mockAlumDose, valueAtHorizon, ALUM_PER_TOC } from './mockDose.js'

describe('mockAlumDose', () => {
  it('matches the anchor example (3 mg/L TOC -> ~11 mg/L alum) with no low-alk bump', () => {
    const d = mockAlumDose(3, 70, 60) // alkalinity above watch => no bump
    expect(d.lowAlkBump).toBe(0)
    expect(d.rateMgL).toBeCloseTo(11, 5)
  })

  it('scales linearly with TOC', () => {
    const d = mockAlumDose(6, 70, 60)
    expect(d.rateMgL).toBeCloseTo(ALUM_PER_TOC * 6, 5)
  })

  it('bumps the dose up when alkalinity is below the watch line', () => {
    const plain = mockAlumDose(3, 70, 60)
    const low = mockAlumDose(3, 30, 60)
    expect(low.lowAlkBump).toBeGreaterThan(0)
    expect(low.rateMgL).toBeGreaterThan(plain.rateMgL)
  })

  it('caps the low-alkalinity bump', () => {
    const d = mockAlumDose(3, 0, 60)
    expect(d.lowAlkBump).toBeCloseTo(0.25, 5)
  })

  it('returns null when TOC is unavailable', () => {
    expect(mockAlumDose(null, 60)).toBeNull()
  })

  it('derives a grams figure', () => {
    const d = mockAlumDose(3, 70, 60)
    expect(Number.isFinite(d.grams)).toBe(true)
  })
})

describe('valueAtHorizon', () => {
  const points = [
    { horizon: 1, predicted: 2.5 },
    { horizon: 3, predicted: 2.9 },
  ]
  it('returns the value at the requested horizon', () => {
    expect(valueAtHorizon(points, 3)).toBe(2.9)
  })
  it('falls back to the first point when the horizon is absent', () => {
    expect(valueAtHorizon(points, 5)).toBe(2.5)
  })
  it('returns null for empty points', () => {
    expect(valueAtHorizon([], 1)).toBeNull()
  })
})
