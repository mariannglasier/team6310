import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminContentError, loadAdminContent } from './adminContent'

const getSupabaseClient = vi.hoisted(() => vi.fn())
vi.mock('./supabase', () => ({ getSupabaseClient }))

type Rows = Record<string, Record<string, unknown>[]>
const requested: { table: string; from: number; to: number }[] = []

function fakeClient(tables: Rows, failing?: string) {
  return {
    from(table: string) {
      return {
        select: () => ({
          order: () => ({
            range: async (from: number, to: number) => {
              requested.push({ table, from, to })
              if (table === failing)
                return { data: null, error: { message: 'raw sql detail' } }
              return {
                data: (tables[table] ?? []).slice(from, to + 1),
                error: null,
              }
            },
          }),
        }),
      }
    },
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  requested.length = 0
})

describe('loadAdminContent', () => {
  it('maps stored rows into read models with exact money', async () => {
    getSupabaseClient.mockResolvedValue(
      fakeClient({
        content_versions: [
          {
            version_id: 'v1',
            version_number: 1,
            status: 'published',
            created_at: '2026-10-27T07:01:42+00:00',
            published_at: '2026-10-27T07:58:56+00:00',
            change_summary: 'First edition',
            created_by: 'must-not-be-read',
          },
        ],
        personas: [
          {
            persona_id: 'p1',
            version_id: 'v1',
            name: 'Alex',
            description: 'Starts unemployed',
            general_starting_balance: 350,
            weekly_income: 0,
            starting_job_id: null,
            has_english_skills: true,
            has_computer_skills: false,
          },
        ],
        choices: [
          {
            choice_id: 'c1',
            scenario_id: 's1',
            version_id: 'v1',
            choice_text: 'Pay rent',
            balance_change: -1250.5,
            response_text: 'Paid',
            next_scenario_id: null,
          },
        ],
        jobs: [
          {
            job_id: 'j1',
            version_id: 'v1',
            soc_code: '41-2011',
            title: 'Cashier',
            median_hourly_wage: 14.39,
            hours_per_week: 35,
            weekly_gross_income: '503.65',
            is_approved: true,
            is_active: true,
            wage_source_url: 'https://www.bls.gov/oes/tables.htm',
            requirements_source_url: 'javascript:alert(1)',
            simulation_requirements: {
              schedule: 'client_based',
              nested: { ignored: true },
              notes: 'Check training',
            },
          },
        ],
        cac_service_facts: [
          {
            fact_id: 'f1',
            service_key: 'eviction_prevention',
            fact_key: 'evictions_prevented',
            fact_title: 'evictions prevented',
            value: 1108,
            unit: 'Number',
            reporting_year: 2025,
          },
        ],
      }),
    )
    const content = await loadAdminContent()
    expect(content.editions[0]).toMatchObject({
      versionNumber: 1,
      status: 'published',
      changeSummary: 'First edition',
    })
    expect(content.editions[0]).not.toHaveProperty('createdBy')
    expect(content.personas[0]).toMatchObject({
      name: 'Alex',
      startingBalance: 35000,
      weeklyIncome: 0,
      startingJobId: null,
      hasEnglishSkills: true,
      hasComputerSkills: false,
    })
    expect(content.choices[0].balanceChange).toBe(-125050)
    expect(content.jobs[0]).toMatchObject({
      medianHourlyWage: 1439,
      weeklyGrossIncome: 50365,
      wageSourceUrl: 'https://www.bls.gov/oes/tables.htm',
      requirementsSourceUrl: null,
      requirements: { schedule: 'client_based', notes: 'Check training' },
    })
    expect(content.serviceFacts[0]).toMatchObject({
      title: 'evictions prevented',
      value: 1108,
      reportingYear: 2025,
    })
    expect(content.statistics).toEqual([])
  })

  it('shows unreadable amounts as missing instead of failing the whole load', async () => {
    getSupabaseClient.mockResolvedValue(
      fakeClient({
        choices: [
          {
            choice_id: 'c1',
            scenario_id: 's1',
            balance_change: 'not money',
            choice_text: 'x',
          },
        ],
      }),
    )
    expect((await loadAdminContent()).choices[0].balanceChange).toBeNull()
  })

  it('pages through tables larger than one response', async () => {
    const many = Array.from({ length: 1001 }, (_, index) => ({
      scenario_id: `s${index}`,
      title: `Scenario ${index}`,
    }))
    getSupabaseClient.mockResolvedValue(fakeClient({ scenarios: many }))
    const content = await loadAdminContent()
    expect(content.scenarios).toHaveLength(1001)
    expect(requested.filter((r) => r.table === 'scenarios')).toEqual([
      { table: 'scenarios', from: 0, to: 999 },
      { table: 'scenarios', from: 1000, to: 1999 },
    ])
  })

  it('reports one generic error and never leaks backend details', async () => {
    getSupabaseClient.mockResolvedValue(fakeClient({}, 'jobs'))
    const failure = await loadAdminContent().catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(AdminContentError)
    expect((failure as Error).message).toBe(
      'Unable to load the stored content right now. Please try again.',
    )
    expect((failure as Error).message).not.toMatch(/raw sql/)
  })

  it('reports the generic error when the client cannot be created', async () => {
    getSupabaseClient.mockRejectedValue(new Error('Missing env'))
    await expect(loadAdminContent()).rejects.toBeInstanceOf(AdminContentError)
  })
})
