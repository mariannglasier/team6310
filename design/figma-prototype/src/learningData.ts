export const learningSources = [
  {
    name: "Federal Reserve",
    title: "Economic Well-Being of U.S. Households in 2023",
    detail: "2023 survey · U.S. adults · Published 2024",
    url: "https://www.federalreserve.gov/publications/2024-economic-well-being-of-us-households-in-2023-executive-summary.htm",
  },
  {
    name: "USDA Economic Research Service",
    title: "Food Security in the U.S. — Key Statistics & Graphics",
    detail: "2023 estimate · U.S. households · Historical figure",
    url: "https://www.ers.usda.gov/topics/food-nutrition-assistance/food-security-in-the-us/key-statistics-graphics",
  },
  {
    name: "Community Assistance Center",
    title: "Programs, mission & ways to get help",
    detail: "Sandy Springs & Dunwoody · Confirm current availability with CAC",
    url: "https://www.ourcac.org/",
  },
]

export const learningTopics = [
  {
    id: "cushion",
    label: "Financial cushion",
    value: 37,
    display: "37%",
    unit: "of U.S. adults",
    headline: "An unexpected bill isn’t always a small setback.",
    description:
      "In 2023, 63% of adults said they would cover a hypothetical $400 emergency entirely with cash or its equivalent. The other 37% would not use only those resources.",
    qualifier:
      "Cash equivalents include savings or a credit card paid in full at the next statement. This does not mean 37% could not pay the expense at all.",
    connection:
      "A low balance changes the choices available. The simulation asks you to weigh immediate needs against keeping a cushion for the next unexpected cost.",
    chartLabel:
      "37 out of every 100 adults would not cover a $400 emergency exclusively with cash or its equivalent.",
    legend: "Would not use only cash or equivalent",
    remainder: "Would use cash or equivalent",
    source: 0,
  },
  {
    id: "food",
    label: "Food security",
    value: 13.5,
    display: "13.5%",
    unit: "of U.S. households",
    headline: "A full month can mean a difficult grocery decision.",
    description:
      "In 2023, 13.5% of U.S. households experienced food insecurity at some time during the year: they had difficulty providing enough food for everyone because of a lack of resources.",
    qualifier:
      "Food insecurity is measured at the household level. It is not the same as saying every person in the household experienced hunger every day.",
    connection:
      "Groceries appear at both the beginning and end of the simulated month. Food support can create room for another essential expense, but time and transportation still matter.",
    chartLabel:
      "13.5 out of every 100 U.S. households experienced food insecurity at some time in 2023.",
    legend: "Experienced food insecurity",
    remainder: "Food secure throughout the year",
    source: 1,
  },
  {
    id: "prices",
    label: "Rising costs",
    value: 65,
    display: "65%",
    unit: "of U.S. adults",
    headline: "When prices rise, the same income has to stretch further.",
    description:
      "In the Federal Reserve’s 2023 survey, 65% of adults said changes in the prices they paid compared with the prior year had made their financial situation worse.",
    qualifier:
      "This measures adults’ reported financial experience, not the inflation rate. It is a national finding, not a local estimate for Sandy Springs or Dunwoody.",
    connection:
      "Housing, utilities, food, and transportation compete for the same balance. For a household on a fixed income, rising costs can narrow that margin even without a new emergency.",
    chartLabel:
      "65 out of every 100 U.S. adults said price changes had made their financial situation worse in 2023.",
    legend: "Reported a worse financial situation",
    remainder: "Did not report a worse situation",
    source: 0,
  },
]

export const cacPrograms = [
  {
    label: "Food & essentials",
    icon: "support" as const,
    title: "Meeting today’s needs. Making room for tomorrow.",
    description:
      "CAC provides food assistance and access to clothing and essential items for neighbors facing financial hardship.",
    connection:
      "In the simulation, pantry options illustrate how food support can leave more of a household’s limited cash available for other needs.",
  },
  {
    label: "Financial assistance",
    icon: "wallet" as const,
    title: "A safety net when the unexpected happens.",
    description:
      "CAC offers financial assistance to help neighbors facing a crisis and works to prevent homelessness and hunger.",
    connection:
      "The simulation’s scheduled bills show how expenses can stack up before the next deposit. Real assistance depends on eligibility and available resources.",
  },
  {
    label: "Education & careers",
    icon: "flag" as const,
    title: "Support beyond a single month.",
    description:
      "CAC offers adult education and career services to help neighbors build skills and work toward greater financial stability.",
    connection:
      "A 30-day simulation cannot capture every path forward. Skills, employment opportunities, and community connections also shape long-term stability.",
  },
]

export function calculateLearningBudget(
  income: number,
  rent: number,
  emergency: number,
  support: boolean,
) {
  const expenses = [
    { label: "Housing", amount: rent, tone: "housing" },
    { label: "Food", amount: support ? 300 : 450, tone: "food" },
    { label: "Transportation", amount: 350, tone: "transport" },
    { label: "Utilities & phone", amount: 250, tone: "utilities" },
    { label: "Other essentials", amount: 300, tone: "other" },
    { label: "Unexpected expense", amount: emergency, tone: "emergency" },
  ]
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  return { expenses, total, remaining: income - total }
}
