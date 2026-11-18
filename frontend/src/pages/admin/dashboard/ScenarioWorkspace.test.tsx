import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ScenarioWorkspace } from './ScenarioWorkspace'
import * as cms from '../../../services/cms'
vi.mock('../../../services/cms')
const edition = {
  versionId: 'source',
  versionNumber: 3,
  status: 'published',
  createdAt: null,
  publishedAt: null,
  changeSummary: null,
}
const content: cms.CmsContent = {
  workspace: {
    version_id: 'draft',
    source_version: 'source',
    name: 'Workshop',
    revision: 0,
    updated_at: '',
  },
  scenarios: [
    {
      scenario_id: 'scenario',
      title: 'Rent',
      description: 'Rent decision',
      category_id: 'housing',
      persona_intent: 'alex',
      schedule_type: 'scheduled',
      default_day: 4,
    },
  ],
  personas: [
    {
      persona_id: 'alex',
      version_id: 'draft',
      name: 'Alex',
      description: null,
      general_starting_balance: null,
      weekly_income: 0,
      starting_job_id: null,
      has_english_skills: null,
      has_computer_skills: null,
    },
  ],
  expenses: [],
  categories: [{ category_id: 'housing', name: 'Housing' }],
}
beforeEach(() => {
  vi.resetAllMocks()
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
  vi.mocked(cms.listCmsDrafts).mockResolvedValue([content.workspace])
  vi.mocked(cms.readCmsDraft).mockResolvedValue(content)
})
async function open() {
  const user = userEvent.setup()
  render(<ScenarioWorkspace editions={[edition]} />)
  await screen.findByRole('button', { name: 'Workshop' })
  await user.click(screen.getByRole('button', { name: 'Workshop' }))
  await screen.findByRole('button', { name: /^Rent/ })
  return user
}
test('reopens without creating, filters personas, and preserves unsaved edits on cancelled navigation', async () => {
  const user = await open()
  expect(cms.createCmsDraft).not.toHaveBeenCalled()
  await user.selectOptions(
    screen.getByLabelText('Filter by persona'),
    'general',
  )
  expect(screen.queryByRole('button', { name: /^Rent/ })).toBeNull()
  await user.selectOptions(screen.getByLabelText('Filter by persona'), 'alex')
  await user.click(screen.getByRole('button', { name: /^Rent/ }))
  await user.type(screen.getByLabelText(/Scenario title/), ' changed')
  await user.click(screen.getByRole('button', { name: 'New scenario' }))
  await user.click(screen.getByRole('button', { name: 'Keep editing' }))
  expect(screen.getByLabelText(/Scenario title/)).toHaveValue('Rent changed')
})
test('saves selected edition/revision and confirms persisted reload', async () => {
  const user = await open()
  await user.click(screen.getByRole('button', { name: /^Rent/ }))
  await user.type(screen.getByLabelText(/Scenario title/), ' updated')
  vi.mocked(cms.saveCmsScenario).mockResolvedValue({
    scenario_id: 'scenario',
    revision: 1,
  })
  vi.mocked(cms.readCmsDraft).mockResolvedValue({
    ...content,
    workspace: { ...content.workspace, revision: 1 },
    scenarios: [{ ...content.scenarios[0], title: 'Rent updated' }],
  })
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  await screen.findByText('Saved and reloaded from the database.')
  expect(cms.saveCmsScenario).toHaveBeenCalledWith(
    'draft',
    0,
    expect.any(String),
    'scenario',
    expect.objectContaining({ title: 'Rent updated' }),
  )
  expect(screen.getByLabelText(/Scenario title/)).toHaveValue('Rent updated')
})
test('failed save keeps entered content and offers no publication controls', async () => {
  const user = await open()
  await user.click(screen.getByRole('button', { name: 'New scenario' }))
  await user.type(screen.getByLabelText(/Scenario title/), 'New')
  await user.type(screen.getByLabelText(/Scenario description/), 'Decision')
  await user.selectOptions(screen.getByLabelText(/Category/), 'housing')
  vi.mocked(cms.saveCmsScenario).mockRejectedValue(new Error('Draft changed.'))
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('Draft changed.'),
  )
  expect(screen.getByLabelText(/Scenario title/)).toHaveValue('New')
  expect(screen.queryByRole('button', { name: /publish/i })).toBeNull()
})

test('creation fields only appear in dialog; scheduling toggles its day', async () => {
  const user = await open()
  expect(screen.getByLabelText(/Draft name/)).not.toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Create new draft' }))
  expect(screen.getByRole('dialog', { name: 'Create draft' })).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Cancel' }))
  await user.click(screen.getByRole('button', { name: 'New scenario' }))
  expect(screen.getByLabelText(/Default day/)).toBeDisabled()
  await user.selectOptions(screen.getByLabelText('Schedule type'), 'scheduled')
  expect(screen.getByLabelText(/Default day/)).toBeEnabled()
  await user.click(screen.getByRole('button', { name: 'Add choice' }))
  await user.click(screen.getByText('New choice', { exact: true }))
  await user.type(screen.getByLabelText(/Choice 1 text/), 'Pay')
  await user.click(screen.getByRole('button', { name: 'Add choice' }))
  await user.click(screen.getByRole('button', { name: 'Move choice 2 up' }))
  await user.click(screen.getByRole('button', { name: 'Remove choice 2' }))
  expect(screen.queryByText('Pay', { exact: true })).toBeNull()
})

test('draft deletion requires named confirmation and clears the active workspace', async () => {
  const user = await open()
  vi.mocked(cms.deleteCmsDraft).mockResolvedValue()
  await user.click(screen.getByRole('button', { name: 'Delete Workshop' }))
  expect(
    screen.getByRole('dialog', { name: 'Delete draft?' }),
  ).toHaveTextContent('Workshop')
  expect(cms.deleteCmsDraft).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(cms.deleteCmsDraft).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Delete Workshop' }))
  vi.mocked(cms.listCmsDrafts).mockResolvedValue([])
  await user.click(screen.getByRole('button', { name: 'Delete draft' }))
  await screen.findByText('Draft deleted.')
  expect(cms.deleteCmsDraft).toHaveBeenCalledWith('draft', 0)
  expect(screen.queryByRole('region', { name: 'Scenario library' })).toBeNull()
})

test('scenario X confirms without changing selection and deletes through protected service', async () => {
  const user = await open()
  vi.mocked(cms.deleteCmsScenario).mockResolvedValue({ revision: 1 })
  await user.click(screen.getByRole('button', { name: 'Delete scenario Rent' }))
  expect(
    screen.getByRole('dialog', { name: 'Delete scenario?' }),
  ).toHaveTextContent('Rent')
  expect(screen.queryByLabelText(/Scenario title/)).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(cms.deleteCmsScenario).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Delete scenario Rent' }))
  vi.mocked(cms.readCmsDraft).mockResolvedValue({ ...content, scenarios: [] })
  await user.click(screen.getByRole('button', { name: 'Delete scenario' }))
  await screen.findByText('Scenario deleted.')
  expect(cms.deleteCmsScenario).toHaveBeenCalledWith(
    'draft',
    0,
    expect.any(String),
    'scenario',
  )
})
