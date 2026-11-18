import { beforeEach, expect, test, vi } from 'vitest'
import {
  saveCmsScenario,
  saveCmsJob,
  deleteCmsJob,
  CmsJobSaveUncertain,
  saveCmsPersona,
  deleteCmsPersona,
  type CmsPersonaExpense,
} from './cms'
const rpc = vi.hoisted(() => vi.fn())
vi.mock('./supabase', () => ({
  getSupabaseClient: vi.fn(async () => ({ rpc })),
}))
beforeEach(() => {
  rpc.mockReset()
})
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

test('new expenses use client keys and no client-assigned database identity', async () => {
  rpc.mockResolvedValue({
    data: { persona_id: 'persona', revision: 1 },
    error: null,
  })
  await saveCmsPersona('draft', 0, 'r', 'persona', {}, [
    {
      ...expense,
      expense_id: null,
      client_key: 'local-key',
      first_due_day: '2',
      repeat_interval_days: '7',
    },
  ])
  expect(rpc).toHaveBeenCalledWith(
    'cms_save_persona_bundle',
    expect.objectContaining({
      p_expenses: [
        expect.objectContaining({
          expense_id: null,
          client_key: 'local-key',
          first_due_day: 2,
          repeat_interval_days: 7,
        }),
      ],
    }),
  )
})
test.each(['-1', '1.001', 'NaN', 'Infinity', '10000000000', ''])(
  'invalid expense amount %s fails without a write',
  (amount) => {
    expect(() =>
      saveCmsPersona('draft', 0, 'r', 'persona', {}, [{ ...expense, amount }]),
    ).toThrow('USD amount')
    expect(() =>
      saveCmsPersona('draft', 0, 'r', 'persona', {}, [
        { ...expense, late_fee_amount: amount },
      ]),
    ).toThrow('USD amount')
    expect(rpc).not.toHaveBeenCalled()
  },
)
test.each(['0', '-1', '1.5', '32768', ''])(
  'invalid expense schedule %s fails without a write',
  (day) => {
    expect(() =>
      saveCmsPersona('draft', 0, 'r', 'persona', {}, [
        { ...expense, first_due_day: day },
      ]),
    ).toThrow('whole day')
    expect(() =>
      saveCmsPersona('draft', 0, 'r', 'persona', {}, [
        { ...expense, repeat_interval_days: day },
      ]),
    ).toThrow('whole day')
    expect(rpc).not.toHaveBeenCalled()
  },
)
test('linked expense failures explain the blocker and retain changes', async () => {
  rpc.mockResolvedValue({
    data: null,
    error: {
      code: 'P0001',
      message:
        'Expense has external dependencies, including possible bill recap links; nothing was removed',
    },
  })
  await expect(
    saveCmsPersona('draft', 0, 'r', 'persona', {}, []),
  ).rejects.toThrow('bill recap or another record')
})
test('persona deletion uses the protected RPC and explains a scenario blocker', async () => {
  rpc.mockResolvedValueOnce({
    data: { persona_id: 'persona', revision: 2 },
    error: null,
  })
  await deleteCmsPersona('draft', 1, 'request', 'persona')
  expect(rpc).toHaveBeenCalledWith('cms_delete_persona', {
    p_version: 'draft',
    p_revision: 1,
    p_request: 'request',
    p_persona: 'persona',
  })
  rpc.mockResolvedValueOnce({
    data: null,
    error: {
      code: 'P0001',
      message: 'Persona still has linked scenarios. Nothing was deleted',
    },
  })
  await expect(
    deleteCmsPersona('draft', 1, 'request', 'persona'),
  ).rejects.toThrow('linked scenarios')
})

test('job operations use protected RPCs with revision, identity and unchanged decimal strings', async () => {
  rpc.mockResolvedValue({ data: { job_id: 'job', revision: 3 }, error: null })
  await saveCmsJob('draft', 2, 'request', 'job', {
    median_hourly_wage: '12.34',
    requirements_notes: 'Updated',
  })
  expect(rpc).toHaveBeenCalledWith('cms_save_job', {
    p_version: 'draft',
    p_revision: 2,
    p_request: 'request',
    p_job: 'job',
    p_fields: { median_hourly_wage: '12.34', requirements_notes: 'Updated' },
  })
  await deleteCmsJob('draft', 3, 'delete', 'job')
  expect(rpc).toHaveBeenLastCalledWith('cms_delete_job', {
    p_version: 'draft',
    p_revision: 3,
    p_request: 'delete',
    p_job: 'job',
  })
})
test.each([
  ['40001', 'stale', 'changed'],
  ['42501', 'permission denied', 'staff'],
  ['23505', 'duplicate', 'SOC'],
  ['23514', 'constraint', 'job'],
  ['P0001', 'Job is referenced by a persona', 'persona'],
])(
  'job server error %s has actionable feedback',
  async (code, message, expected) => {
    rpc.mockResolvedValue({ data: null, error: { code, message } })
    await expect(saveCmsJob('draft', 0, 'r', 'job', {})).rejects.toThrow(
      new RegExp(expected, 'i'),
    )
  },
)
test('unknown job save outcome is recoverable using the same request', async () => {
  rpc.mockRejectedValue(new TypeError('Failed to fetch'))
  await expect(
    saveCmsJob('draft', 0, 'r', null, { title: 'New' }),
  ).rejects.toBeInstanceOf(CmsJobSaveUncertain)
})
