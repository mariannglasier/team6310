// Static content for the Explore Data page (`/data`).
//
// Phase 1: every figure here is a hand-entered snapshot. No external API is
// called. Each fact keeps its value, unit, geography, period, and source so a
// later phase can replace this module with approved, API-backed statistics.
// Items marked "Reporting year to be confirmed" came from the team's research
// notes without a stated period; see docs/data-explorer.md.

export type Mode = 'challenge' | 'impact'

export type CategoryId =
  'housing' | 'food' | 'employment' | 'clothing' | 'youth' | 'finances'

export type SourceId =
  | 'jchs'
  | 'eiaRecs'
  | 'fultonFilings'
  | 'ersFoodSecurity'
  | 'ersFoodPrices'
  | 'acfb'
  | 'acs'
  | 'blsEducation'
  | 'censusPoverty'
  | 'fedShed'
  | 'irsVita'
  | 'irsEitc'
  | 'cac'

export interface SourceRef {
  readonly name: string
  readonly title: string
  readonly url: string
}

export const sources: Readonly<Record<SourceId, SourceRef>> = {
  jchs: {
    name: 'Harvard Joint Center for Housing Studies',
    title: "America's Rental Housing 2024",
    url: 'https://www.jchs.harvard.edu/americas-rental-housing-2024',
  },
  eiaRecs: {
    name: 'U.S. Energy Information Administration',
    title: 'Residential Energy Consumption Survey (RECS) 2020',
    url: 'https://www.eia.gov/consumption/residential/data/2020/',
  },
  fultonFilings: {
    name: 'Fulton County open data',
    title: 'Monthly Eviction Filings',
    url: 'https://sharefulton.fultoncountyga.gov/dataset/Monthly-Eviction-Filings/cbu2-qs5w/about_data',
  },
  ersFoodSecurity: {
    name: 'USDA Economic Research Service',
    title: 'Food Security in the U.S. — Key Statistics & Graphics',
    url: 'https://www.ers.usda.gov/topics/food-nutrition-assistance/food-security-in-the-us/key-statistics-graphics',
  },
  ersFoodPrices: {
    name: 'USDA Economic Research Service',
    title: 'Food Price Outlook',
    url: 'https://www.ers.usda.gov/data-products/food-price-outlook/',
  },
  acfb: {
    name: 'Atlanta Community Food Bank',
    title: 'Child hunger in metro Atlanta',
    url: 'https://www.acfb.org/',
  },
  acs: {
    name: 'U.S. Census Bureau',
    title: 'American Community Survey, Sandy Springs city (place 1368516)',
    url: 'https://data.census.gov/profile?g=160XX00US1368516',
  },
  blsEducation: {
    name: 'U.S. Bureau of Labor Statistics',
    title: 'Education pays: earnings and unemployment by education',
    url: 'https://www.bls.gov/emp/chart-unemployment-earnings-education.htm',
  },
  censusPoverty: {
    name: 'U.S. Census Bureau',
    title: 'Poverty in the United States: 2023',
    url: 'https://www.census.gov/library/publications/2024/demo/p60-283.html',
  },
  fedShed: {
    name: 'Federal Reserve',
    title: 'Economic Well-Being of U.S. Households in 2023',
    url: 'https://www.federalreserve.gov/publications/2024-economic-well-being-of-us-households-in-2023-executive-summary.htm',
  },
  irsVita: {
    name: 'Internal Revenue Service',
    title: 'Free tax return preparation for qualifying taxpayers',
    url: 'https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers',
  },
  irsEitc: {
    name: 'Internal Revenue Service',
    title: 'Earned Income Tax Credit (EITC)',
    url: 'https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit-eitc',
  },
  cac: {
    name: 'Community Assistance Center',
    title: 'Programs, mission and ways to get help',
    url: 'https://ourcac.org/',
  },
}

export interface ExplorerFact {
  readonly id: string
  /** Display value, including its unit symbol when it has one. */
  readonly value: string
  /** What the value measures. */
  readonly label: string
  readonly geography: string
  readonly period: string
  readonly sourceId: SourceId
  /** 0–100 share of a population, drawn as a labeled meter. */
  readonly percent?: number
}

