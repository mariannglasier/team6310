# CAC Poverty Simulation — UI Specification

## Purpose and authority

For the shared Figma Make prototype, source navigation, and agent retrieval workflow, see [Prototype reference](./prototype-reference.md). Use it for visual context alongside this specification; prototype fixtures and behavior do not override approved requirements.

This standing specification defines the interface for the Community Assistance Center (CAC) poverty simulation. Use it together with [User flows](./user-flows.md). Agents must follow these rules without needing external images or conversation history. Architecture, financial calculation rules, data schemas, interfaces, and authorization belong in the project's corresponding technical specifications. Release priorities belong in the iteration plan rather than this standing design file.

The experience has a pre-game employment stage followed by Days 1–30. It teaches trade-offs involving money, work, care, housing, transportation, and limited resources without judging the player or presenting one perfect path. It supports individual players, facilitated groups, and authorized CAC content administrators.

The frontend uses React and TypeScript, with Supabase/PostgreSQL for content and anonymous response data, Supabase Auth for staff authentication, and Cloudflare Pages for frontend deployment.

## Design system and shared components

- Use Roboto throughout. Establish hierarchy through heading size, weight, and appropriate emphasis or italics.
- Use the project color tokens below consistently. These are project-selected values, not a claim of official CAC brand hex codes. Centralize them in the application theme.
- Use rounded cards, consistent padding, clear section separation, filled primary buttons, and outlined secondary buttons.
- Show selection through a control or text label as well as a border. Keyboard focus must remain distinct from selection.
- Use semantic headings, labeled inputs, keyboard-operable controls, visible focus, sufficient contrast, and readable error messages. Never rely on color alone.
- All application routes, including placeholders and future pages, use the same shared header: CAC logo on the left and Learn About CAC, Explore Data, and Donate on the right. Both the header and footer CAC logos link to the application landing route `/`. Learn and Donate use configured CAC-approved external destinations.
- Setup uses a four-step indicator: Introduction, Household, CAC support, Review. Show the current step and completed steps.
- Single-choice card sets behave as radio groups. Selecting a card does not advance the screen or commit a financial decision.
- Back navigation within setup preserves selections. Required choices must be valid before Continue becomes available.
- On narrow screens, stack columns and cards, place setup progress above content, and wrap navigation and actions. Keep all choices, financial values, and source information accessible. Admin tables may use a contained horizontal scroll region.

### Color tokens

| Token | Hex | Use |
| --- | --- | --- |
| `primary` | `#B3261E` | CAC branding, primary buttons, destructive action accents |
| `primary-hover` | `#8F1E18` | Primary button hover/pressed state |
| `accent` | `#245F8A` | Selected card borders, data accents, links |
| `accent-hover` | `#194767` | Accent hover/pressed state |
| `accent-surface` | `#EAF2F8` | Selected cards and recap surfaces; use primary text on this surface |
| `text` | `#111111` | Primary text and headings |
| `text-muted` | `#595959` | Supporting copy and secondary labels |
| `surface` | `#FFFFFF` | Cards, header, input surfaces, text on filled red/blue buttons |
| `background` | `#F5F5F5` | Page background |
| `border` | `#767676` | Input and interactive-control boundaries |
| `divider` | `#D9D9D9` | Decorative separators; not the sole control boundary |
| `disabled-surface` | `#E0E0E0` | Disabled buttons, with muted text and disabled semantics |
| `focus` | `#245F8A` | Visible focus ring with a white separation gap on filled controls |

White text is used on filled primary/accent controls. Black text is used on light surfaces. Selected cards use a blue border plus a selected label/control; keyboard focus uses a separate outer ring. Charts use blue and red with direct labels or patterns so color alone never conveys the group. Maintain contrast when composing tokens; decorative dividers must not replace accessible control outlines.

## 1. Landing page

