import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ScenarioWorkspace } from './ScenarioWorkspace'
import * as cms from '../../../services/cms'
vi.mock('../../../services/cms')
const edition = {
  versionId: 'source',
  versionNumber: 1,
  status: 'published',
  createdAt: null,
  publishedAt: null,
  changeSummary: null,
}
const legacy: cms.CmsPersona = {
  persona_id: 'legacy',
  version_id: 'draft',
  name: 'Legacy household',
  description: null,
  general_starting_balance: null,
  weekly_income: 9,
  starting_job_id: 'retained-job',
  has_english_skills: null,
  has_computer_skills: null,
}
const second: cms.CmsPersona = {
  ...legacy,
  persona_id: 'second',
  name: 'Second household',
  description: 'Second description',
  general_starting_balance: 50,
  weekly_income: 0,
  starting_job_id: null,
  has_english_skills: true,
  has_computer_skills: false,
}
const expense: cms.CmsPersonaExpense = {
  expense_id: 'bill',
  version_id: 'draft',
  persona_id: 'legacy',
  name: ' Preserved rent ',
  amount: '10.25',
  first_due_day: 6,
  repeat_interval_days: null,
  late_fee_amount: '0',
}
const content: cms.CmsContent = {
  workspace: {
    version_id: 'draft',
    source_version: 'source',
    name: 'Persona workshop',
    revision: 0,
    updated_at: '',
  },
  scenarios: [],
  personas: [legacy, second],
  categories: [],
  expenses: [expense],
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
  await user.click(
    await screen.findByRole('button', { name: 'Persona workshop' }),
  )
  await user.click(screen.getByRole('tab', { name: /Personas/ }))
  return user
}
async function selectLegacy() {
  const user = await open()
  await user.click(screen.getByRole('button', { name: /^Legacy household/ }))
  return user
}
test('library selects and searches draft personas; employment and expenses are read-only', async () => {
  const user = await open()
  expect(
    screen.getByRole('heading', { name: 'Select a persona' }),
  ).toBeVisible()
  await user.type(screen.getByLabelText('Search personas'), 'Legacy')
  expect(screen.queryByRole('button', { name: /^Second household/ })).toBeNull()
  await user.click(screen.getByRole('button', { name: /^Legacy household/ }))
  expect(screen.getByLabelText(/^Persona description/)).toHaveValue('')
  expect(screen.getByLabelText(/Starting balance/)).toHaveValue('')
  expect(screen.getByLabelText(/^English skills/)).toHaveValue('')
  expect(screen.getByText('Weekly income · Read-only')).toBeVisible()
  expect(screen.getByText('Starting job · Read-only')).toBeVisible()
  expect(
    screen.queryByRole('textbox', { name: /Weekly income|Starting job/ }),
  ).toBeNull()
  expect(
    screen.getByRole('region', { name: 'Scheduled expenses' }),
  ).toHaveTextContent('Preserved rent')
  expect(
    screen.queryByRole('button', {
      name: /Add expense|Remove expense|Delete persona/,
    }),
  ).toBeNull()
  await user.click(
    screen.getByRole('button', { name: 'Back to persona library' }),
  )
  expect(screen.queryByLabelText('Persona name')).toBeNull()
})
test('ordinary edit sends only changed fields and preserves nullable legacy values and expense snapshot', async () => {
  const user = await selectLegacy()
  await user.type(screen.getByLabelText(/^Persona name/), ' edited')
  vi.mocked(cms.saveCmsPersona).mockResolvedValue({
    persona_id: 'legacy',
    revision: 1,
  })
  vi.mocked(cms.readCmsDraft).mockResolvedValue({
    ...content,
    workspace: { ...content.workspace, revision: 1 },
    personas: [{ ...legacy, name: 'Legacy household edited' }, second],
  })
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  await screen.findByText('Saved and reloaded from the database.')
  expect(cms.saveCmsPersona).toHaveBeenCalledWith(
    'draft',
    0,
    expect.any(String),
    'legacy',
    { name: 'Legacy household edited' },
    [expense],
  )
  expect(screen.getByLabelText(/^English skills/)).toHaveValue('')
  expect(screen.getByLabelText(/^Persona description/)).toHaveValue('')
  expect(screen.getByText('No unsaved changes')).toBeVisible()
})
test('new persona needs explicit values; saves and selects the server identity', async () => {
  const user = await open()
  await user.click(screen.getByRole('button', { name: 'New persona' }))
  expect(screen.getByLabelText(/Starting balance/)).toHaveValue('')
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  expect(cms.saveCmsPersona).not.toHaveBeenCalled()
  await user.type(screen.getByLabelText(/Persona name/), 'New household')
  await user.type(
    screen.getByLabelText(/Persona description/),
    'Author supplied details',
  )
  await user.type(screen.getByLabelText(/Starting balance/), '1.001')
  await user.selectOptions(screen.getByLabelText(/^English skills/), 'no')
  await user.selectOptions(screen.getByLabelText(/^Computer skills/), 'yes')
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  expect(screen.getByRole('alert')).toHaveTextContent('two decimal places')
  expect(cms.saveCmsPersona).not.toHaveBeenCalled()
  await user.clear(screen.getByLabelText(/Starting balance/))
  await user.type(screen.getByLabelText(/Starting balance/), '150.25')
  const saved = {
    ...second,
    persona_id: 'server-id',
    name: 'New household',
    description: 'Author supplied details',
    general_starting_balance: '150.25',
    has_english_skills: false,
    has_computer_skills: true,
  }
  vi.mocked(cms.saveCmsPersona).mockResolvedValue({
    persona_id: 'server-id',
    revision: 1,
  })
  vi.mocked(cms.readCmsDraft).mockResolvedValue({
    ...content,
    workspace: { ...content.workspace, revision: 1 },
    personas: [...content.personas, saved],
  })
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  await screen.findByText('Saved and reloaded from the database.')
  expect(cms.saveCmsPersona).toHaveBeenCalledWith(
    'draft',
    0,
    expect.any(String),
    null,
    {
      name: 'New household',
      description: 'Author supplied details',
      general_starting_balance: '150.25',
      has_english_skills: false,
      has_computer_skills: true,
    },
    [],
  )
  expect(
    screen.getByRole('button', { name: /^New household Starting/ }),
  ).toHaveAttribute('aria-current', 'true')
})
test('shared discard guard protects persona switching, tab switching, reload and browser unload', async () => {
  const user = await selectLegacy()
  await user.type(screen.getByLabelText(/^Persona name/), ' unsaved')
  const event = new Event('beforeunload', { cancelable: true })
  fireEvent(window, event)
  expect(event.defaultPrevented).toBe(true)
  for (const target of [
    screen.getByRole('button', { name: /^Second household/ }),
    screen.getByRole('tab', { name: /Scenarios/ }),
    screen.getByRole('button', { name: 'Reload draft' }),
    screen.getByRole('button', { name: 'Back to persona library' }),
  ]) {
    await user.click(target)
    expect(
      screen.getByRole('dialog', { name: 'Discard unsaved changes?' }),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(screen.getByLabelText(/^Persona name/)).toHaveValue(
      'Legacy household unsaved',
    )
  }
  await user.click(screen.getByRole('button', { name: /^Second household/ }))
  await user.click(screen.getByRole('button', { name: 'Discard changes' }))
  expect(screen.getByLabelText(/^Persona name/)).toHaveValue('Second household')
})
test('uncertain readback retains identical request, original revision and form until retry succeeds', async () => {
  const user = await selectLegacy()
  await user.type(screen.getByLabelText(/^Persona name/), ' saved')
  vi.mocked(cms.saveCmsPersona).mockResolvedValue({
    persona_id: 'legacy',
    revision: 1,
  })
  vi.mocked(cms.readCmsDraft).mockRejectedValueOnce(
    new Error('Readback failed'),
  )
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  await screen.findByRole('alert')
  expect(screen.getByLabelText(/^Persona name/)).toBeDisabled()
  expect(screen.getByLabelText(/^Persona name/)).toHaveValue(
    'Legacy household saved',
  )
  vi.mocked(cms.readCmsDraft).mockResolvedValue({
    ...content,
    workspace: { ...content.workspace, revision: 1 },
    personas: [{ ...legacy, name: 'Legacy household saved' }, second],
  })
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  await screen.findByText('Saved and reloaded from the database.')
  expect(vi.mocked(cms.saveCmsPersona).mock.calls[0]).toEqual(
    vi.mocked(cms.saveCmsPersona).mock.calls[1],
  )
})
test('stale and unauthorized save errors retain edits; refresh reopens persisted values explicitly', async () => {
  const user = await selectLegacy()
  await user.type(screen.getByLabelText(/^Persona name/), ' unsaved')
  vi.mocked(cms.saveCmsPersona).mockRejectedValue(
    new Error('Draft changed. Reload before saving.'),
  )
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Draft changed')
  vi.mocked(cms.saveCmsPersona).mockRejectedValue(
    new Error('Your staff access could not be confirmed.'),
  )
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('staff access'),
  )
  expect(screen.getByLabelText(/^Persona name/)).toHaveValue(
    'Legacy household unsaved',
  )
  await user.click(screen.getByRole('button', { name: 'Reload draft' }))
  await user.click(screen.getByRole('button', { name: 'Discard changes' }))
  await user.click(
    await screen.findByRole('button', { name: /^Legacy household Starting/ }),
  )
  expect(screen.getByLabelText(/^Persona name/)).toHaveValue('Legacy household')
})
test('missing protected expense data prevents unsafe saves', async () => {
  vi.mocked(cms.readCmsDraft).mockResolvedValue({
    ...content,
    expenses: undefined,
  })
  const user = await selectLegacy()
  await user.type(screen.getByLabelText(/^Persona name/), ' edited')
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Expense data is unavailable',
  )
  expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
  expect(cms.saveCmsPersona).not.toHaveBeenCalled()
})

test('unchanged legacy blank description and invalid legacy amount are omitted rather than revalidated', async () => {
  const stored = {
    ...legacy,
    description: '',
    general_starting_balance: '-2.005',
  }
  vi.mocked(cms.readCmsDraft).mockResolvedValue({
    ...content,
    personas: [stored, second],
  })
  const user = await selectLegacy()
  await user.type(screen.getByLabelText(/^Persona name/), ' retained')
  vi.mocked(cms.saveCmsPersona).mockResolvedValue({
    persona_id: 'legacy',
    revision: 1,
  })
  vi.mocked(cms.readCmsDraft).mockResolvedValue({
    ...content,
    workspace: { ...content.workspace, revision: 1 },
    personas: [{ ...stored, name: 'Legacy household retained' }, second],
  })
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  await screen.findByText('Saved and reloaded from the database.')
  expect(cms.saveCmsPersona).toHaveBeenCalledWith(
    'draft',
    0,
    expect.any(String),
    'legacy',
    { name: 'Legacy household retained' },
    [expense],
  )
  expect(screen.getByLabelText(/Starting balance/)).toHaveValue('-2.005')
})
