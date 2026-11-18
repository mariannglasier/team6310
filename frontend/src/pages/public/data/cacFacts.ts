// CAC outcome facts for the Explore Data topics.
//
// Each topic lists which rows of the CAC outcomes CSV it shows and the sentence
// that follows the figure. The values themselves always come from the CSV; the
// wording here only describes the workbook row it points at.
//
// Rows the workbook does not make clear are deliberately not used: "Coats for
// Kids # clients goal" (a goal or a count?), "Sales (+taxes)", the volunteer
// averages, and "Returns" versus the federal and state return counts.
import {
  cacOutcomes,
  formatOutcomeValue,
  latestOutcome,
  type CacOutcome,
} from '../../../data/cacOutcomes'
import type { CategoryId, ExplorerFact } from './dataExplorerContent'

interface CacFactSpec {
  readonly key: string
  /** Continues the sentence that starts with the figure. */
  readonly label: string
}

export const CAC_FACT_SPECS: Readonly<
  Record<CategoryId, readonly CacFactSpec[]>
> = {
  housing: [
    {
      key: 'financial_assistance.evictions_prevented_households',
      label:
        'households had an eviction prevented through CAC financial assistance.',
    },
    {
      key: 'financial_assistance.people_keeping_a_roof_to_live_individuals',
      label:
        'individuals kept a roof to live under through CAC financial assistance.',
    },
    {
      key: 'financial_assistance.amount_paid',
      label: 'was paid out through CAC financial assistance.',
    },
  ],
  food: [
    {
      key: 'food.households',
      label: 'households were served by CAC food assistance.',
    },
    {
      key: 'food.visits_to_mini_market',
      label: 'visits were made to the CAC Mini-Market.',
    },
    {
      key: 'food.pounds_of_food_provided_to_clients',
      label: 'of food was provided to CAC clients.',
    },
    {
      key: 'food.meals_provided',
      label: 'meals were provided through CAC food assistance.',
    },
  ],
  employment: [
    {
      key: 'adult_education.total_undup_students',
      label: 'students (unduplicated) took part in CAC adult education.',
    },
    {
      key: 'adult_education.esol',
      label:
        'students were in CAC English as a Second or Other Language (ESOL) classes.',
    },
    {
      key: 'adult_education.computers',
      label: 'students were in CAC computer classes.',
    },
    {
      key: 'empowerment_center.job_placement',
      label: 'job placements were recorded by the CAC Empowerment Center.',
    },
  ],
  clothing: [
    {
      key: 'clothing.households_undup',
      label: 'households (unduplicated) were served through CAC clothing.',
    },
    {
      key: 'clothing.individuals',
      label: 'individuals were served through CAC clothing.',
    },
    {
      key: 'clothing.thrift_credit_clients',
      label: 'in thrift credit for CAC clients.',
    },
  ],
  youth: [
    {
      key: 'meals_for_kids.children',
      label: 'children were served by CAC Meals for Kids.',
    },
    {
      key: 'school_supply.children',
      label: 'children were served by CAC School Supply.',
    },
    {
      key: 'teachers_closet.children',
      label: 'children were counted through CAC’s Teacher’s Closet.',
    },
    {
      key: 'hope_for_the_holidays.individuals',
      label: 'individuals were served by CAC Hope for the Holidays.',
    },
  ],
  finances: [
    {
      key: 'vita.federal_returns_prepared',
      label:
        'federal tax returns were prepared through CAC’s Volunteer Income Tax Assistance (VITA) program.',
    },
    {
      key: 'vita.federal_refund',
      label: 'in federal refunds came through CAC’s VITA program.',
    },
    {
      key: 'vita.total_credits_earned_income_child_and_education_credit',
      label:
        'in earned income, child and education credits (combined) came through CAC’s VITA program.',
    },
    {
      key: 'vita.earned_income_credit',
      label: 'in Earned Income Credit came through CAC’s VITA program.',
    },
  ],
}

function toFact(outcome: CacOutcome, label: string): ExplorerFact {
  return {
    id: `cac-${outcome.key.replace('.', '-').replaceAll('_', '-')}`,
    value: formatOutcomeValue(outcome),
    label,
    geography: 'CAC clients',
    period: String(outcome.year),
    sourceId: 'cacOutcomes',
  }
}

/** Facts for the rows that exist; a row missing from the data is left out, never invented. */
export function buildCacFacts(
  outcomes: readonly CacOutcome[],
  specs: readonly CacFactSpec[],
): readonly ExplorerFact[] {
  return specs.flatMap((spec) => {
    const outcome = latestOutcome(outcomes, spec.key)
    return outcome ? [toFact(outcome, spec.label)] : []
  })
}

export function cacFactsFor(category: CategoryId): readonly ExplorerFact[] {
  return buildCacFacts(cacOutcomes, CAC_FACT_SPECS[category])
}

/** "1,097" for a CAC row, or undefined when the data has no such row. */
export function cacFigure(
  key: string,
): { value: string; year: number } | undefined {
  const outcome = latestOutcome(cacOutcomes, key)
  return outcome
    ? { value: formatOutcomeValue(outcome), year: outcome.year }
    : undefined
}
