import { render, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { ScenarioFacts } from './ScenarioFacts'

const { load } = vi.hoisted(() => ({ load: vi.fn() }))
vi.mock('../../services/scenarioFacts', () => ({ loadScenarioFacts: load }))
const props = { runId: 'run', scenarioId: 'scenario', versionId: 'edition' }
const general = {
  role: 'general',
  semanticKey: 'work:search',
  text: 'General observation',
  sourceUrl: 'https://www.bls.gov/',
}
const cac = {
  role: 'cac',
  semanticKey: 'cac:students',
  text: 'CAC observation',
  sourceUrl: 'https://www.ourcac.org/',
}
beforeEach(() => vi.clearAllMocks())
it('shows general and CAC cards with source links in CAC mode', async () => {
  load.mockResolvedValue([cac, general])
  render(<ScenarioFacts {...props} supportEnabled />)
  expect(await screen.findByText(general.text)).toBeVisible()
  expect(screen.getByText(cac.text)).toBeVisible()
  expect(screen.getAllByRole('link', { name: 'Source' })).toHaveLength(2)
})
it('never displays a CAC observation in regular mode', async () => {
  load.mockResolvedValue([general, cac])
  render(<ScenarioFacts {...props} supportEnabled={false} />)
  expect(await screen.findByText(general.text)).toBeVisible()
  expect(screen.queryByText(cac.text)).toBeNull()
})
it('does not invent a fact for a missing observation', async () => {
  load.mockResolvedValue([])
  render(<ScenarioFacts {...props} supportEnabled />)
  expect(await screen.findByLabelText('Scenario facts')).toBeEmptyDOMElement()
})
it('ignores a late response from the previous scenario', async () => {
  let resolveOld!: (value: unknown) => void
  load.mockReturnValueOnce(
    new Promise((resolve) => {
      resolveOld = resolve
    }),
  )
  const { rerender } = render(<ScenarioFacts {...props} supportEnabled />)
  load.mockResolvedValueOnce([{ ...general, text: 'New fact' }])
  rerender(<ScenarioFacts {...props} scenarioId="next" supportEnabled />)
  expect(await screen.findByText('New fact')).toBeVisible()
  resolveOld([general])
  expect(screen.queryByText(general.text)).toBeNull()
})
