import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { ScenarioWorkspace } from './ScenarioWorkspace'
import * as cms from '../../../services/cms'
import { personaIllustrations } from '../../../components/simulation/avatars'
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
test('library selects and searches draft personas; employment stays read-only and expenses are integrated', async () => {
  const user = await open()
  expect(
    screen.getByRole('heading', { name: 'Select a persona' }),
  ).toBeVisible()
  await user.type(screen.getByLabelText(/^Search personas/), 'Legacy')
  expect(screen.queryByRole('button', { name: /^Second household/ })).toBeNull()
  await user.click(screen.getByRole('button', { name: /^Legacy household/ }))
  expect(screen.getByLabelText(/^Persona description/)).toHaveValue('')
  expect(screen.getByLabelText(/^Starting balance/)).toHaveValue('')
  expect(screen.getByLabelText(/^English skills/)).toHaveValue('')
  expect(screen.getByText('Weekly income · Read-only')).toBeVisible()
  expect(screen.getByText('Starting job · Read-only')).toBeVisible()
  expect(
    screen.queryByRole('textbox', { name: /Weekly income|Starting job/ }),
  ).toBeNull()
  expect(
    screen.getByRole('region', { name: 'Scheduled expenses' }),
  ).toHaveTextContent('Preserved rent')
  expect(screen.getByRole('button', { name: 'Add expense' })).toBeVisible()
  expect(
    screen.queryByRole('button', { name: 'Back to persona library' }),
  ).toBeNull()
  await user.click(screen.getByRole('tab', { name: /Scenarios/ }))
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
  expect(screen.getByLabelText(/^Starting balance/)).toHaveValue('')
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  expect(cms.saveCmsPersona).not.toHaveBeenCalled()
  await user.type(screen.getByLabelText(/^Persona name/), 'New household')
  await user.type(
    screen.getByLabelText(/^Persona description/),
    'Author supplied details',
  )
  await user.type(screen.getByLabelText(/^Starting balance/), '1.001')
  await user.selectOptions(screen.getByLabelText(/^English skills/), 'no')
  await user.selectOptions(screen.getByLabelText(/^Computer skills/), 'yes')
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  expect(screen.getByRole('alert')).toHaveTextContent('two decimal places')
  expect(cms.saveCmsPersona).not.toHaveBeenCalled()
  await user.clear(screen.getByLabelText(/^Starting balance/))
  await user.type(screen.getByLabelText(/^Starting balance/), '150.25')
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
  expect(screen.getByLabelText(/^Starting balance/)).toHaveValue('-2.005')
})