export const facts = {
  rentBurden: {
    id: 'rent-burden',
    value: '22.4 million',
    label:
      'renter households were cost-burdened, paying more than 30% of income for housing. That is about half of all renter households.',
    geography: 'United States',
    period: '2022',
    sourceId: 'jchs',
    percent: 50,
  },
  energyInsecurity: {
    id: 'energy-insecurity',
    value: '34%',
    label:
      'of households faced a challenge paying energy bills or keeping their home at a safe temperature.',
    geography: 'United States',
    period: '2020',
    sourceId: 'eiaRecs',
    percent: 34,
  },
  fultonFilings: {
    id: 'fulton-filings',
    value: 'Monthly',
    label:
      'eviction filings for Fulton County are published as open data, so changes can be followed month to month.',
    geography: 'Fulton County, GA',
    period: 'Updated monthly',
    sourceId: 'fultonFilings',
  },
  foodInsecurity: {
    id: 'food-insecurity',
    value: '13.5%',
    label:
      'of households had difficulty providing enough food for everyone at some time during the year because of a lack of resources.',
    geography: 'United States',
    period: '2023',
    sourceId: 'ersFoodSecurity',
    percent: 13.5,
  },
  foodPrices: {
    id: 'food-prices',
    value: '+11.4%, then +5.0%',
    label:
      'year-over-year increase in grocery (food-at-home) prices in 2022 and then 2023.',
    geography: 'United States',
    period: '2022 and 2023',
    sourceId: 'ersFoodPrices',
  },
  childHunger: {
    id: 'child-hunger',
    value: '1 in 6',
    label: 'children in metro Atlanta may face hunger tonight.',
    geography: 'Metro Atlanta',
    period: 'Reporting year to be confirmed',
    sourceId: 'acfb',
    percent: 16.7,
  },
  languageAtHome: {
    id: 'language-at-home',
    value: '20.1%',
    label: 'of residents speak a language other than English at home.',
    geography: 'Sandy Springs, GA',
    period: 'ACS 5-year estimate',
    sourceId: 'acs',
    percent: 20.1,
  },
  earningsByEducation: {
    id: 'earnings-education',
    value: '$899 vs. $1,493',
    label:
      'median weekly earnings with a high school diploma versus a bachelor’s degree.',
    geography: 'United States, workers age 25 and over',
    period: '2023',
    sourceId: 'blsEducation',
  },
  unemploymentByEducation: {
    id: 'unemployment-education',
    value: '3.9% vs. 2.2%',
    label:
      'unemployment rate with a high school diploma versus a bachelor’s degree.',
    geography: 'United States, workers age 25 and over',
    period: '2023',
    sourceId: 'blsEducation',
  },
  clothingPending: {
    id: 'clothing-pending',
    value: 'Coming soon',
    label: 'Clothing closet totals, once CAC provides approved figures.',
    geography: 'Sandy Springs and Dunwoody',
    period: 'Pending CAC-approved figures',
    sourceId: 'cac',
  },
  mealsForKids: {
    id: 'meals-for-kids',
    value: '660+',
    label:
      'local families receive summer meals through CAC’s Meals for Kids when school meals pause.',
    geography: 'Sandy Springs and Dunwoody',
    period: 'Summer, reporting year to be confirmed',
    sourceId: 'cac',
  },
  childPovertyUs: {
    id: 'child-poverty-us',
    value: '13.7%',
    label: 'of children under 18 were living below the poverty line.',
    geography: 'United States',
    period: '2023',
    sourceId: 'censusPoverty',
    percent: 13.7,
  },
  childPovertySandySprings: {
    id: 'child-poverty-sandy-springs',
    value: '1,600–2,000',
    label:
      'children are estimated to live below the federal poverty line (about 18.4% of residents are under 18; the overall poverty rate is 8.5%).',
    geography: 'Sandy Springs, GA',
    period: 'ACS estimate, derived',
    sourceId: 'acs',
  },
  cushion: {
    id: 'cushion',
    value: '37%',
    label:
      'of adults would not cover a hypothetical $400 emergency using only cash or its equivalent.',
    geography: 'United States',
    period: '2023',
    sourceId: 'fedShed',
    percent: 37,
  },
  freeTaxHelp: {
    id: 'free-tax-help',
    value: '$67,000',
    label:
      'is the general income limit for free tax preparation through the IRS Volunteer Income Tax Assistance (VITA) program.',
    geography: 'United States',
    period: '2025 filing season (tax year 2024)',
    sourceId: 'irsVita',
  },
  unclaimedEitc: {
    id: 'unclaimed-eitc',
    value: 'About 1 in 5',
    label:
      'eligible workers do not claim the Earned Income Tax Credit, according to IRS estimates.',
    geography: 'United States',
    period: 'IRS estimate, recent filing years',
    sourceId: 'irsEitc',
    percent: 20,
  },
  povertySandySprings: {
    id: 'poverty-sandy-springs',
    value: '8.5%',
    label: 'of residents live below the poverty line.',
    geography: 'Sandy Springs, GA',
    period: 'ACS 5-year estimate',
    sourceId: 'acs',
    percent: 8.5,
  },
  povertyUs: {
    id: 'poverty-us',
    value: '11.1%',
    label: 'of people lived below the official poverty line.',
    geography: 'United States',
    period: '2023',
    sourceId: 'censusPoverty',
    percent: 11.1,
  },
} as const satisfies Record<string, ExplorerFact>

