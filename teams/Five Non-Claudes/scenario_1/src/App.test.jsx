import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App.jsx'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('App offline resilience', () => {
  it('still renders the shell and data terms when every fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))
    render(<App />)

    // Header and the always-present provisional-data caveat render regardless.
    expect(screen.getByText('TOC & Alkalinity Prediction Viewer')).toBeInTheDocument()
    expect(screen.getByText(/Provisional data/i)).toBeInTheDocument()

    // The live badge resolves to its offline state without throwing.
    await waitFor(() =>
      expect(screen.getByTestId('live-badge').textContent).toMatch(/offline/i),
    )
  })
})
