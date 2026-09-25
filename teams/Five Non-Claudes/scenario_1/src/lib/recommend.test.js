import { describe, it, expect } from 'vitest'
import { breaches, assess, DEFAULT_THRESHOLDS } from './recommend.js'

describe('breaches', () => {
  it('handles above and below directions', () => {
    expect(breaches(3.2, 3, 'above')).toBe(true)
    expect(breaches(2.8, 3, 'above')).toBe(false)
    expect(breaches(58, 60, 'below')).toBe(true)
    expect(breaches(62, 60, 'below')).toBe(false)
  })
})

const toc = DEFAULT_THRESHOLDS.toc
const alk = DEFAULT_THRESHOLDS.alk

describe('assess (TOC, above)', () => {
  it('reports a breach and its lead time', () => {
    const points = [
      { horizon: 1, date: '2026-09-26', predicted: 2.7 },
      { horizon: 2, date: '2026-09-27', predicted: 2.9 },
      { horizon: 3, date: '2026-09-28', predicted: 3.2 },
    ]
    const r = assess(points, toc)
    expect(r.level).toBe('approaching')
    expect(r.firstBreachHorizon).toBe(3)
    expect(r.message).toMatch(/crosses above the 3 threshold/)
    expect(r.message).toContain('2026-09-28')
  })

  it('flags a near-term breach as breach level', () => {
    const points = [
      { horizon: 1, date: '2026-09-26', predicted: 3.5 },
      { horizon: 2, date: '2026-09-27', predicted: 3.6 },
    ]
    expect(assess(points, toc).level).toBe('breach')
  })

  it('reports clear when nothing breaches', () => {
    const points = [
      { horizon: 1, date: '2026-09-26', predicted: 2.4 },
      { horizon: 2, date: '2026-09-27', predicted: 2.5 },
    ]
    const r = assess(points, toc)
    expect(r.level).toBe('clear')
    expect(r.firstBreachHorizon).toBeNull()
    expect(r.message).toMatch(/stays below the 3 threshold/)
  })
})

describe('assess (alkalinity, below)', () => {
  it('detects dropping below the low threshold', () => {
    const points = [
      { horizon: 1, date: '2026-09-26', predicted: 64 },
      { horizon: 2, date: '2026-09-27', predicted: 59 },
    ]
    const r = assess(points, alk)
    expect(r.firstBreachHorizon).toBe(2)
    expect(r.message).toMatch(/crosses below the 60 threshold/)
  })
})

it('handles an empty forecast', () => {
  expect(assess([], toc).message).toMatch(/No forecast/)
})