The shared footer on every route, including placeholders and future pages, includes a CAC logo linking to the application landing route `/`, “Helping neighbors in Sandy Springs and Dunwoody.”, a Contact CAC section with `(770) 552-4889` and `info@ourcac.org` as telephone/email links, and a Resources section. Privacy and Sources are explicitly unavailable future links until approved destinations are supplied; do not use temporary Figma preview URLs. Show “Tax ID #: 58-1825565”. Stack footer sections on narrow screens.

Display only the CAC logo on the left of the landing header, with Learn About CAC, Explore Data, and Donate controls on the right. Replace the previous landing headline with “Financial crises can happen to anyone. How would you respond?” The introductory paragraph is “Explore the everyday decisions households face in Sandy Springs and Dunwoody and the role the Community Assistance Center plays in helping neighbors thrive.” The next paragraph is “Accept the challenge to step into a fictional household’s shoes. Balance competing needs for 30 days and reflect on choices shaped by limited resources.”

Provide Start simulation and Join a group buttons, followed by a smaller Host a group link. These open the existing Individual simulation, participant, and host routes respectively. Start simulation will open persona selection when it is implemented; there is no intermediate Introduction page. Use the supplied `design/assests/foodpantry2.png` photo with descriptive alternative text and no caption beneath it. Remove the former fictional-households disclaimer and “Your month at a glance” label. Keep the three explanation cards, replacing 01/02/03 with house, receipt, and bar-chart icons. These landing revisions were supplied by the team on October 22, 2026; all pages inherit the same shared header navigation. Explore Data reserves `/data` for later implementation and currently reaches the existing fallback page.

The team approved `https://ourcac.org/` for Learn About CAC and `https://ourcac.org/donate-online/` for Donate on October 22, 2026. Landing-page links use these destinations in the same tab. Team-supplied introductory and explanatory copy is centralized in `frontend/src/pages/public/landingContent.ts`; its wording is presentation content, not scenario data.

## 2. Simulation entry

The landing page provides the individual, host, and participant entry actions. Start simulation proceeds directly to household/persona selection when implemented; for now it opens the Individual simulation placeholder. There is no intermediate Introduction/mode selection page.

The legacy `/simulation/introduction` URL redirects to `/simulation/individual`. Host a Group opens host session setup. Join a Group opens session-code entry. Household setup returns to the landing page when navigating back.

## 3. Household selection

Display household cards with name, description, household composition, housing, transportation, and starting money from approved persona content. No household is selected by default. The player must choose one before continuing. Category and scenario availability are determined by approved persona-category and scenario-persona links.

Continue opens CAC support selection. Back returns to the landing page. Example names and amounts are illustrative; production values come from approved content.

## 4. CAC support selection

Display With CAC Support and Without CAC Support as mutually exclusive options. Require an explicit selection before continuing. Explain that support may appear during relevant situations and actual assistance depends on eligibility and availability.

Choosing with support enables relevant assistance choices during gameplay, such as visiting the CAC market when food is low. It does not automatically grant cash or assistance. Without support excludes those assistance choices. Continue opens Review.

## 5. Review and confirmation

Show the selected household, starting money, and CAC support setting. Provide edit actions that return to the corresponding setup step and preserve other selections. Provide Confirm Selection to start the simulation.

After confirmation, household and support settings are locked for that run. Active gameplay must not expose setup inspection, setup editing, or Back to Review. Replace that navigation with End Simulation.

## 6. Pre-game and fixed employment sequence

Before Day 1, show eligible approved jobs, weekly income, and CAC preparation where applicable. Preparation does not silently change state until its choice is submitted. On Day 2, present the approved professional-clothing choices and show the scripted first-interview result. Purchased or CAC-provided professional clothing is persistent run state and must not be charged again. After failure, show the lower-requirement reapplication prompt without skipping the result. On Day 3, reuse owned professional clothing and filter choices accordingly; the player gets the lower-requirement job regardless of the available clothing selection. The job catalog remains unresolved; do not invent it. Display weekly pay only on its scheduled due days, beginning seven days after hiring, with a brief income notification before that day's scenarios.

