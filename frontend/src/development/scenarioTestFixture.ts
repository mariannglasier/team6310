// Component test data only; runtime content is read from local Supabase.
import { usdCents, type Scenario } from '../types/domain'
export const localScenario: Scenario = {
  id: 'local-day4',
  versionId: 'local-test-edition',
  categoryId: 'local-test-category',
  title: 'A decision for today',
  description: 'Choose how your household responds to this test situation.',
  scheduleType: 'non_scheduled',
  choices: [
    {
      id: 'receive',
      text: 'Receive assistance',
      balanceChange: usdCents(2500),
      responseText: 'Your household received $25.',
    },
    {
      id: 'pay',
      text: 'Pay an unexpected fee',
      balanceChange: usdCents(-1500),
      responseText: 'Your household paid the $15 fee.',
    },
    {
      id: 'decline',
      text: 'Decline assistance',
      balanceChange: usdCents(0),
      responseText: 'You declined assistance. Your balance is unchanged.',
    },
  ].map((choice) => ({
    ...choice,
    scenarioId: 'local-day4',
    versionId: 'local-test-edition',
  })),
}
