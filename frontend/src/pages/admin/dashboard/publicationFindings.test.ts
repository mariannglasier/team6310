import { expect, test } from 'vitest'
import type { CmsContent, CmsPublicationFinding } from '../../../services/cms'
import { publicationFindingView } from './publicationFindings'
const content = {
  scenarios: [
    { scenario_id: 'scenario-id', title: '[LOCAL TEST] A decision for Day 4' },
  ],
  personas: [{ persona_id: 'persona-id', name: 'Household' }],
  jobs: [{ job_id: 'job-id', title: 'Cashier' }],
} as CmsContent
function finding(
  code: string,
  affected: Record<string, unknown>[],
): CmsPublicationFinding {
  return {
    code,
    affected,
    severity: 'warning',
    origin: 'database',
    basis: 'A, S; E, V',
    message: 'scenario_fact_copy raw diagnostic',
    description: 'Internal explanation',
  }
}
test('fact summaries resolve scenario names and conceptual roles without internal notation', () => {
  const result = publicationFindingView(
    finding('FACT-ACTIVE-ROLES', [
      {
        scenario_id: 'scenario-id',
        fact_role: 'general',
        version_id: 'private-id',
      },
    ]),
    content,
  )
  expect(result.title).toBe('Scenario is missing a fact')
  expect(result.locations).toEqual([
    {
      label: 'Scenario: [LOCAL TEST] A decision for Day 4 · General fact',
      scenarioId: 'scenario-id',
    },
  ])
  expect(result.explanation).not.toMatch(
    /FACT-ACTIVE-ROLES|scenario_fact_copy|E, V|private-id/,
  )
})
test('jobs, personas and scheduling resolve to named conceptual objects', () => {
  expect(
    publicationFindingView(
      finding('JOB-VISIBLE-VALID', [{ job_id: 'job-id' }]),
      content,
    ).locations[0].label,
  ).toBe('Job: Cashier')
  expect(
    publicationFindingView(
      finding('PER-DETAILS', [{ persona_id: 'persona-id' }]),
      content,
    ).locations[0].label,
  ).toBe('Persona: Household')
  expect(
    publicationFindingView(
      finding('SCN-ROUTE-COVERAGE', [{ persona_id: 'persona-id', day: 4 }]),
      content,
    ).locations[0].label,
  ).toBe('Persona: Household · Day 4')
})
test('unknown diagnostics fail to plain maintenance copy without leaking raw messages', () => {
  const result = publicationFindingView(
    finding('NEW-INTERNAL-RULE', []),
    content,
  )
  expect(result.title).toBe('Saved content needs review')
  expect(JSON.stringify(result)).not.toMatch(
    /NEW-INTERNAL|scenario_fact_copy|A, S/,
  )
})
test('tax explanation is optional and does not invent an exact day', () => {
  const result = publicationFindingView(
    finding('TAX-CONFIGURATION', []),
    content,
  )
  expect(result.explanation).toContain('Tax content is optional')
  expect(result.explanation).toContain('no exact tax day')
})