test('existing persona avatar mapping replaces the monogram without presentation configuration', async () => {
  vi.mocked(cms.readCmsDraft).mockResolvedValue({
    ...content,
    personas: [{ ...legacy, name: 'Alex' }],
  })
  const user = await open()
  await user.click(screen.getByRole('button', { name: /^Alex Starting/ }))
  const icon = document.querySelector('.cms-persona-avatar img')
  expect(icon).toHaveClass('persona-avatar--alex')
  expect(icon?.getAttribute('src')).toBe(
    `${personaIllustrations.alex.src}#profile`,
  )
  expect(
    screen.queryByRole('button', { name: 'Back to persona library' }),
  ).toBeNull()
})
test('expense creation and editing join the persona save and remain dirty across collapse and navigation', async () => {
  const user = await selectLegacy()
  await user.click(screen.getByText('Preserved rent', { exact: true }))
  await user.clear(screen.getByLabelText(/^Expense amount/))
  await user.type(screen.getByLabelText(/^Expense amount/), '25.75')
  await user.click(screen.getByText('Preserved rent', { exact: true }))
  await user.click(screen.getByRole('button', { name: 'Add expense' }))
  await user.click(screen.getByText('New expense', { exact: true }))
  const card = screen
    .getByText('New expense', { exact: true })
    .closest('article')!
  const own = within(card)
  expect(own.getByLabelText(/^Expense amount/)).toHaveValue('')
  expect(own.getByLabelText(/^Fixed late fee/)).toHaveValue('')
  await user.type(own.getByLabelText(/^Expense name/), 'Earlier expense')
  await user.type(own.getByLabelText(/^Expense amount/), '10.25')
  await user.type(own.getByLabelText(/^Fixed late fee/), '0')
  await user.type(own.getByLabelText(/^First due day/), '2')
  expect(
    [...document.querySelectorAll('.cms-expense summary strong')].map(
      (e) => e.textContent,
    ),
  ).toEqual(['Earlier expense', ' Preserved rent '])
  await user.click(
    screen.getByRole('button', { name: /^Second household Starting/ }),
  )
  await user.click(screen.getByRole('button', { name: 'Keep editing' }))
  expect(own.getByLabelText(/^Expense amount/)).toHaveValue('10.25')
  vi.mocked(cms.saveCmsPersona).mockResolvedValue({
    persona_id: 'legacy',
    revision: 1,
  })
  vi.mocked(cms.readCmsDraft).mockResolvedValue({
    ...content,
    workspace: { ...content.workspace, revision: 1 },
    expenses: [
      { ...expense, amount: '25.75' },
      {
        ...expense,
        expense_id: 'server-bill',
        name: 'Earlier expense',
        amount: '10.25',
        first_due_day: 2,
      },
    ],
  })
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  await screen.findByText('Saved and reloaded from the database.')
  expect(cms.saveCmsPersona).toHaveBeenCalledTimes(1)
  expect(cms.saveCmsPersona).toHaveBeenCalledWith(
    'draft',
    0,
    expect.any(String),
    'legacy',
    {},
    [
      expect.objectContaining({
        expense_id: 'bill',
        name: ' Preserved rent ',
        amount: '25.75',
      }),
      expect.objectContaining({
        expense_id: null,
        client_key: expect.any(String),
        first_due_day: '2',
        amount: '10.25',
        late_fee_amount: '0',
      }),
    ],
  )
  expect(screen.getByText('No unsaved changes')).toBeVisible()
})
test('expense removal requires confirmation; a failed save keeps other edits and permits restoration', async () => {
  const user = await selectLegacy()
  await user.type(
    screen.getByLabelText(/^Persona description/),
    'Keep this text',
  )
  await user.click(
    screen.getByRole('button', { name: /Remove expense.*Preserved rent/ }),
  )
  expect(cms.saveCmsPersona).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(document.querySelectorAll('.cms-expense')).toHaveLength(1)
  await user.click(
    screen.getByRole('button', { name: /Remove expense.*Preserved rent/ }),
  )
  await user.click(screen.getByRole('button', { name: 'Remove expense' }))
  expect(document.querySelectorAll('.cms-expense')).toHaveLength(0)
  vi.mocked(cms.saveCmsPersona).mockRejectedValue(
    new Error('An expense is referenced; no changes were saved.'),
  )
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('referenced')
  expect(screen.getByLabelText(/^Persona description/)).toHaveValue(
    'Keep this text',
  )
  await user.click(
    screen.getByRole('button', { name: /Restore expense.*Preserved rent/ }),
  )
  expect(document.querySelectorAll('.cms-expense')).toHaveLength(1)
  expect(screen.getByLabelText(/^Persona description/)).toHaveValue(
    'Keep this text',
  )
})
test('known bill recap links block expense removal without losing the form', async () => {
  vi.mocked(cms.readCmsDraft).mockResolvedValue({
    ...content,
    bill_links: [
      { expense_id: 'bill', scenario_id: 'recap', version_id: 'draft' },
    ],
  })
  const user = await selectLegacy()
  await user.click(
    screen.getByRole('button', { name: /Remove expense.*Preserved rent/ }),
  )
  await user.click(screen.getByRole('button', { name: 'Remove expense' }))
  expect(screen.getByRole('alert')).toHaveTextContent('linked to a bill recap')
  expect(document.querySelectorAll('.cms-expense')).toHaveLength(1)
  expect(cms.saveCmsPersona).not.toHaveBeenCalled()
})
test('persona X confirms the name, retains blocked forms, and uses protected deletion', async () => {
  const user = await selectLegacy()
  await user.click(
    screen.getByRole('button', {
      name: 'Delete persona Legacy household',
    }),
  )
  expect(
    screen.getByRole('dialog', { name: 'Delete persona?' }),
  ).toHaveTextContent('Legacy household')
  expect(cms.deleteCmsPersona).not.toHaveBeenCalled()
  vi.mocked(cms.deleteCmsPersona).mockRejectedValueOnce(
    new Error('Persona still has linked scenarios. Nothing was deleted.'),
  )
  await user.click(screen.getByRole('button', { name: 'Delete persona' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('linked scenarios')
  expect(screen.getByLabelText(/^Persona name/)).toHaveValue('Legacy household')
  await user.click(screen.getByRole('button', { name: 'Cancel' }))
  await user.click(
    screen.getByRole('button', {
      name: 'Delete persona Legacy household',
    }),
  )
  vi.mocked(cms.deleteCmsPersona).mockResolvedValue({
    persona_id: 'legacy',
    revision: 1,
  })
  vi.mocked(cms.readCmsDraft).mockResolvedValue({
    ...content,
    workspace: { ...content.workspace, revision: 1 },
    personas: [second],
    expenses: [],
  })
  await user.click(screen.getByRole('button', { name: 'Delete persona' }))
  await screen.findByText('Persona deleted.')
  expect(cms.deleteCmsPersona).toHaveBeenLastCalledWith(
    'draft',
    0,
    expect.any(String),
    'legacy',
  )
  expect(
    screen.queryByRole('button', { name: /^Legacy household Starting/ }),
  ).toBeNull()
})

test('persona help replaces technical details and inline descriptions, with a conditional required legend', async () => {
  const user = await selectLegacy()
  expect(screen.queryByText('Technical details', { exact: true })).toBeNull()
  expect(
    screen.queryByText(/Starting balance applies to future playthroughs/),
  ).toBeNull()
  await user.click(
    screen.getByRole('button', { name: 'About Starting balance (USD)' }),
  )
  expect(screen.getByRole('note')).toHaveTextContent(
    'Leave unchanged to preserve the stored value',
  )
  await user.keyboard('{Escape}')
  expect(
    screen.queryByText(/Starting balance applies to future playthroughs/),
  ).toBeNull()
  await user.click(
    screen.getByRole('button', { name: 'About Scheduled expenses' }),
  )
  expect(screen.getByRole('note')).toHaveTextContent('ordered by first due day')
  await user.keyboard('{Escape}')
  await user.click(screen.getByText('Preserved rent', { exact: true }))
  for (const [label, expected] of [
    ['Fixed late fee (USD)', 'Ignore'],
    ['First due day', 'first occurrence'],
    ['Expense recurrence', 'NULL'],
  ]) {
    await user.click(screen.getByRole('button', { name: `About ${label}` }))
    expect(screen.getByRole('note')).toHaveTextContent(expected)
    await user.keyboard('{Escape}')
  }
  await user.selectOptions(
    screen.getByLabelText(/^Expense recurrence/),
    'repeat',
  )
  await user.click(
    screen.getByRole('button', { name: 'About Repeat interval (days)' }),
  )
  expect(screen.getByRole('note')).toHaveTextContent('not the first due date')
  expect(screen.getByRole('note')).toHaveTextContent('3, 10, 17 and 24')
  await user.keyboard('{Escape}')
  expect(screen.queryByText(/Amounts apply per occurrence/)).toBeNull()
  const add = screen.getByRole('button', { name: 'Add expense' })
  expect(add).toHaveClass('ui-button--secondary')
  expect(
    document.querySelector('.cms-expense')!.compareDocumentPosition(add) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
  expect(screen.getByLabelText(/^Expense name/)).toBeRequired()
  expect(screen.getByText(/is a required field/)).toBeVisible()
  expect(
    document.querySelector('.cms-save-status')!.lastElementChild,
  ).toHaveClass('ui-required-legend')
  expect(
    document.querySelector('.cms-persona-editor')!.textContent,
  ).not.toContain('(required)')
})
test('empty unchanged existing personas have no legend until a required field is present', async () => {
  const user = await open()
  await user.click(
    screen.getByRole('button', { name: /^Second household Starting/ }),
  )
  expect(screen.queryByText(/is a required field/)).toBeNull()
  expect(screen.getByRole('button', { name: 'Add expense' })).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Add expense' }))
  expect(screen.getByText(/is a required field/)).toBeVisible()
  await user.click(screen.getByText('New expense', { exact: true }))
  expect(screen.getByLabelText(/^Expense name/)).toBeRequired()
})
