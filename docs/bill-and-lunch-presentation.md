# Bill and lunch presentation

November 17, 2026 user changes are published in edition 13 (`cd021853-9a0f-b97f-eb96-83ea50ecdffa`). D052 Maya's birthday is retired completely from new games, without replacement. There are now 50 active cards, 50 complete general fact passages and 33 CAC fact passages, leaving 17 missing CAC passages. Existing runs retain their earlier edition.

## Bills

D015 “The repair bill” is an unpaid invoice for a car repair completed before the month began. Its existing description is: “A repair completed before the month has a bill due today. The car is already repaired; this choice is about the unpaid invoice.” Other independent bills also have authored descriptions in their linked scenario records. Those descriptions were stored but omitted from the previous main bill screen.

Main bill screens show the bill title, its edition-pinned description, due day and amount. Following the user's later receipt-layout request, activating Pay or Ignore calls the existing protected operation immediately, with no separate Submit button. Receipts and facts appear only after the saved result is confirmed; every bill due that day must be resolved before continuing. Each simultaneous bill retains independent controls. The overdue sidebar keeps its compact settlement action. Insufficient-funds behavior, fees, payment idempotence and the six-bill cap are unchanged.

`bill_description(uuid)` checks the occurrence's run owner, edition and individual-player authorization. `get_bill_snapshot` includes the description within its existing stable financial snapshot. No new client access to the private scenario-bill mapping table is granted. Older/unlinked content with no description still loads.

The unselected “Select option” label is removed throughout the shared RadioGroup. Selected styling, aria-pressed state, keyboard support and the Selected label remain.

## Lunch

D046 now says: “You can prepare lunches ahead of time or get lunch out with your coworkers. One option takes more time now; the other costs more money.” The purchase option says “Get lunch out with your coworkers.” Existing price amounts and monthly bindings are preserved.

The user approved the following replacement general fact, with “UK” omitted from displayed copy:

> Sharing a meal can be about more than food. A 2017 study found that people who ate with others more often reported greater life satisfaction and more friends they could rely on.

Source: Dunbar (2017), [Breaking Bread the Functions of Social Eating](https://doi.org/10.1007/s40750-017-0061-4). The source study is a UK national survey; the source geography is retained in the staff evidence. The fact reports an association and does not assert that purchasing a restaurant meal causes wellbeing or that bringing lunch prevents social contact. The historical research year remains fixed; lunch prices continue to update separately.

Suggestion offered, not implemented: rename the existing packed-lunch choice to “Bring a packed lunch and join your coworkers,” keeping its existing cost. This avoids implying that the lower-cost choice necessarily excludes social contact.

## Validation

The 26 compiler/provider tests passed. The frontend suite passed 466 tests initially; two existing Give Up tests needed the new confirmation step, and that entire 12-test file passed after the update. Formatting, lint, type checking and production build passed. The hosted description test verifies owned reads, pinned descriptions, cross-owner hiding and unauthenticated denial. All eight household/mode Day 30 routes passed with the 50-card edition; fixtures rolled back. Nine mocked browser cases completed assertions and screenshots across desktop, mobile and 320px narrow mobile; screenshots of the main bill cards were inspected. The Windows runner required interruption during server shutdown. No price-provider or RentCast calls were needed.
