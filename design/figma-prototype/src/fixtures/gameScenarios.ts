export type Comparison = {
  text: string
  source: string
  date: string
  geography: string
  unit: string
}
export type GameScenario = {
  id: string
  day: number
  category: string
  title: string
  description: string
  assistance?: string
  outcomeFacts?: {
    label: string
    value: string
    detail: string
    supportOnly?: boolean
  }[]
  comparison?: Comparison
}

// All narrative and dollar amounts are illustrative, not observed statistics.
export const gameScenarios: GameScenario[] = [
  {
    id: "groceries",
    day: 2,
    category: "Everyday essentials · Food",
    title: "What’s on the table?",
    description:
      "Your household needs groceries. How will you cover food needs while leaving room for the rest of the month?",
    assistance:
      "Food support can be part of your plan. In this situation, a community pantry visit covers staple foods, but travel, extra items, and your time still matter.",
    outcomeFacts: [
      {
        label: "Food insecurity in Georgia",
        value: "1 in 6",
        detail: "people face food insecurity in Georgia.",
      },
      {
        label: "CAC’s response in 2025",
        value: "1,096,486.4 lbs",
        detail: "of food provided to CAC clients.",
        supportOnly: true,
      },
    ],
  },
  {
    id: "utilities",
    day: 30,
    category: "Everyday essentials · Utilities",
    title: "Keep the lights on.",
    description:
      "The utility bill is due today. Choose how your household will handle this essential expense.",
    assistance:
      "CAC utility assistance can help a household keep essential service connected while preserving money for other needs.",
  },
]
