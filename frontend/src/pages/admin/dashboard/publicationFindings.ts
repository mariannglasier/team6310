import type { CmsContent, CmsPublicationFinding } from '../../../services/cms'

// Internal rule identifiers never become staff-facing copy. Explanations describe
// actions and consequences, rather than echoing SQL diagnostics or evidence tags.
const copy: Record<string, [string, string]> = {
  'PUB-STATE': [
    'Edition cannot be published',
    'Select a saved CMS draft. Published editions cannot be changed.',
  ],
  'PUB-ACCESS': [
    'Staff access is required',
    'Sign in with an active staff account and review again.',
  ],
  'PUB-STALE-REVIEW': [
    'Review is out of date',
    'Reload the saved draft and run review again before publishing.',
  ],
  'PUB-ORDER': [
    'A newer edition has been published',
    'Create a fresh draft from the latest published edition. Your existing draft and its saved edits will be preserved, but are not merged automatically.',
  ],
  'PUB-HISTORY': [
    'Edition is already used by gameplay',
    'This draft has historical gameplay references. Publication is blocked to protect those records; ask the project maintainer to investigate.',
  ],
  'REL-EDITION': [
    'A content reference belongs to another edition',
    'A related record does not belong to this draft. Ask the project maintainer to correct the relationship before publishing.',
  ],
  'REL-CONSTRAINT': [
    'A saved value is invalid',
    'A saved value violates a required data or financial constraint. Review the affected record; amounts must be finite, exact currency values.',
  ],
  'PER-CATALOG': [
    'Add at least one persona',
    'Players must select a persona before starting. Create and save at least one persona.',
  ],
  'PER-DETAILS': [
    'Persona details are incomplete',
    'Check the name, description and starting balance. The setup screen needs these values to offer the persona.',
  ],
  'PER-EMPLOYMENT': [
    'Starting employment or skills are invalid',
    'Set both skill selections. Personas must start unemployed with zero starting income; contact the project maintainer if the read-only employment values are invalid.',
  ],
  'JOB-STARTABLE-CATALOG': [
    'At least two starting jobs are needed',
    'Save at least two active, approved jobs requiring neither English nor computer skills. Employment initialization needs these available choices.',
  ],
  'JOB-VISIBLE-VALID': [
    'Job details are incomplete or invalid',
    'Review the active job’s title, wage, hours, source, year and skill requirements. The job loader and application process need valid values.',
  ],
  'SCN-PLAYABLE-CONTENT': [
    'Scenario content is incomplete',
    'Review the scenario title, description, category and choice text. Incomplete optional content does not prevent publication, but may be unusable when encountered.',
  ],
  'SCN-ANSWER-AVAILABLE': [
    'No choice is available without CAC support',
    'Add an ordinary choice if this scenario should be playable without support. This optional content concern does not prevent publication.',
  ],
  'SCN-UNSUPPORTED-EFFECT': [
    'Choice uses an unsupported effect',
    'Individual gameplay rejects this choice’s legacy support effect. Ask the project maintainer to resolve it before publishing. No effects are automatically removed.',
  ],
  'SCN-ROUTE-COVERAGE': [
    'Scenario schedule may run out of choices',
    'This route may exhaust the optional scenario pool or contain competing scheduled events. Review scheduling before testing this route. You do not need to create filler content to publish.',
  ],
  'SCN-DORMANT-INCOMPLETE': [
    'Disabled scenario is incomplete',
    'This scenario is excluded from ordinary gameplay. Complete it before enabling it if you intend to use it.',
  ],
  'SCN-UNEXPECTED-EXCLUSION': [
    'Scenario is not selected by individual gameplay',
    'Check persona applicability, scheduling and availability if you intend this scenario to appear. General scenarios are not automatically selected by the current individual selector.',
  ],
  'SCN-SCHEDULE-ALTERNATIVES': [
    'Scenarios compete for this day',
    'More than one scenario is available for this day. Each scenario is not guaranteed to appear.',
  ],
  'SCN-CONDITIONAL-DAY': [
    'Scheduled day may be skipped',
    'Employment or the simulation calendar can exclude this scheduled slot. Check the day if the scenario must appear during your test.',
  ],
  'SCN-DORMANCY-UNCERTAIN': [
    'Scenario availability needs review',
    'Check the scenario’s schedule and applicability before testing. Its availability could not be established confidently.',
  ],
  'SCN-DORMANT-EFFECT': [
    'Disabled choice retains a legacy effect',
    'The stored effect is preserved. Review it before enabling the scenario; it is not applied to ordinary gameplay here.',
  ],
  'FACT-STORED-VALID': [
    'Fact contains an invalid saved value',
    'Check fact text, source and identity. Stored facts must satisfy the existing source and content constraints; eligibility and evidence are never automatically changed.',
  ],
  'FACT-ACTIVE-ROLES': [
    'Scenario is missing a fact',
    'Supporting facts are optional. Add a fact if you want it displayed after the choice; an empty eligible result displays no fact.',
  ],
  'FACT-DISPLAY-INELIGIBLE': [
    'Fact is not eligible for gameplay display',
    'Eligibility is optional. Change Eligible for gameplay display only when you want this fact shown.',
  ],
  'FACT-PROVENANCE-LIMITED': [
    'Fact source details may be incomplete',
    'Review the reporting period and evidence if needed. Missing structured evidence is not an approval requirement and does not prevent publication.',
  ],
  'FACT-GENERAL-CONFLICT': [
    'General fact may repeat',
    'The same eligible general fact may appear in more than one event. Variety is optional; no fact is automatically changed or suppressed.',
  ],
  'FACT-VARIETY-UNCERTAIN': [
    'Fact variety needs review',
    'Similar copy has different identifiers. Review it if variety matters for your test; there is no automatic text-to-statistic binding.',
  ],
  'FACT-CAC-REUSE': [
    'CAC fact may repeat',
    'More than one event uses this CAC fact. Repetition is allowed for minimum publication.',
  ],
  'EXP-DEFINITION': [
    'Expense values are invalid',
    'Review the expense amount, fixed late fee, first due day and recurrence interval. Existing monetary and schedule rules still apply.',
  ],
  'EXP-SCENARIO-COLLISION': [
    'Bill and scenario share a scheduled day',
    'Move the expense or scenario schedule. The existing publication safety guard rejects this collision, including disabled scenarios.',
  ],
  'EXP-OUTSIDE-CALENDAR': [
    'Expense starts after Day 30',
    'This expense produces no bill during the simulation. Change the first due day only if this is unintended.',
  ],
  'EXP-RECAP-MISSING': [
    'Bill has no supporting recap content',
    'The bill can still be paid or ignored. Supporting scenario context is optional.',
  ],
  'TAX-CONFIGURATION': [
    'Tax scenario is not scheduled to appear',
    'This authored tax scenario has no reachable scheduled slot. Schedule it if you want it to appear. Tax content is optional and no exact tax day is required.',
  ],
  'TAX-EXACTLY-ONCE': [
    'Tax scenario may be skipped',
    'Review competing scenarios, bills and employment days if you want this authored tax scenario to appear once. Tax content is optional.',
  ],
  'PUB-MANDATORY-UNPROVEN': [
    'Gameplay safety check needs maintenance',
    'Individual gameplay or database safety code has changed since validation was reviewed. Ask the project maintainer to review compatibility. This is not a request for filler content.',
  ],
  'PUB-SOURCE-BEHIND': [
    'Draft uses an older source edition',
    'Review whether this draft includes the content you intend. No automatic merge or rebase occurs.',
  ],
}

