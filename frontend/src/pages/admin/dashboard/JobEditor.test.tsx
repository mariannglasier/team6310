import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ScenarioWorkspace } from './ScenarioWorkspace'
import * as cms from '../../../services/cms'
vi.mock('../../../services/cms')
const job: cms.CmsJob = {
  job_id: 'job',
  version_id: 'draft',
  soc_code: '11-1111',
  title: 'Legacy job',
  description: null,
  area_code: '12060',
  area_name: 'Atlanta',
  geography_level: 'MSA',
  wage_year: null,
  median_hourly_wage: '10.25',
  hours_per_week: '37.50',
  weekly_gross_income: '384.38',
  entry_education: null,
  related_experience: null,
  on_job_training: null,
  simulation_requirements: { notes: { legacy: true }, retained: ['metadata'] },
  wage_source_url: '',
  requirements_source_url: null,
  reviewed_at: null,
  last_synced_at: null,
  created_at: '2026-01-01T00:00:00Z',
  is_approved: false,
  is_active: false,
  needs_english_skills: null,
  needs_computer_skills: null,
}
const content: cms.CmsContent = {
  workspace: {
    version_id: 'draft',
    source_version: 'source',
    name: 'Job workshop',
    revision: 0,
    updated_at: '',
  },
  scenarios: [],
  personas: [],
  categories: [],
  jobs: [job],
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
  render(<ScenarioWorkspace editions={[]} />)
  await user.click(await screen.findByRole('button', { name: 'Job workshop' }))
  await user.click(screen.getByRole('tab', { name: /^Jobs/ }))
  return user
}
async function select() {
  const user = await open()
  await user.click(screen.getByRole('button', { name: /^Legacy job SOC/ }))
  return user
}
test('protected library searches/selects inactive jobs, retaining legacy values and generated income read-only', async () => {
  const user = await open()
  await user.type(screen.getByLabelText(/^Search jobs/), 'no match')
  expect(screen.queryByRole('button', { name: /^Legacy job SOC/ })).toBeNull()
  await user.clear(screen.getByLabelText(/^Search jobs/))
  await user.click(screen.getByRole('button', { name: /^Legacy job SOC/ }))
  expect(screen.getByLabelText(/^Job description/)).toHaveValue('')
  expect(screen.getByLabelText(/^Needs English/)).toHaveValue('')
  expect(screen.getByText('$384.38')).toBeVisible()
  expect(screen.queryByRole('textbox', { name: /Weekly gross/ })).toBeNull()
  await user.click(screen.getByRole('button', { name: 'About Weekly gross' }))
  expect(screen.getByText(/PostgreSQL generates weekly gross/)).toBeVisible()
})
test('job editing saves only changed authored fields and reloads stable identity', async () => {
  const user = await select()
  await user.clear(screen.getByLabelText(/^Job title/))
  await user.type(screen.getByLabelText(/^Job title/), 'Updated job')
  vi.mocked(cms.saveCmsJob).mockResolvedValue({ job_id: 'job', revision: 1 })
  vi.mocked(cms.readCmsDraft).mockResolvedValue({
    ...content,
    workspace: { ...content.workspace, revision: 1 },
    jobs: [{ ...job, title: 'Updated job' }],
  })
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  await waitFor(() =>
    expect(cms.saveCmsJob).toHaveBeenCalledWith(
      'draft',
      0,
      expect.any(String),
      'job',
      { title: 'Updated job' },
    ),
  )
  expect(
    await screen.findByText('Saved and reloaded from the database.'),
  ).toBeVisible()
  expect(screen.getByLabelText(/^Job title/)).toHaveValue('Updated job')
  expect(screen.getByText('No unsaved changes')).toBeVisible()
})
test('new jobs have empty money/hours, asterisks and required legend; no generated write', async () => {
  const user = await open()
  await user.click(screen.getByRole('button', { name: 'New job' }))
  expect(screen.getByLabelText(/^Median hourly/)).toHaveValue('')
  expect(screen.getByLabelText(/^Hours per week/)).toHaveValue('')
  expect(screen.getByLabelText(/^Hours per week/)).toBeRequired()
  expect(screen.getByText(/is a required field/)).toBeVisible()
  expect(screen.getByText('Not available')).toBeVisible()
  expect(cms.saveCmsJob).not.toHaveBeenCalled()
})
test('dirty job navigation asks before discarding edits', async () => {
  const user = await select()
  await user.type(screen.getByLabelText(/^Job description/), 'Unsaved')
  await user.click(screen.getByRole('tab', { name: /^Personas/ }))
  expect(screen.getByRole('dialog', { name: /Discard/ })).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Keep editing' }))
  expect(screen.getByLabelText(/^Job description/)).toHaveValue('Unsaved')
})
test('named deletion confirmation keeps the editor when dependencies block deletion', async () => {
  const user = await select()
  await user.click(
    screen.getByRole('button', { name: 'Delete job Legacy job' }),
  )
  const dialog = screen.getByRole('dialog', { name: 'Delete job?' })
  expect(dialog).toHaveTextContent('Legacy job')
  vi.mocked(cms.deleteCmsJob).mockRejectedValue(
    new Error('Job is referenced by a persona. Nothing was deleted.'),
  )
  await user.click(within(dialog).getByRole('button', { name: 'Delete job' }))
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('persona')
  expect(screen.getByLabelText(/^Job title/)).toHaveValue('Legacy job')
})
test('readback failure locks edits and retries the identical request without another job', async () => {
  const user = await select()
  await user.type(screen.getByLabelText(/^Job description/), 'Authored')
  vi.mocked(cms.saveCmsJob).mockResolvedValue({ job_id: 'job', revision: 1 })
  vi.mocked(cms.readCmsDraft).mockRejectedValueOnce(new Error('Offline'))
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  expect(await screen.findByText('Save awaiting confirmation')).toBeVisible()
  expect(screen.getByLabelText(/^Job description/)).toBeDisabled()
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  await waitFor(() => expect(cms.saveCmsJob).toHaveBeenCalledTimes(2))
  expect(vi.mocked(cms.saveCmsJob).mock.calls[1]).toEqual(
    vi.mocked(cms.saveCmsJob).mock.calls[0],
  )
})
test('stale or unauthorized save preserves edited text', async () => {
  const user = await select()
  await user.type(screen.getByLabelText(/^Job description/), 'Authored')
  vi.mocked(cms.saveCmsJob).mockRejectedValue(
    new Error('Draft changed. Reload before saving.'),
  )
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Draft changed')
  expect(screen.getByLabelText(/^Job description/)).toHaveValue('Authored')
})
