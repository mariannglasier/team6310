import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test } from 'vitest'
import type { CmsFact } from '../../../services/cms'
import { ScenarioFactsEditor } from './ScenarioFactsEditor'
function Harness({ initial = [] }: { initial?: CmsFact[] }) {
  const [facts, setFacts] = useState(initial)
  return <ScenarioFactsEditor facts={facts} onChange={setFacts} />
}
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})
test('new facts default to ineligible; roles are limited and normal fields editable', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  await user.click(screen.getByRole('button', { name: 'Add general fact' }))
  await user.click(screen.getByText('General supporting copy', { exact: true }))
  expect(
    screen.getByRole('checkbox', { name: /Eligible for gameplay display/ }),
  ).not.toBeChecked()
  await user.type(screen.getByLabelText(/general fact text/), 'Supporting text')
  await user.type(
    screen.getByLabelText(/general source URL/),
    'https://example.org',
  )
  await user.click(
    screen.getByRole('checkbox', { name: /Eligible for gameplay display/ }),
  )
  expect(
    screen.getByRole('checkbox', { name: /Eligible for gameplay display/ }),
  ).toBeChecked()
  expect(screen.queryByRole('button', { name: 'Add general fact' })).toBeNull()
  expect(screen.getByLabelText(/general fact text/)).toHaveValue(
    'Supporting text',
  )
})
test('editing text preserves eligibility and evidence; removing requires confirmation', async () => {
  const user = userEvent.setup()
  render(
    <Harness
      initial={[
        {
          fact_role: 'general',
          original_role: 'general',
          display_text: 'Original',
          source_url: 'https://example.org',
          reporting_period: '2025',
          copy_kind: 'fact',
          verified: true,
          evidence: { original: 42 },
          semantic_key: 'keep-key',
        },
      ]}
    />,
  )
  await user.click(screen.getByText('General supporting copy', { exact: true }))
  await user.type(screen.getByLabelText(/general fact text/), ' edited')
  expect(
    screen.getByRole('checkbox', { name: /Eligible for gameplay display/ }),
  ).toBeChecked()
  expect(screen.getByText(/keep-key/)).toBeInTheDocument()
  await user.click(
    screen.getByRole('button', { name: 'Remove general scenario fact' }),
  )
  await user.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(screen.getByLabelText(/general fact text/)).toHaveValue(
    'Original edited',
  )
  await user.click(
    screen.getByRole('button', { name: 'Remove general scenario fact' }),
  )
  await user.click(screen.getByRole('button', { name: 'Remove fact' }))
  expect(screen.queryByLabelText(/general fact text/)).toBeNull()
})

test('collapse keeps edits and both roles remain identifiable', async () => {
  const user = userEvent.setup()
  render(<Harness />)
  await user.click(screen.getByRole('button', { name: 'Add general fact' }))
  await user.click(screen.getByText('General supporting copy', { exact: true }))
  await user.type(screen.getByLabelText(/general fact text/), 'Unsaved content')
  await user.click(screen.getByText('General supporting copy', { exact: true }))
  expect(screen.getByLabelText(/general fact text/)).not.toBeVisible()
  expect(
    screen.getByText('Unsaved content', { selector: '.cms-fact-preview' }),
  ).toBeVisible()
  await user.click(screen.getByText('General supporting copy', { exact: true }))
  expect(screen.getByLabelText(/general fact text/)).toHaveValue(
    'Unsaved content',
  )
  await user.click(screen.getByRole('button', { name: 'Add cac fact' }))
  expect(
    screen.getByText('CAC impact supporting copy', { exact: true }),
  ).toBeVisible()
})