export function publicationFindingView(
  finding: CmsPublicationFinding,
  content: CmsContent,
) {
  const [title, explanation] = copy[finding.code] ?? [
    'Saved content needs review',
    'Review the affected content. If the issue is unclear, ask the project maintainer to inspect the publication diagnostics.',
  ]
  const records = finding.affected.length
    ? finding.affected.flatMap((record) =>
        record.a_id && record.b_id
          ? [
              { ...record, scenario_id: record.a_id },
              { ...record, scenario_id: record.b_id },
            ]
          : [record],
      )
    : [{}]
  return {
    title,
    explanation,
    locations: records.map((record) => {
      const scenario = content.scenarios.find(
        (s) => s.scenario_id === record.scenario_id,
      )
      const job = content.jobs?.find((j) => j.job_id === record.job_id)
      const persona = content.personas.find(
        (p) => p.persona_id === record.persona_id,
      )
      const name =
        record.title ??
        record.name ??
        scenario?.title ??
        job?.title ??
        persona?.name
      const object = record.expense_id
        ? 'Expense'
        : record.choice_id
          ? 'Choice'
          : record.scenario_id
            ? 'Scenario'
            : record.job_id
              ? 'Job'
              : record.persona_id
                ? 'Persona'
                : 'Edition'
      const field =
        record.fact_role === 'cac'
          ? 'CAC fact'
          : record.fact_role === 'general'
            ? 'General fact'
            : record.day != null
              ? `Day ${String(record.day)}`
              : ''
      return {
        label: [name ? `${object}: ${String(name)}` : object, field]
          .filter(Boolean)
          .join(' · '),
        scenarioId: scenario?.scenario_id,
      }
    }),
  }
}