export interface CategoryContent {
  readonly id: CategoryId
  /** Short tab label. */
  readonly label: string
  /** Full topic name used for the panel's accessible name. */
  readonly topic: string
  readonly heading: string
  readonly intro: string
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
    heading: 'Keep the lights on',
    intro:
      'Rent and utility bills arrive whether or not the money does. Switch between rent and utilities, then see what support can change.',
    takeaway:
      'When housing or power bills outrun income, one month can go dark. Support can help the lights stay on.',
    modeNotes: {
      challenge:
        'Each window stands for a share of households under pressure. Try the season to see how energy bills follow the weather.',
      impact:
        'Some windows come back on. Support steps in when a crisis threatens a home or a power bill.',
    },
    facts: [facts.rentBurden, facts.energyInsecurity, facts.fultonFilings],
    cac: {
      title: 'CAC financial assistance',
      body: 'CAC offers financial assistance to help neighbors facing a crisis and works to prevent homelessness and hunger.',
    },
  },
  {
    id: 'food',
    label: 'Food',
    topic: 'Food and nutrition',
    heading: 'Stretch a grocery budget',
    intro:
      'Prices move while a budget stays put. Raise the price of groceries, then decide what stays in the cart.',
    takeaway:
      'A few percent on the price tag can take a few items off the table.',
    modeNotes: {
      challenge:
        'Raise the prices and watch the same $500 buy less. Remove items until the total fits the budget, then check out.',
      impact:
        'Items you remove come back from the pantry shelf, so your budget goes further.',
    },
    facts: [facts.foodInsecurity, facts.foodPrices, facts.childHunger],
    cac: {
      title: 'CAC food pantry',
      body: 'CAC provides food assistance to neighbors facing financial hardship, so grocery money can stretch to other essentials.',
    },
  },
  {
    id: 'employment',
    label: 'Employment',
    topic: 'Employment and adult education',
    heading: 'Open more doors',
    intro:
      'Job postings list what employers expect. Set a profile and see which sample postings fit, then see how classes change the board.',
    takeaway:
      'Skills open doors. Education and language classes widen the board.',
    modeNotes: {
      challenge:
        'Change education, English, and computer skills. Postings that need more stay visible but closed.',
      impact:
        'With English and computer skills classes, more of the board opens up.',
    },
    facts: [
      facts.languageAtHome,
      facts.earningsByEducation,
      facts.unemploymentByEducation,
    ],
    cac: {
      title: 'CAC adult education',
      body: 'The CAC offers a variety of adult education programs. English as a Second or Other Language classes or computer skills classes could help you be more qualified for jobs.',
    },
  },
  {
    id: 'clothing',
    label: 'Clothing',
    topic: 'Essential goods and clothing',
    heading: 'Dressed for what’s next',
    intro:
      'Clothes carry people into interviews, classrooms, and cold mornings. Choose a moment and watch the belt roll by.',
    takeaway:
      'The right clothes at the right moment can be hard to afford all at once.',
    modeNotes: {
      challenge:
        'Empty hangers pass by. The highlighted ones match the moment you chose.',
      impact:
        'Each hanger is filled. The clothing closet gives neighbors something to wear for the moment ahead.',
    },
    facts: [facts.clothingPending],
    cac: {
      title: 'CAC clothing closet',
      body: 'CAC provides access to clothing and essential items for neighbors facing financial hardship.',
    },
  },
  {
    id: 'youth',
    label: 'Youth',
    topic: 'Childcare and youth',
    heading: 'Room for every rider',
    intro:
      'Children need the same basics all year, but each season brings different costs. Pick a season and see who is left behind.',
    takeaway:
      'Every child deserves to start the ride on equal footing, in every season.',
    modeNotes: {
      challenge:
        'Marked riders stand for children who may go without. Change the season to see what is missing.',
      impact: 'With support, every rider boards on equal footing.',
    },
    facts: [
      facts.childHunger,
      facts.mealsForKids,
      facts.childPovertyUs,
      facts.childPovertySandySprings,
    ],
    cac: {
      title: 'CAC Meals for Kids',
      body: 'When schools close for the summer, CAC’s Meals for Kids provides summer meals to over 660 local families in the Sandy Springs and Dunwoody area.',
    },
  },
  {
    id: 'finances',
    label: 'Finances',
    topic: 'Financial literacy and taxes',
    heading: 'Build a little breathing room',
    intro:
      'Use the budget workbench to plan for an unexpected cost, then see how tax help fits in.',
    takeaway:
      'A small emergency can strain a tight budget. Planning ahead and available support may help.',
    modeNotes: {
      challenge:
        'Plan before the surprise. Try changing your allocations to see the trade-offs.',
      impact:
        'Coaching and tax preparation support can help neighbors plan before the surprise arrives.',
    },
    facts: [facts.cushion, facts.freeTaxHelp, facts.unclaimedEitc],
    cac: {
      title: 'CAC financial education',
      body: 'Explore coaching and tax preparation support from CAC to plan ahead and make the most of every dollar.',
    },
  },
]

export const zoomOutFacts: readonly ExplorerFact[] = [
  facts.povertySandySprings,
  facts.povertyUs,
  facts.childPovertyUs,
]
