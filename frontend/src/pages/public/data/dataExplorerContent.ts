import { cacFactsFor } from './cacFacts'

// Content for the Explore Data page (`/data`).
//
// Facts on this page come from only two places:
//   * CAC's own outcome totals, read from `src/data/cac-outcomes.csv`
//     (see `cacFacts.ts`), and
//   * published statistics from official APIs, read from the database and shown
//     by the live statistics components.
// Nothing is hand-entered here. The scenes draw published statistics; only the
// grocery basket's item prices and the clothing rail are illustrative samples,
// and the page labels them as such.

export type Mode = 'challenge' | 'impact'

export type CategoryId =
  'housing' | 'food' | 'employment' | 'clothing' | 'youth' | 'finances'

export type SourceId = 'cacOutcomes'

export interface SourceRef {
  readonly name: string
  readonly title: string
  readonly url: string
}

export const sources: Readonly<Record<SourceId, SourceRef>> = {
  cacOutcomes: {
    name: 'Community Assistance Center',
    title: 'Program outcomes (CAC records)',
    url: 'https://ourcac.org/',
  },
}

/** A CAC outcome figure shown as a fact card. */
export interface ExplorerFact {
  readonly id: string
  /** Display value, including its unit when it has one. */
  readonly value: string
  /** What the value measures. */
  readonly label: string
  readonly geography: string
  readonly period: string
  readonly sourceId: SourceId
}

export interface CategoryContent {
  readonly id: CategoryId
  /** Short tab label. */
  readonly label: string
  /** Full topic name used for the panel's accessible name. */
  readonly topic: string
  /** Approved category name (design/ui-spec.md 9A). */
  readonly name: string
  /** One-sentence description shown under the topic heading. */
  readonly description: string
  readonly heading: string
  readonly takeaway: string
  readonly modeNotes: Readonly<Record<Mode, string>>
  readonly facts: readonly ExplorerFact[]
  readonly cac: { readonly title: string; readonly body: string }
}

export const categories: readonly CategoryContent[] = [
  {
    id: 'housing',
    label: 'Housing',
    topic: 'Housing and utilities',
    name: 'Housing & Utility Security',
    description: 'Rent and utility bills arrive whether or not the money does.',
    heading: 'Keep the lights on',
    takeaway:
      'When housing or power bills outrun income, one month can go dark. Support can help the lights stay on.',
    modeNotes: {
      challenge:
        'Each window stands for 5 of every 100 renting households. Switch the place to compare how many are under pressure.',
      impact:
        'Some windows come back on. Support steps in when a crisis threatens a home or a power bill.',
    },
    facts: cacFactsFor('housing'),
    cac: {
      title: 'CAC financial assistance',
      body: 'CAC offers financial assistance to help neighbors facing a crisis and works to prevent homelessness and hunger.',
    },
  },
  {
    id: 'food',
    label: 'Food',
    topic: 'Food and nutrition',
    name: 'Food & Nutrition',
    description: 'Prices move while a budget stays put.',
    heading: 'Stretch a grocery budget',
    takeaway: 'A few percent on the price tag adds up across a whole basket.',
    modeNotes: {
      challenge:
        'Apply a published price change and watch the same basket cost more.',
      impact: 'CAC food assistance helps households when grocery bills climb.',
    },
    facts: cacFactsFor('food'),
    cac: {
      title: 'CAC food pantry',
      body: 'CAC provides food assistance to neighbors facing financial hardship, so grocery money can stretch to other essentials.',
    },
  },
  {
    id: 'employment',
    label: 'Employment',
    topic: 'Employment and adult education',
    name: 'Employment & Adult Education',
    description: 'Education shapes who finds work and what it pays.',
    heading: 'Open more doors',
    takeaway:
      'More education goes with a lower chance of being out of work and higher pay.',
    modeNotes: {
      challenge:
        'Pick an education level to see how many of every 100 workers are out of work, and what the typical week pays.',
      impact:
        'CAC adult education offers English and computer skills classes for adults.',
    },
    facts: cacFactsFor('employment'),
    cac: {
      title: 'CAC adult education',
      body: 'The CAC offers a variety of adult education programs. English as a Second or Other Language classes or computer skills classes could help you be more qualified for jobs.',
    },
  },
  {
    id: 'clothing',
    label: 'Clothing',
    topic: 'Essential goods and clothing',
    name: 'Essential Goods & Clothing',
    description:
      'Clothes carry people into interviews, classrooms, and cold mornings.',
    heading: 'Dressed for what’s next',
    takeaway:
      'The right clothes at the right moment can be hard to afford all at once.',
    modeNotes: {
      challenge:
        'Empty hangers pass by. The highlighted ones match the moment you chose.',
      impact:
        'Each hanger is filled. Canopy Thrift gives neighbors something to wear for the moment ahead.',
    },
    facts: cacFactsFor('clothing'),
    cac: {
      title: 'CAC Canopy Thrift',
      body: 'CAC provides access to clothing and essential items for neighbors facing financial hardship.',
    },
  },
  {
    id: 'youth',
    label: 'Youth',
    topic: 'Childcare and youth',
    name: 'Childcare & Youth Needs',
    description: 'Every child needs the same basics, all year round.',
    heading: 'Room for every rider',
    takeaway:
      'Every child deserves to start the ride on equal footing, in every season.',
    modeNotes: {
      challenge:
        'Marked riders stand for children living below the poverty line. Switch the place to compare.',
      impact: 'With support, every rider boards on equal footing.',
    },
    facts: cacFactsFor('youth'),
    cac: {
      title: 'CAC Meals for Kids',
      body: 'When schools close for the summer, CAC’s Meals for Kids provides summer meals to local children in the Sandy Springs and Dunwoody area.',
    },
  },
  {
    id: 'finances',
    label: 'Finances',
    topic: 'Financial literacy and taxes',
    name: 'Financial Literacy & Tax Credits',
    description: 'Saving and borrowing show how tight household money is.',
    heading: 'Build a little breathing room',
    takeaway:
      'When little is saved, one surprise can push a bill past its due date.',
    modeNotes: {
      challenge:
        'Switch between saving and late payments to see each as a share of 100.',
      impact:
        'Coaching and tax preparation support can help neighbors plan before the surprise arrives.',
    },
    facts: cacFactsFor('finances'),
    cac: {
      title: 'CAC financial education',
      body: 'Explore coaching and tax preparation support from CAC to plan ahead and make the most of every dollar.',
    },
  },
]

/**
 * Published statistics shown in the closing "Zoom out" section, each in its
 * own labeled card (never on one scale). Each is read from the topic that
 * stores it; nothing is shown for a statistic that is not published.
 */
export const zoomOutStatistics: readonly {
  readonly category: CategoryId
  readonly statistic: string
}[] = [
  { category: 'employment', statistic: 'sandy_springs_poverty_rate' },
  { category: 'employment', statistic: 'us_poverty_rate' },
  { category: 'youth', statistic: 'sandy_springs_child_poverty_rate' },
  { category: 'youth', statistic: 'fulton_child_poverty_rate' },
  { category: 'youth', statistic: 'dekalb_child_poverty_rate' },
  { category: 'youth', statistic: 'us_child_poverty_rate' },
]
