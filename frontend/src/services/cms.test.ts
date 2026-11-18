import { expect, test, vi } from 'vitest'
import { saveCmsScenario } from './cms'
const rpc = vi.hoisted(() => vi.fn())
vi.mock('./supabase', () => ({
  getSupabaseClient: vi.fn(async () => ({ rpc })),
}))
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
