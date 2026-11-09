import { beforeEach, expect, it, vi } from 'vitest'
import { loadScenarioFacts } from './scenarioFacts'
const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock('./supabase', () => ({ getSupabaseClient: async () => ({ rpc }) }))
const row = {
  scenario_id: 'scenario',
  version_id: 'edition',
  fact_role: 'general',
  semantic_key: 'work:search',
  display_text: 'A sourced observation.',
  source_url: 'https://www.bls.gov/',
}
beforeEach(() => vi.clearAllMocks())
it('requests the owned committed recap through the protected RPC', async () => {
  rpc.mockResolvedValue({ data: [row], error: null })
  expect(await loadScenarioFacts('run', 'scenario', 'edition', false)).toEqual([
    {
      role: 'general',
      semanticKey: 'work:search',
      text: row.display_text,
      sourceUrl: row.source_url,
    },
  ])
  expect(rpc).toHaveBeenCalledWith('get_event_recap_facts', {
    p_run_id: 'run',
    p_event_key: 'scenario',
  })
})
it.each([
  { version_id: 'other' },
  { scenario_id: 'other' },
  { display_text: 'Unresolved {amount}' },
  { source_url: 'javascript:alert(1)' },
  { fact_role: 'cac' },
])('rejects mismatched or unresolved fact data %o', async (change) => {
  rpc.mockResolvedValue({ data: [{ ...row, ...change }], error: null })
  await expect(
    loadScenarioFacts('run', 'scenario', 'edition', false),
  ).rejects.toThrow('Invalid scenario facts')
})
it('rejects duplicate fact roles', async () => {
  rpc.mockResolvedValue({ data: [row, row], error: null })
  await expect(
    loadScenarioFacts('run', 'scenario', 'edition', true),
  ).rejects.toThrow('Invalid scenario facts')
})
