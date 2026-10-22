export type SupportId = "with-cac" | "without-cac"

export const supportOptions: {
  id: SupportId
  label: string
  eyebrow: string
  description: string
  features: string[]
  summary: string
}[] = [
  {
    id: "with-cac",
    label: "With CAC support",
    eyebrow: "A community alongside you",
    description: "Explore how a community safety net can make a difference when everyday needs compete.",
    features: [
      "Explore food assistance and community resources",
      "Consider support alongside household decisions",
      "See the role of a local safety net",
    ],
    summary: "Community resources are part of your scenario.",
  },
  {
    id: "without-cac",
    label: "Without CAC support",
    eyebrow: "A different perspective",
    description: "Explore the same everyday trade-offs using the household’s income and available balance, without CAC assistance.",
    features: [
      "Plan around your household’s existing resources",
      "Weigh essential needs against unexpected costs",
      "Reflect on where additional support could help",
    ],
    summary: "Your scenario does not include CAC assistance.",
  },
]
