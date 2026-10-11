# CAC Poverty Simulation — UI Specification


## Purpose and scope

The Community Assistance Center (CAC) simulation lets users navigate a fictional household's 30-day month and understand trade-offs involving money, work, care, housing, and transportation. The experience should encourage understanding without judging choices or presenting one perfect path. Educational audiences include students and community or corporate groups.

Sprint 1 focuses on the individual simulation: landing page, introduction, household selection, CAC support selection, financial decisions, recap, and ending summary. Group play and employee content administration are project scope, but their appearance in the prototype does not establish Sprint 1 implementation priority.

The frontend uses React and TypeScript. Supabase/PostgreSQL supplies approved content and anonymous responses; Supabase Auth supports employee authentication. Cloudflare Pages hosts the frontend. Database structure, authorization, and financial calculations belong in the team's corresponding technical specifications; this document describes their visible results.

## Specification use

Use this document for interface structure and behavior and [User flows](./user-flows.md) for navigation and state transitions. The [mid-fidelity Figma prototype](https://www.figma.com/make/lcvu8JNOpipCLAhd4DYNeF/Poverty-Simulation-Prototype?t=EmcKq5m8zlKgpXIv-20&fullscreen=1) is an optional visual reference; agents can use this specification without accessing it.

**Interface** describes the documented screen structure. **Planned** identifies additions in the project requirements. **Proposed** and **Unconfirmed** identify details requiring team review before implementation. Example amounts, people, dates, record counts, and charts are illustrative and must not be treated as approved production content.

## Design system

| Element | Intended direction | Confirmation needed |
| --- | --- | --- |
| Typography | Roboto for the interface | Weights and type scale |
| Primary color | CAC red for primary actions and branding accents | Exact color token and accessible text pairing |
| Text and surfaces | Black text, white cards, light gray page backgrounds, gray secondary text | Exact gray tokens and contrast |
| Selection | Clear border plus a text or control indication of selection | Consistent treatment across household, support, and decision cards |
| Buttons | Filled primary action; outlined secondary action; visibly disabled state | Final sizes, spacing, and focus styles |
| Cards | Rounded corners, internal padding, subtle borders/shadows | Final radius, spacing, and shadow tokens |
| Layout | Centered content area, generous separation, section dividers | Final widths and responsive breakpoints |

Apply the intended CAC palette consistently. Blue is not established as a final brand token. Exact color values require team confirmation.

## Shared interface

**Interface:** Public header contains CAC branding, Learn About CAC, Donate, and Employee Admin. Setup screens use a left-hand four-step indicator: Introduction, Household, CAC support, Review. Back and Continue actions sit below the screen content. Admin pages use a separate content-administration header.

**Proposed interaction rules:** Single-choice card sets behave as radio groups. Selecting a card changes selection only; advancing requires the relevant action button. A selected option and keyboard focus must be distinguishable. Back navigation within setup preserves selections. A required selection enables Continue or Submit Decision. Continue must reflect whether a valid household selection has been stored. Confirm whether household choices are preselected by default.

Navigation labels do not establish URL paths. Confirm route names in the frontend architecture documentation. External Learn/Donate destinations must use CAC-approved links.

## Screen specifications

### 1. Landing page

**Interface:** CAC header; introductory label; headline “One month. Real trade-offs. No simple answers.”; explanatory copy; Play Simulation button; a separate month-at-a-glance card emphasizing 30 days. Desktop layout places the introduction beside that card.

**Behavior:** Play Simulation opens setup. Learn About CAC and Donate open approved destinations. Employee Admin opens employee sign-in. Preserve the explanation that the experience uses fictional households and aims to build understanding.

### 2. Introduction — setup step 1

**Interface:** Four-step sidebar; explanation of the month and how decisions affect later circumstances; a contextual callout; three mode cards: Play Individually, Host a Group, Join a Group; Back; Continue Individually.

**Behavior:** Individual mode advances to Household. Back returns to the landing page. Host/Join are future flow entry points; their downstream interfaces remain unspecified. If group functionality is outside the current release, the team must decide how to represent its availability before implementation.

### 3. Household selection — setup step 2

**Interface:** Heading, introductory copy, and two household cards. Each shows name, description, household composition, housing, transportation, and starting money. Example profiles are Maya and Eli and Jordan.

**Behavior:** Choose one household. Continue advances to CAC support after a valid selection. Back returns to Introduction. Render approved persona content; do not hardcode the example balances of $1,480 and $1,920 as production values.

### 4. CAC support selection — setup step 3

**Interface:** “Include CAC support?” heading; explanatory copy; With CAC Support and Without CAC Support cards; selected indication; Back and Continue.

**Behavior:** With support enables opportunities to seek assistance in relevant scenarios. Without support excludes those opportunities. Explain that actual assistance depends on eligibility and availability. Choosing support does not itself prove assistance was used or add money automatically. Continue leads to Review.

### 5. Review — setup step 4

**Unconfirmed:** Review is a setup step whose detailed layout and start action remain unspecified.

**Proposed minimum:** Show chosen mode, household, starting money, and support setting, with Back and a clearly labeled start action. Allow the user to verify selections before initializing the simulation. Exact layout, copy, edit controls, and start-button label require team approval.

### 6. Simulation decision

**Interface:** Day and scenario category; large scenario heading; situation description; available-balance card; decision prompt; four option cards for the example car-repair question; immediate cost or support label; Back to Review and Submit Decision.

**Behavior:** Display only options allowed by the scenario and support setting. The number of cards comes from scenario content rather than a fixed count of four. Submit Decision is disabled until a valid choice is selected. Selecting alone does not deduct money. Submitting records the choice and reveals the recap. Prevent repeated submission while processing or after success.

**Planned:** Remaining-day/progress information and upcoming expenses from the iteration plan. Their permanent placement remains unspecified. The day label supplies day context; confirm the layout for the remaining indicators.

**Unconfirmed:** Back to Review appears even on Day 15. The team must define whether this permits restarting, merely reviewing setup, or editing selections; it must not silently reset or recalculate a run.

### 7. Inline decision recap

**Interface:** The selected card remains highlighted. A panel appears directly below the options, containing Decision Recorded, the chosen option, an immediate-consequence explanation, Balance Before, Cost Today, Balance After, After Upcoming Expenses, Circumstance Change, and Continue Simulation. This is a state of the decision screen, not a separate page.

**Behavior:** Recap values come from the committed decision result. Clearly distinguish current balance from projected balance after future expenses. Continue advances only after the player can review the result. Submitted decisions must not be changed through the still-visible cards without an explicitly approved undo design.

**Planned comparison addition:** Display a short approved U.S. or Atlanta-area comparison when one is linked to the question. Label it separately from the player's choice and consequence. Show value, unit, geography, data period, and source. Anonymous player response comparisons, if included, must be labeled as simulation responses and kept distinct from community statistics. Missing comparisons must not prevent continuation or produce invented numbers.

### 8. Ending summary

**Interface:** Day 30 completion heading and 30/30 indicator; educational explanation; outcome cards for ending balance, a notable decision, and CAC support; comparison area; Donate to CAC, Visit CAC Site, View Data Visualization; Replay Same Scenario, Replay Without CAC Assistance, Return Home.

**Behavior:** Use the completed run's balance, decisions, and support use. Distinguish support available from support actually used. Replace demonstration values with approved data. Replay starts a fresh run; Return Home opens the landing page. Exact replay configuration is specified as a proposal in the user-flow document.

**Comparison constraints:** The prototype bars are placeholders. Before implementing a real chart, define its metric, units, population, and scale. A player's balance must not be graphed against an unrelated cost or percentage. Show source/context and readable values; use an unavailable-data state when valid comparisons cannot be made. The View Data Visualization destination remains unspecified.

### 9. Employee sign-in — later scope

**Interface:** Content-administration header with Back to main site; explanatory panel; Work email and Password fields with required markers; Sign In. The prototype mentions sample credentials and fictional records.

**Behavior:** Production access uses Supabase Auth and authorized CAC staff access. Do not ship sample credentials or treat a work-email domain as sufficient authorization. Label fields, mask password input, provide required-field feedback, and show a readable sign-in failure. Authentication and authorization details belong in the security specification.

### 10. Content-administration dashboard — later scope

**Interface:** Main Site, Dashboard, Sign Out; heading; reminder to review affected locations before publishing; Statistics and Scenario Questions tabs with counts. The Statistics table has Content, Where It Appears, Status, Last Updated, and Action columns, with published badges and Delete buttons.

**Planned:** Authorized staff manage approved statistics and scenario questions without code changes. Final records must retain source, period, geography, unit, value, and related questions.

**Unconfirmed:** Scenario Questions tab contents, create/edit forms, publication actions, validation, and deletion handling remain unspecified. Do not infer a complete editor from the table. Counts and timestamps must reflect actual records. Define safe treatment of referenced content before enabling deletion. The prototype states changes affect newly started simulations; coordinate this with content-version rules in the data model.

## Responsive and accessible behavior — proposed for team review

Desktop layouts are specified above; final responsive layouts require team review. On narrow screens, stack cards and the landing columns, place setup progress above the content, and wrap navigation/actions without losing labels. Preserve every decision, financial value, and source. Admin tables may use a contained horizontal scroll region rather than clipping columns.

Use semantic headings, labeled inputs, native buttons/links, keyboard-operable card selections, visible focus, and text indications for selection, errors, and publication status. Announce submitted results and asynchronous errors to assistive technology. After submission, move focus to or announce the recap. Provide text equivalents for charts. Verify contrast against the final palette; do not rely on color alone.

## Loading, errors, and verification

**Proposed:** Show loading feedback while fetching content; offer Retry on content errors. On submission failure, preserve the selection and show a retryable error without displaying a successful recap. If required persona or scenario content is unavailable, block starting/advancing with an explanation. Exact recovery from refresh or session loss depends on the team's persistence decision.

For UI verification, walk through setup, back navigation, both support settings, decision selection, successful/failed submission, inline recap, missing statistics, completion, and replay. Check keyboard use and narrow-screen layout. For later admin work, verify denied access, sign-in failure, sign-out, and accurate content status.

## Decisions to resolve before implementation

1. Approve Review layout and start action.
2. Approve final typography, exact palette tokens, spacing, and responsive behavior.
3. Confirm setup selection defaults and consistent Continue enablement.
4. Define Back to Review and in-progress exit behavior.
5. Confirm progress/upcoming-expense placement, simulation ending rules, and refresh recovery.
6. Define comparable ending-chart metrics and the visualization destination.
7. Confirm group availability and missing group/admin editor designs.

These gaps are explicit review items. A developer or agent should not silently decide them.
