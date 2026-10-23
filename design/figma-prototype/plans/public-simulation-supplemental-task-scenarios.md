# Plan: Add Three Public-Simulation Usability Task Scenarios

## Goal

Produce three study-ready usability task scenarios that supplement the study’s existing five scenarios and remain strictly executable in the current interactive public prototype. The scenarios will focus on meaningful alternate paths and recovery/reconsideration behaviors rather than the out-of-scope employee portal or unimplemented group-play functionality.

Because the existing five scenarios are not available in the repository, the new set will be framed as complementary coverage based on the implemented prototype. The final deliverable will include a short note asking the study owner to perform a final duplication check against the original five before fielding the study.

## Confirmed Scope

- Produce exactly **three** additional scenarios.
- Cover the **public simulation only**.
- Use only interactions available in the **current interactive prototype**.
- Exclude Employee Admin, Host a Group, and Join a Group.
- Do not propose prototype changes or modify application code.
- Write each scenario in a study-ready structure suitable for a moderated usability test.
- Avoid unsupported outcomes: donation, CAC website, and data visualization actions may display prototype placeholders but do not navigate externally.

## Standard Scenario Format

Each scenario will contain:

1. **Scenario title** — a short researcher-facing label.
2. **Participant context** — enough background to establish a goal without naming specific UI labels or prescribing clicks.
3. **Participant task prompt** — concise wording that can be read or handed directly to a participant.
4. **Research objective** — the behavior or comprehension question the task is intended to assess.
5. **Starting state** — where the moderator should place the participant and any selections that must already exist.
6. **Expected path** — the valid high-level interaction sequence for moderator reference, not shown to the participant.
7. **Success criteria** — observable completion conditions tied to the prototype.
8. **Observation prompts** — a small set of neutral points for the moderator to watch; these will not coach the participant.
9. **Prototype boundary note** — only where a task ends at a placeholder or where the prototype compresses the simulated month.

Task prompts will be goal-oriented and will avoid exposing exact control labels wherever doing so would undermine discoverability testing. Moderator notes may name controls precisely so results can be scored consistently.

## Scenario 1: Review and Correct the Setup

### Participant context and prompt

Ask the participant to prepare an individual simulation for **Jordan without CAC support**, but initially place them on the Review screen with a different valid setup (Maya and Eli with CAC support). The participant’s goal is to notice the mismatch, correct both settings, and begin the simulation.

### Research objective

Assess whether participants can:

- Understand the Review screen’s household and support summary.
- Find and use the edit pathways without restarting the entire flow.
- Recognize that changing one setting preserves or appropriately updates the rest of the setup.
- Confirm the corrected configuration before entering the Day 15 decision.

### Starting state

- Public flow.
- Review screen.
- Household: Maya and Eli.
- Support: With CAC Support.

### Expected path

1. Use the household edit action to select Jordan.
2. Return through the support step and choose Without CAC Support.
3. Reach Review and verify Jordan / Without CAC Support.
4. Begin the simulation.
5. Stop when the Day 15 car-repair decision screen is visible.

The route may naturally pass through the support step after changing household; this is valid and should not be treated as an error.

### Success criteria

- The final Review state shows Jordan and Without CAC Support.
- The participant begins the simulation successfully.
- The Day 15 screen displays Jordan’s available balance of $1,050.
- Only the three non-CAC repair responses are available.

### Observation prompts

- Does the participant verify both summary fields before continuing?
- Do the “Change Household” and “Change Support” actions match their expectations?
- Do they understand why the CAC repair response is absent after choosing no support?

## Scenario 2: Reconsider a Financial Decision

### Participant context and prompt

Place the participant at Maya and Eli’s Day 15 decision with CAC support enabled. Ask them to first choose the payment plan, review its consequences, then reconsider and switch to temporary transit before continuing through the month.

The participant-facing wording will describe the goals rather than dictate button labels: make an initial choice, inspect what it changes, revise the choice, and finish with temporary transit as the recorded decision.

### Research objective

Assess whether participants can:

- Compare the available repair responses and submit one.
- Interpret balance-before, cost-today, balance-after, projected-expense, and circumstance information.
- Discover that a submitted choice can still be changed.
- Distinguish a current-month cash benefit from the payment plan’s future obligation.
- Verify that the revised decision, not the initial one, carries into completion.

### Starting state

- Day 15 decision screen.
- Household: Maya and Eli.
- Support: With CAC Support.
- No repair response selected or submitted.

### Expected path