The non-scheduled Financial Literacy & Taxes scenario displays no refund or deduction for “Try my best.” For the paid-preparer choice, verify that the player can afford the approved fee before applying any consequence; if not, end the game before applying the fee or refund. If affordable, apply the fee and the specified $1,000 refund immediately. CAC assistance applies the specified $1,000 refund immediately without a player-paid fee. The approved preparer fee remains unresolved.

If an optional choice is attempted and unaffordable, end the run even if it is the only available choice. If a required payment is missed or unaffordable, end the run. In both cases, do not display a successful deduction or invent a loan.

## 7. Simulation decision screen

Display:

- Pre-game state or current day and progress through 30 days.
- Household's available balance.
- Upcoming expenses with amounts and due dates.
- Scenario heading and explanation.
- Available decision cards with relevant immediate costs or support labels.
- Submit Decision and End Simulation actions.

Render options from scenario content and the selected support setting; do not assume a fixed number of options. Submit Decision remains unavailable until a valid option is selected. Selection alone does not change finances.

Submitting commits the choice and its defined effects once. Disable repeated submission while processing and after success. Multiple decisions may occur on one day; completing a question does not inherently advance the calendar. Process scheduled income and required payable events through the simulation model, and end early when a required event cannot be paid. Normal completion occurs after Day 30. Do not introduce an automatic early-ending rule based only on balance.

Use financial outcomes and expense schedules supplied by the simulation model. Do not invent amounts, income dates, affordability rules, or consequences in presentation components.

## 8. Inline decision recap

Keep the chosen card highlighted and show a recap directly beneath the options. This is a state of the decision screen, not a separate page.

The recap contains Decision Recorded, the selected option, immediate consequence, Balance Before, Cost Today, Balance After, After Upcoming Expenses, and Circumstance Change. Distinguish actual current balance from a projection after future expenses. Submitted choices are read-only.

Display the scenario's approved general fact; in CAC mode also display its approved CAC fact. Include value, unit, geography, data period, and source, and distinguish support availability from support actually used. Label community statistics separately from the player's choice and anonymous simulation responses. Missing comparisons do not block continuation.

Individual players use Continue Simulation to advance. Group participants see that advancement is controlled by their host. Both retain access to their own recap.

## 8. Results summary

Show results after normal completion or when a run ends early. Normal completion is labeled Day 30/month complete. Early termination is labeled Simulation ended early and shows the actual day reached; never display 30/30 for a partial run.

Include days completed, ending/current balance, completed decisions and consequences, CAC support availability and actual use, and applicable comparisons. Do not fabricate results for unanswered questions.

Provide Replay, View Data Visualization, Donate to CAC, Visit CAC Site, and Return Home. Replay returns to household setup so the player can choose a household and support setting again. A new run resets balance, day, decision history, circumstances, and expense state.

## 9. Interactive data visualization page

View Data Visualization opens a separate page that provides an interactive educational review of data. Keep this page distinct from the results summary. Allow the user to explore available comparisons through accessible interactive controls and display readable labels, values, units, and source information.

### Measures and visualizations

| Measure | Display | Population and calculation |
| --- | --- | --- |
| Decision distribution | Horizontal bars labeled with each choice, count, and percentage | Count one committed response per run for the selected question. Divide each option count by all valid responses to that question under the active filters. Responses from early-ended runs remain eligible. |
| Ending balance distribution | Balance distribution by CAC support setting, with the current player's balance marked when eligible | Use completed Day 30 runs for the same household. Show dollar units and separate with/without-support groups. Exclude early-ended runs; their balance remains visible in their own summary. |
| CAC support use | Labeled used/unused counts and percentages | Use completed, support-enabled runs under the household filter. Used means at least one assistance choice was committed. Divide used runs by all eligible completed support-enabled runs. |
| Community context | Source-backed statistic cards beside relevant question context | Show approved figures separately from simulation aggregates, including value, unit, geography, data period, and source. Do not place unrelated real-world metrics on a shared numeric scale. |

