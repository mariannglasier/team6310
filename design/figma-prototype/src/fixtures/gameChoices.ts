export type GameChoice = {
  id: string
  title: string
  description: string
  amount: number
  category: string
  outcome: string
  supportOnly?: boolean
}

export const gameChoices: Record<string, GameChoice[]> = {
  groceries: [
    {
      id: "weekly-shop",
      title: "Plan a weekly grocery shop",
      description:
        "A wider mix of ingredients, with meals planned for the week.",
      amount: -60,
      category: "Groceries",
      outcome:
        "You have ingredients and a meal plan for the week. A bigger purchase today means fewer grocery trips to plan.",
    },
    {
      id: "essentials",
      title: "Pick up the essentials",
      description:
        "Staples for the next few days. Another trip will be needed sooner.",
      amount: -35,
      category: "Groceries",
      outcome:
        "You covered immediate food needs and kept more cash available. You’ll need to make time for another grocery trip sooner.",
    },
    {
      id: "food-support",
      title: "Visit the community pantry",
      description: "Receive staple foods from the CAC community pantry.",
      amount: 0,
      category: "CAC food assistance",
      outcome:
        "The CAC community pantry provided staple foods at no charge, preserving your household balance for other essentials.",
      supportOnly: true,
    },
  ],
  utilities: [
    {
      id: "pay-utilities",
      title: "Pay the utility bill",
      description: "Cover the full bill from your household balance.",
      amount: -45,
      category: "Utilities",
      outcome:
        "You paid the utility bill and kept this essential service current. That leaves less money available for other needs.",
    },
    {
      id: "utility-assistance",
      title: "Use CAC utility assistance",
      description: "Explore emergency assistance for this essential bill.",
      amount: 0,
      category: "CAC utility assistance",
      outcome:
        "CAC assistance covered the utility bill, preserving your household balance for other essentials.",
      supportOnly: true,
    },
  ],
}