1. Select Choose a payment plan.
2. Submit the decision.
3. Review the displayed consequence, including the two future $130 payments.
4. Return to the selectable state using Change Decision.
5. Select Use transit temporarily.
6. Submit the revised decision.
7. Continue to the completion screen.

### Success criteria

- The participant successfully submits the payment-plan response and locates its consequence details.
- The participant changes the recorded response to Use transit temporarily.
- The completion result names Use transit temporarily as the car-repair decision.
- The completion balance is $474 for Maya and Eli ($214 baseline plus the $260 current-month adjustment).
- CAC Support reads Available, not used.

### Observation prompts

- Which consequence numbers receive attention, and how does the participant explain them?
- Do they understand that Change Decision preserves the current selection while reopening the options?
- Does the completion summary make it clear that the second decision replaced the first?

## Scenario 3: Compare the Same Household With and Without Assistance

### Participant context and prompt

Ask the participant to complete Jordan’s month with CAC support by selecting the CAC support response, then replay the scenario without assistance and identify how the available repair choices change. The task ends after the replayed Day 15 decision screen is visible; it does not require a second full completion.

### Research objective

Assess whether participants can:

- Recognize that the CAC response is conditional on the support setting.
- Understand the CAC eligibility/availability caveat and the distinction between support being available and used.
- Interpret CAC’s effect on upcoming eligible essentials in the consequence and completion summary.
- Use the replay control that intentionally toggles the assistance setting.
- Confirm that replay clears the previous repair selection and submitted consequence.

### Starting state

- Day 15 decision screen.
- Household: Jordan.
- Support: With CAC Support.
- No repair response selected or submitted.

### Expected path

1. Select Ask CAC for support.
2. Submit and review the consequence.
3. Continue to completion.
4. Confirm CAC Support is marked Used.
5. Choose the replay option that switches to Without CAC Assistance.
6. Review the updated setup and begin the simulation again.
7. Stop at the replayed Day 15 decision screen.

### Success criteria

- The first run exposes four repair responses, including Ask CAC for support.
- The submitted consequence communicates that the prototype applies $200 to eligible upcoming essentials and that real assistance depends on eligibility and availability.
- Jordan’s first-run completion balance is $686 ($486 baseline plus the $200 assistance adjustment).
- The completion summary marks CAC Support as Used.
- The replay Review screen shows Without CAC Support.
- The replayed Day 15 screen contains only three responses, omits the CAC response, and has no preselected or previously submitted decision.

### Observation prompts

- How does the participant explain what CAC support did and did not guarantee?
- Is the difference between “Used,” “Available, not used,” and “Not available” understandable?
- Does the replay label clearly communicate that assistance will be toggled?
- Does the participant notice that the prior decision state has been cleared?

## Content and Ethics Guidelines

- Keep language neutral and avoid implying that any financial response is morally correct.
- Refer to Maya and Eli and Jordan as fictional households.
- Preserve the prototype’s caveat that actual CAC assistance depends on eligibility and availability.
- Do not describe placeholder comparison data as real community data.
- Do not imply that the prototype simulates every day; it begins at Day 15 and advances to completion after the single implemented decision.
- Use exact dollar values only in moderator expectations and scoring criteria when revealing them in the participant prompt would bias behavior.

## Final Deliverable Assembly

1. Add a short introductory note identifying the set as three supplemental public-flow scenarios for the current mid-fidelity prototype.
2. Present the three scenarios in the standard format above.
3. Separate participant-facing text visually from moderator-only guidance so prompts can be copied directly into the study script.
4. Add a closing coverage note explaining that these tasks emphasize setup correction, decision revision, and assisted/unassisted replay behavior.
5. Add a concise caveat that the original five scenarios were unavailable and the study owner should remove or revise any duplicated task before testing.

## Quality Check

Before delivering the scenarios:

- Confirm every expected path against `src/App.tsx` and avoid controls that are absent or placeholders presented as functional destinations.
- Recalculate all expected balances from the local prototype fixtures:
  - Maya and Eli / transit completion: $214 + $260 = $474.
  - Jordan / CAC completion: $486 + $200 = $686.
- Confirm the without-support repair screen has three choices and the with-support screen has four.
- Confirm Scenario 1 ends on Jordan’s Day 15 screen with a $1,050 available balance.
- Confirm Scenario 2’s final completion state reports transit and CAC as Available, not used.
- Confirm Scenario 3’s replay returns to Review with the opposite support setting and starts a clean decision.
- Review participant prompts for accidental click instructions, leading language, or disclosure of expected results.
- Flag possible overlap with the unavailable original five rather than claiming the scenarios are definitively unique.
