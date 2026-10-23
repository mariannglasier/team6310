# Plan: Add the Day 15 Car-Repair Financial Decision

## Goal
Replace the current noninteractive Day 1 placeholder with a complete halfway-through-the-month car-repair decision flow. The screen must make the household’s available money, current day, upcoming expenses, decision options, immediate consequence, and resulting financial change visible enough that a participant is not choosing blindly.

The selected repair response will also affect the completion screen so the decision feels consequential. The existing public setup flow, admin portal, header behavior, completion CTAs, and replay controls remain intact.

## Confirmed Product Decisions

- `Begin Simulation` will open the Day 15 car-repair scenario directly; the current Day 1 placeholder will be removed rather than retained as an extra step.
- Every player sees three core responses. A fourth response appears only when the scenario was configured **With CAC Support**.
- A participant must explicitly select and submit a response before seeing its consequence.
- The consequence updates the visible available balance and household circumstances immediately.
- The selected response carries into the completion-screen result, including the ending balance and a summary of the repair decision.
- Continuing from the consequence advances to the existing completion screen.
- Replaying either the same scenario or the opposite CAC-support scenario clears the prior repair selection and consequence before the next run.

## Files to Change

### `src/App.tsx`
Add scenario data, decision state, derived financial values, the interactive Day 15 decision/consequence UI, and completion-screen integration.

### `src/index.css`
Replace/extend the minimal placeholder decision styles with responsive styles for the financial summary, expense list, response cards, submitted consequence, and completion result. Reuse the existing grayscale editorial tokens, borders, and offset shadows; reserve green for the submitted/success consequence and red only for a genuinely negative projected shortfall or error.

No admin files, routing, entrypoints, global font wiring, or dependencies will change.

## Data Model and Scenario Fixtures

Add local types near the existing public-flow types:

- `RepairChoiceId = "pay" | "transit" | "plan" | "cac"`
- `UpcomingExpense = { label: string; dueDay: number; amount: number }`
- `RepairChoice = { id; title; summary; immediateCost; consequence; circumstance; endingAdjustment; supportOnly? }`

Add persona-specific Day 15 fixture data so the financial panel is concrete rather than generic:

### Maya and Eli
- Day 15 available balance: `$980`
- Upcoming expenses:
  - Rent — Day 18 — `$520`
  - Utilities — Day 22 — `$125`
  - Groceries — Day 26 — `$190`
- Upcoming total: `$835`

### Jordan
- Day 15 available balance: `$1,050`
- Upcoming expenses:
  - Rent — Day 18 — `$650`
  - Utilities — Day 22 — `$130`
  - Groceries — Day 26 — `$175`
- Upcoming total: `$955`

Keep these fixtures local to `App.tsx`, matching the project’s current prototype-data pattern.

## Repair Responses

Present response cards as a single-select radio group. Each card shows the response title, what happens now, and the immediate amount due, without revealing the full consequence before submission.

1. **Pay the $350 repair now**
   - Immediate cost: `$350`
   - Car is repaired and work transportation is protected.
   - The remaining balance is reduced by `$350`.
   - Completion ending-balance adjustment: `$0` (baseline outcome).

2. **Delay the repair and use transit or rideshare**
   - Immediate cost: `$90` for transportation through the remainder of the month.
   - The player preserves `$260` compared with paying now, but the car remains unavailable and commuting is less reliable.
   - Completion ending-balance adjustment: `+$260`.

3. **Use a repair payment plan**
   - Immediate cost: `$125`.
   - The car is repaired, but the household takes on two future `$130` payments (`$385` total cost including fees).
   - Completion ending-balance adjustment: `+$225` for the current month; the consequence explicitly calls out the future obligation so the higher displayed balance is not framed as a free benefit.

4. **Pay for the repair and ask CAC for help with essentials** — only when support is `"with"`
   - Immediate repair cost: `$350`.
   - The car is repaired; the prototype assumes `$200` of eligible upcoming essential expenses can be covered after a CAC intake.
   - The copy must state that real assistance depends on eligibility and availability.
   - Completion ending-balance adjustment: `+$200`.
   - Mark the final result as CAC support used.

The response data should be defined once and used for both option rendering and consequence/result calculations.

## State and Derived Values

Inside `PublicFlow`, add:

- `repairChoiceId: RepairChoiceId | null`
- `decisionSubmitted: boolean`

Derive from the selected persona and choice:

- Day 15 starting balance
- Upcoming-expense total
- Immediate cost
- Balance after the submitted decision
- Projected amount after listed upcoming expenses
  - For the CAC response, subtract `$200` from the upcoming total before calculating the projection.
- Completion ending balance
  - Existing persona baseline (`$214` for Maya and Eli; `$486` for Jordan) plus the choice’s `endingAdjustment`.

Add a single `startDecision()` helper used by `Begin Simulation` and both replay paths. It clears `repairChoiceId` and `decisionSubmitted`, then opens the decision screen. Update replay handling as follows:

- Replay same scenario: keep persona and support, clear decision state, return to review as it does now; `Begin Simulation` then opens a clean decision.
- Replay with opposite assistance: toggle support, clear decision state, return to review.
- If a stale `"cac"` choice could ever exist after toggling to no support, clearing through the shared helper prevents it from rendering or affecting calculations.

## Day 15 Decision Screen

Replace the current `public-placeholder public-decision` section with a purpose-built decision layout while retaining the standard public header.

