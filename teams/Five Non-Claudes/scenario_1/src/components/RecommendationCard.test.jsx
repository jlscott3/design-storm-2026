import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RecommendationCard from './RecommendationCard.jsx'

const toc = { level: 'clear', message: 'TOC: stays below the 3 threshold.' }
const alk = { level: 'approaching', message: 'Low alkalinity: crosses below the 60 watch line.' }

describe('RecommendationCard', () => {
  it('shows both target messages and the descriptive-only disclaimer', () => {
    render(<RecommendationCard toc={toc} alk={alk} />)
    expect(screen.getByTestId('reco-toc').textContent).toMatch(/TOC/)
    expect(screen.getByTestId('reco-alk').textContent).toMatch(/alkalinity/i)
    expect(screen.getByTestId('reco-card').textContent).toMatch(/decisions stay with the operator/i)
  })

  it('no longer contains the dose (moved to its own card)', () => {
    render(<RecommendationCard toc={toc} alk={alk} />)
    expect(screen.queryByTestId('dose-card')).toBeNull()
    expect(screen.getByTestId('reco-card').textContent).not.toMatch(/sulfate/i)
  })
})