### Filters and sample sizes

- Household: offer all households for decision distribution/support use; require one household for ending-balance comparisons. From a results summary, initially use that run's household.
- CAC support setting: offer with support, without support, or both for decision distributions and ending balances. Both shows ending-balance groups side by side. Support-use calculations always use support-enabled runs.
- Question: select the situation for decision distribution and linked community context. Hide this filter for ending balances and overall support use.
- Defaults: on entry from results, select that household and show both support settings for applicable comparisons. For question-based views, initialize to a question the player answered. Provide clearly labeled controls and a reset action.
- Show the number of eligible responses/runs behind each chart and behind each support group. Update counts and percentages when filters change.
- Group debrief comparisons use the current session's participants; public data views use eligible anonymous runs. Label the population explicitly.
- Compare only compatible question/option definitions and household financial configurations; preserve content-version compatibility when assembling aggregates.

Clearly separate anonymous player results from approved community statistics. Use meaningful scales and readable labels. Provide accessible values alongside every chart. Display No responses available when the eligible count is zero; do not display an invented percentage or divide by zero. Distinguish full and early-ended runs. Provide navigation back to results and home.

## 10. Group interfaces

### Host

Provide session creation, a shareable join code, participant progress/status, controls to advance each participant to their next question, and End Group Simulation. Host advancement changes a participant's question position, not their submitted choice or household finances. Participants do not share one financial state.

When the host ends the session early, stop further decision submissions and send participants to summaries of their completed work. Provide an end-of-session comparison and debrief view using available participant results.

### Participant

Provide code entry, session validation feedback, household/support setup, a waiting state, decision screens, inline recaps, and an individual results summary. Each participant manages a separate household balance and decision history.

After completing the simulation, participants can review their recap while others finish. Group comparisons appear at the end and must distinguish full runs from runs ended early.

## 11. Employee sign-in and administration

Employee sign-in includes labeled Work email and Password fields, Sign In, and Back to main site. Mask passwords. Authenticate through Supabase Auth and verify staff authorization before exposing protected records or mutations. Do not include sample credentials in production.

The dashboard contains Statistics and Scenario Questions tabs, category and coverage metadata, record counts, content locations, edition status, last-updated information, and editing actions. Staff can edit pending drafts but cannot mutate published editions. Statistics retain value, unit, geography, data period, source, and related questions. Question editing must preserve category/persona/service links and the one-general/one-CAC fact relationship.

Validate edits and show draft-save or approval success/failure. Published changes affect simulations started after publication; active runs retain their existing content version. Main Site returns to the public site. Sign Out ends staff authentication and protected access. Any content removal must respect data-model references and active-run versions.

## Persistence, loading, and errors

Players are anonymous; do not require names, email addresses, or player accounts. Identify each run using an anonymous session identifier. Refreshing in the same browser restores the run's household, support setting, day, balance, decisions, and current decision/recap state. Group participants also retain their session association. Restore committed choices without applying their effects again.

Show loading feedback during content retrieval and submission. If required content fails to load, show Retry and prevent invalid advancement. Submission failures preserve the selected option and show an error; do not show Decision Recorded before successful commitment. Announce recap and asynchronous errors to assistive technology. An ended run restores its results state rather than reopening decision submission.

## Verification criteria

Verify explicit household/support choices, editable Review, locked active setup, pre-game employment and clothing flow, both support modes, same-day decisions, scheduled weekly income, Day 30 completion, inability-to-pay early endings, refresh recovery, duplicate-safe submission, missing comparison data, replay through fresh setup, separate interactive data navigation, host-controlled participant advancement, independent group finances, early group termination, authorized pending-edition editing/approval, and content-version isolation. Check keyboard and narrow-screen use throughout.
