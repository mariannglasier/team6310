# Prototype reference for agents

## Purpose and authority

Use this guide when a user story affects the interface. Read [UI specification](./ui-spec.md) and [User flows](./user-flows.md) alongside the prototype. The prototype supplies visual and interaction context; approved repository specifications and task acceptance criteria define required behavior. Prototype code, fixtures, amounts, statistics, and narrative are not approved production data or evidence of functionality implemented in this repository.

If the prototype conflicts with a specification or exposes an unresolved decision, describe the conflict and request team clarification before implementing the affected behavior. Do not silently change requirements to match the prototype. Group and staff prototype areas do not expand Sprint 1 scope.

## Shared prototype

- [Poverty Simulation Prototype — Job Version](https://www.figma.com/make/r3ZuSmL60FTO8hapPAoBNR/Poverty-Simulation-Prototype-Job-Version)
- [Fullscreen/code-node link supplied by the team](https://www.figma.com/make/r3ZuSmL60FTO8hapPAoBNR/Poverty-Simulation-Prototype-Job-Version?fullscreen=1&code-node-id=0-6)
- File type: **Figma Make**, not a Figma Design file with screen frames.
- File key: `r3ZuSmL60FTO8hapPAoBNR`.
- Access checked: October 22, 2026. The connected Figma tool returned a source-resource index. Source bodies and rendered screen states have not been reviewed for this reference; no visual parity or behavioral compliance is asserted.
- Status: team-supplied reference; this document does not establish approval of every prototype detail.

These links point to a live file, not a frozen revision. At the start of a story, record the relevant prototype state and review date in the task or PR. If the team needs a fixed visual baseline, identify an agreed revision or dated exports before treating the visual target as fixed.

## How agents retrieve context

1. Read the story, relevant repository specifications, and affected application code first.
2. Use a Figma connection authenticated as a user with access to the shared file. Repository links do not grant Figma permissions. Each teammate must verify their own connection can retrieve this file.
3. Load the Figma design-to-code skill before calling `get_design_context`. For this Make file, use `fileKey: "r3ZuSmL60FTO8hapPAoBNR"` and `nodeId: "0:1"`, following the tool's Make-specific instructions. Include the skill's required logging parameter. The URL's `code-node-id=0-6` is not a Design frame ID.
4. Follow the returned source-resource links, starting with `src/App.tsx`, using resource-reading capabilities available in that session. Retrieve the relevant files for the story rather than copying the whole prototype into the application. If source reading is unavailable, report that limitation; a resource index alone does not establish screen behavior.
5. Inspect the relevant rendered screen and interaction states before claiming a visual match. The Figma `get_metadata` and `get_screenshot` tools do not support Make files in the current tool interface. Use an available preview/browser workflow or team-provided dated screen exports for visual review; do not substitute guessed Design node IDs.
6. Adapt approved visual intent to the repository's React/TypeScript conventions, theme tokens, accessibility rules, protected operations, and content model. Do not import prototype state handling, financial fixtures, or authorization assumptions as production requirements.
7. Report which prototype areas were inspected, any conflicts or unavailable states, and the checks actually performed.

If access fails, retain the written specifications as the task reference and report the missing visual context. Do not claim the prototype was inspected or that the implementation matches it.

## Source navigation starting points

The following names were returned by the Make source index on October 22, 2026. They are retrieval starting points inferred from filenames, not a verified inventory of rendered screens. Paths refer to the external Make project, not this repository.

| Story area | Make source starting points |
| --- | --- |
| Entry and navigation | `src/App.tsx`, `src/LandingPage.tsx`, `src/SimulationHeader.tsx`, `src/SimulationFooter.tsx` |
| Household setup | `src/HouseholdSelection.tsx`, `src/SetupFrame.tsx`, `src/SetupProgress.tsx` |
| Support and review | `src/SetupSupport.tsx`, `src/SetupReview.tsx` |
| Employment | `src/EmploymentSequence.tsx` |
| Decisions, recaps, and results | `src/GameSession.tsx`, `src/GamePrimitives.tsx`, `src/gameSessionState.ts` |
| Learning and comparisons | `src/CommunityLearning.tsx`, `src/LearningExplorer.tsx` |
| Group journeys, later scope | `src/GroupFlow.tsx`, `GROUP_GAMEPLAY.md` |
| Staff journeys, later scope | `src/AdminPortal.tsx` |

For each assigned area, inspect applicable initial, selected, loading, error, submitted, empty-data, keyboard-focus, and narrow-screen states. Record missing states rather than assuming the prototype defines them. Use repository specifications to determine required behavior.

## Suggested user-story instruction

> Read `design/ui-spec.md`, `design/user-flows.md`, and `design/prototype-reference.md`. Retrieve the linked Figma Make context for the story's relevant screens before implementation. Follow approved repository behavior and financial rules, identify conflicts before implementing affected behavior, and report which prototype states and application checks were verified.

## Keeping the reference useful

When the team changes the prototype, update this guide's review date, navigation entries, and any agreed baseline information. Record approved requirement changes in the corresponding specification. Keep unresolved differences visible in the story or PR until the team resolves them. Commit and share these documentation changes through the team's normal Git workflow so other checkouts receive the reference.
