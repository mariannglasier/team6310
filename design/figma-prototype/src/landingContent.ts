export const landingContent = {
  navigation: ["Learn", "Donate"],
  hero: {
    title: "One month. Real trade-offs.",
    description:
      "Explore the decisions households face in Sandy Springs and Dunwoody.",
  },
  steps: [
    {
      id: "household",
      title: "Choose a household",
      description:
        "Meet a household in Sandy Springs or Dunwoody with its own circumstances and goals.",
      icon: "home",
      tone: "rose",
    },
    {
      id: "days",
      title: "Navigate 30 days",
      description:
        "Make everyday decisions about housing, transportation, food, health care and more.",
      icon: "journal",
      tone: "blue",
    },
    {
      id: "reflect",
      title: "Reflect on your experience",
      description:
        "See how your choices impact your household and consider broader community solutions.",
      icon: "chart",
      tone: "green",
    },
  ],
  community: {
    title: "Learn how CAC supports our community",
    description:
      "Discover how the Community Assistance Center helps neighbors in Sandy Springs and Dunwoody and how you can get involved.",
  },
  contact: {
    phone: "(770) 552-4889",
    phoneHref: "tel:+17705524889",
    email: "info@ourcac.org",
    taxId: "Tax ID #: 58-1825565",
  },
} as const