### 1. Scenario heading
- Overline: `Day 15 · Unexpected expense`
- Heading: `Your car needs a $350 repair.`
- Intro copy: the car is needed for work, but paying now may make upcoming bills harder to cover.

### 2. Financial situation summary
Make the information prominent above the choices:

- A dark high-contrast available-balance card showing the persona-specific Day 15 balance.
- Current day: `15 of 30`.
- Repair estimate: `$350`.
- Upcoming-expense total.
- An expense list/table with expense name, due day, and amount.
- A short neutral prompt: `Review what is due before choosing a response.`

On smaller screens, stack this information in reading order: day/context, available balance, upcoming expenses, then responses.

### 3. Response selection
- Render only eligible responses; omit the CAC response when support is `"without"`.
- Use `role="radiogroup"`, `role="radio"`, and `aria-checked` consistently with the existing household/support selection pattern.
- Give selected cards a strong inset/offset black treatment matching existing selection cards.
- Keep `Submit Decision` disabled until a response is selected.
- Keep a secondary `Back to Review` action before submission.

### 4. Submitted consequence
After `Submit Decision`:

- Lock the response cards from further selection while the consequence is displayed.
- Replace the submission controls with a clearly separated consequence panel.
- Use green only as the status accent indicating that the decision was recorded—not to imply that every financial outcome is objectively good.
- Show:
  - Selected response title
  - Immediate consequence copy
  - `Balance before`
  - `Cost today`
  - `Balance after`
  - Projected balance after the listed upcoming expenses
  - Circumstance change (for example, car repaired, car unavailable, future payments added, or CAC intake scheduled)
- If the projected amount is below zero, display that projection with the existing error token and plain-language `Projected shortfall`; otherwise keep it grayscale.
- Include `Change Decision`, which returns to the selectable state while preserving the currently selected option.
- Include `Continue Simulation`, which advances to `complete`.
- Move keyboard focus to the consequence heading after submission using a ref and `tabIndex={-1}` so the update is apparent to keyboard and assistive-technology users.

## Completion-Screen Integration

Update the existing result cards without redesigning the completion page:

- Replace the hardcoded ending balance with the derived completion ending balance.
- Replace the fixed `DIFFICULT TRADE-OFFS / 8` card with `CAR REPAIR DECISION` and the selected response’s short label.
- Use its supporting copy to summarize the circumstance that carried forward.
- Keep the CAC Support card, but calculate its value as:
  - `Used` only if the selected choice is `"cac"`.
  - `Available, not used` when support was enabled but another response was chosen.
  - `Not available` when the scenario was configured without CAC support.
- Keep the existing prototype-results disclaimer.
- Guard the completion screen against a missing repair choice. Normal navigation will prevent this, but derived values should have safe defaults to avoid runtime errors during development/hot reload.

## Styling Approach

Add scoped classes such as:

- `.public-decision`
- `.public-decision__heading`
- `.public-financial-summary`
- `.public-balance-card`
- `.public-expense-list`
- `.public-repair-options`
- `.public-repair-option`
- `.public-consequence`
- `.public-consequence__numbers`
- `.is-shortfall`

Visual rules:

- Use only existing CSS variables (`--ink`, `--paper`, `--canvas`, `--surface`, `--line`, `--success`, `--error`, and related soft variants).
- Match existing `2px` borders, square corners, editorial uppercase labels, and offset shadows.
- Do not add decorative imagery, icons, gradients, or new colors.
- Use tabular-number styling for balances and amounts to make comparison easier.
- Maintain strong contrast and visible focus behavior inherited from the existing global controls.
- At `980px`, collapse the main financial/decision columns if needed.
- At `680px`, stack summary metrics, expense rows, response cards, consequence values, and actions; buttons become full width where appropriate.

## Interaction and Edge Cases

- Submit remains disabled when no response is selected.
- The CAC response never renders without CAC support.
- Changing a decision hides the consequence and allows a new submission.
- A submitted choice is the only choice used for completion calculations; merely selecting an option is not enough.
- Returning to Review and beginning again starts a clean decision.
- Both replay controls clear the old choice and consequence.
- Switching to the opposite CAC setting cannot retain an ineligible CAC choice.
- Currency values use `toLocaleString()` and are presented consistently with a dollar sign.
- The page should not imply that one response is morally correct; consequence language remains factual and trade-off oriented.
- CAC-specific copy must preserve the prototype caveat that actual support depends on eligibility and availability.

## Verification

1. Run `npm run build` and fix any TypeScript/JSX/CSS build errors.
2. In the preview, test both personas with **Without CAC Support**:
   - Confirm three choices appear.
   - Confirm balance and expenses differ by persona.
   - Confirm submit is disabled until selection.
   - Submit each core response and verify all displayed calculations.
3. Test both personas with **With CAC Support**:
   - Confirm the fourth CAC choice appears.
   - Submit it and verify the `$200` upcoming-expense adjustment, caveat text, and final CAC status.
4. Verify `Change Decision` returns to selection and a second submission replaces the prior consequence.
5. Verify `Continue Simulation` carries the chosen response, ending balance, and CAC usage into the completion screen.
6. Verify `Replay Same Scenario` and `Replay With/Without CAC Assistance` both return to Review and produce a clean decision when restarted; confirm the conditional CAC option changes appropriately.
7. Check desktop and narrow/mobile preview widths for overflow, readable expense rows, action stacking, and visible selected/focus states.
8. Confirm unrelated public setup screens, completion CTAs, navigation, and the admin portal remain unchanged.
