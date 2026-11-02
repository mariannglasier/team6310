import { beforeEach, expect, it, vi } from 'vitest'
import { loadEmploymentPreview } from './employmentContent'
import { getSupabaseClient } from './supabase'
import { contentService } from './contentService'
import { usdCents, type Job } from '../types/domain'
import type { LoadedPlaythrough } from '../types/playthrough'

vi.mock('./supabase', () => ({ getSupabaseClient: vi.fn() }))
vi.mock('./contentService', () => ({ contentService: { loadJobs: vi.fn() } }))
const run: LoadedPlaythrough = {
  id: 'saved-run',
  personaId: 'p',
  versionId: 'old-edition',
  ownerUserId: 'owner',
  currentBalance: usdCents(12345),
  currentDay: 1,
  status: 'active',
  supportEnabled: null,
  currentScenarioId: null,
  currentJobId: null,
  employmentState: null,
  sessionId: null,
  startedAt: null,
  persona: {
    id: 'p',
    versionId: 'old-edition',
    name: 'Alex',
    description: null,
  },
}
const job = (id: string): Job => ({
  id,
  versionId: 'old-edition',
  title: id,
  description: null,
  socCode: '00-0000',
  hoursPerWeek: 40,
  medianHourlyWage: usdCents(1000),
  weeklyGrossIncome: usdCents(40000),
  wageYear: 2025,
  areaName: 'Test',
  wageSourceUrl: 'https://www.bls.gov/',
  requirementsNote: null,
  needsEnglishSkills: false,
  needsComputerSkills: false,
})
let row: Record<string, unknown> | null
let queryError: unknown
const eq = vi.fn()
const from = vi.fn()
beforeEach(() => {
  vi.clearAllMocks()
  row = {
    persona_id: 'p',
    version_id: 'old-edition',
    has_english_skills: false,
    has_computer_skills: true,
  }
  queryError = null
  const query = {
    select: vi.fn(() => query),
    eq: eq.mockImplementation(() => query),
    maybeSingle: vi.fn(async () => ({ data: row, error: queryError })),
  }
  from.mockReturnValue(query)
  vi.mocked(getSupabaseClient).mockResolvedValue({ from } as unknown as Awaited<
    ReturnType<typeof getSupabaseClient>
  >)
  vi.mocked(contentService.loadJobs).mockResolvedValue([job('a'), job('b')])
})
it('seeds the same run from its saved balance and pinned skills, with a local pre-game stage', async () => {
  const state = await loadEmploymentPreview(run, false)
  expect(state.balance).toBe(12345)
  expect(state.day).toBe(0)
  expect(state.weeklyIncome).toBe(0)
  expect(state.hasComputerSkills).toBe(true)
  expect(state.persona.versionId).toBe('old-edition')
  expect(eq.mock.calls).toEqual([
    ['persona_id', 'p'],
    ['version_id', 'old-edition'],
  ])
  expect(contentService.loadJobs).toHaveBeenCalledWith('old-edition')
  expect(from).toHaveBeenCalledExactlyOnceWith('personas')
})
it('uses a saved support value before the local replay preference without granting assistance', async () => {
  expect(
    (await loadEmploymentPreview({ ...run, supportEnabled: false }, true))
      .support,
  ).toBe(false)
  const state = await loadEmploymentPreview(run, true)
  expect(state.support).toBe(true)
  expect(state.prepared).toBe(false)
  expect(state.assistanceUsed).toBe(false)
})
it.each([
  { currentBalance: null },
  { versionId: null },
  { currentDay: 2 },
  { status: 'ended' },
  { currentJobId: 'job' },
  { currentScenarioId: 'scenario' },
  { employmentState: {} },
  { sessionId: 'group' },
])('does not reset unknown or recorded progress: %o', async (fields) => {
  await expect(
    loadEmploymentPreview({ ...run, ...fields }, false),
  ).rejects.toThrow('newly started')
  expect(from).not.toHaveBeenCalled()
})
it('fails closed for missing skill columns and allows a later retry', async () => {
  queryError = { code: '42703' }
  await expect(loadEmploymentPreview(run, false)).rejects.toThrow(
    'skills are unavailable',
  )
  queryError = null
  expect((await loadEmploymentPreview(run, false)).balance).toBe(12345)
})
it('does not infer missing skills or accept a different edition', async () => {
  row = { ...row, has_english_skills: null }
  await expect(loadEmploymentPreview(run, false)).rejects.toThrow('skills')
  row = { ...row, version_id: 'new' }
  await expect(loadEmploymentPreview(run, false)).rejects.toThrow('unavailable')
})
