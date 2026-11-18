import { beforeEach, expect, test, vi } from 'vitest'
import { saveCmsScenario, saveCmsPersona, type CmsPersonaExpense } from './cms'
const rpc = vi.hoisted(() => vi.fn())
vi.mock('./supabase', () => ({
  getSupabaseClient: vi.fn(async () => ({ rpc })),
}))
beforeEach(() => rpc.mockReset())
test('missing facts cannot silently clear supporting copy during unrelated save', () => {
  expect(() =>
    saveCmsScenario('draft', 1, 'request', 'scenario', {
      title: 'Title',
      description: 'Description',
      category_id: 'category',
      persona_intent: null,
    }),
  ).toThrow('Scenario facts are missing')
  expect(rpc).not.toHaveBeenCalled()
})
test('an explicitly empty fact array still requests confirmed removals', async () => {
  rpc.mockResolvedValue({ data: { revision: 2 }, error: null })
  await saveCmsScenario('draft', 1, 'request', 'scenario', {
    title: 'Title',
    description: 'Description',
    category_id: 'category',
    persona_intent: null,
    facts: [],
  })
  expect(rpc).toHaveBeenCalledWith(
    'cms_save_scenario_content',
    expect.objectContaining({ p_facts: [] }),
  )
})

const expense: CmsPersonaExpense = {
  expense_id: 'bill',
  persona_id: 'persona',
  version_id: 'draft',
  name: ' Rent ',
  amount: '2.50',
  first_due_day: 3,
  repeat_interval_days: null,
  late_fee_amount: '0',
}
test('persona save uses protected bundle with exact retained expense content and no ownership fields', async () => {
  rpc.mockResolvedValue({
    data: { persona_id: 'persona', revision: 2 },
    error: null,
  })
  await saveCmsPersona('draft', 1, 'request', 'persona', { name: 'Updated' }, [
    expense,
  ])
  expect(rpc).toHaveBeenCalledWith('cms_save_persona_bundle', {
    p_version: 'draft',
    p_revision: 1,
    p_request: 'request',
    p_persona: 'persona',
    p_fields: { name: 'Updated' },
    p_expenses: [
      {
        expense_id: 'bill',
        name: ' Rent ',
        amount: '2.50',
        first_due_day: 3,
        repeat_interval_days: null,
        late_fee_amount: '0',
      },
    ],
  })
})
test('missing or foreign expense snapshots fail before sending a persona write', () => {
  expect(() =>
    saveCmsPersona('draft', 0, 'r', 'persona', {}, undefined),
  ).toThrow('Expense data is missing')
  expect(() =>
    saveCmsPersona('other', 0, 'r', 'persona', {}, [expense]),
  ).toThrow('relationships')
  expect(() => saveCmsPersona('draft', 0, 'r', 'other', {}, [expense])).toThrow(
    'relationships',
  )
  expect(() => saveCmsPersona('draft', 0, 'r', null, {}, [expense])).toThrow(
    'relationships',
  )
  expect(rpc).not.toHaveBeenCalled()
})
test.each([
  ['40001', 'Draft changed', 'Reload the draft'],
  ['42501', 'Denied', 'staff access'],
  ['P0001', 'Explicit boolean skills required', 'Explicit boolean skills'],
  ['55P03', 'Lock timeout', 'retry the same save'],
  ['P0002', 'Missing workspace', 'no longer available'],
  ['', 'Fetch failed', 'Retry Save Changes'],
])(
  'persona error %s is actionable and never reports success',
  async (code, message, expected) => {
    rpc.mockResolvedValue({ data: null, error: { code, message } })
    await expect(
      saveCmsPersona('draft', 0, 'r', 'persona', {}, [expense]),
    ).rejects.toThrow(expected)
  },
)
