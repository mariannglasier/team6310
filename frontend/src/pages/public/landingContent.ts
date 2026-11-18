// Team-supplied landing copy. This is presentation content, not scenario data.
export const landingContent = {
  eyebrow: 'The CAC Poverty Simulation',
  headline: 'Financial hardship can happen to anyone. How would you respond?',
  introduction:
    'Explore the decisions households face in Sandy Springs and Dunwoody. Learn the Community Assistance Center’s role in helping neighbors thrive.',
  context:
    'Accept the challenge to step into a fictional household’s shoes. Balance competing needs for 30 days and reflect on choices shaped by limited resources.',
  steps: [
    {
      icon: 'house',
      title: 'Choose a household',
      description:
        'Meet a fictional household with its own circumstances and resources.',
    },
    {
      icon: 'receipt',
      title: 'Make choices and track your balance',
      instructions: [
        'Read the situation. Selecting an option confirms your choice.',
        'Check your balance. Spending lowers it, income raises it, and some choices leave it unchanged.',
        'Review what happened, then continue to the next day.',
      ],
    },
    {
      icon: 'chart',
      title: 'Reflect on the experience',
      description:
        'Reflect on the trade-offs you made, then try another run with CAC assistance to see how its services can help your household.',
    },
  ],
} as const
