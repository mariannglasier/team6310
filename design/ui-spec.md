> **Documentation reconciliation — November 6, 2026:** Separated ordinary and employment event days are approved design, preserving the Day 2 interview/result/immediate reapplication exception. This approval does not authorize gameplay implementation changes.
>
> **Bills approval — November 8, 2026:** Independent bills, fixed per-expense fees incurred once on Ignore, later full settlement, non-ending payment rejection, post-employment Day 2/3 bills, and Day 30 completion with unpaid obligations are approved. See [the bills specification and staged implementation record](../docs/bills-system.md). This supersedes the earlier optional-only notices and scenario-based bill flow. Actual content remains designer-supplied. The branch now includes prepared SQL and frontend integration; this is not evidence of hosted deployment. See the staged implementation and verification record.
>
> **Current implementation boundary — updated November 7, 2026:** Employment uses server-controlled `employment_state` JSONB and `submit_employment_action`. The current branch includes protected ordinary direct-balance submissions, saved responses/recaps, atomic restoration and scheduled scenario progression through `submit_scenario_decision`, `restore_scenario_decision` and a progression trigger. The normal simulation uses these services; the development preview is not the only scenario path. This does not implement the 60-card library, expense settlement, unpaid debt, late fees or general branching. Repository code is evidence of implementation, not proof of deployment; see [the reconciliation report](../docs/gameplay-documentation-reconciliation.md). Hosted Supabase remains the maintained production database. Do not reconstruct historical migrations, reset or recreate hosted Supabase, automatically apply hosted migrations, replace anonymous authentication, or let clients independently write authoritative balances.

# CAC Poverty Simulation — UI Specification

## Purpose and authority

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
- Setup confirms the selected household with Start simulation on the household page; there is no Review page or multi-step indicator. CAC support is offered after a completed regular run.
- Every simulation page (`/simulation/*`) sits on the scenic stage: the supplied scenic illustration (`frontend/src/assets/scenic-simulation-background.jpg`) fills only the area between the shared header and footer, behind a white rounded content panel with an inset on every side so the scenery shows around it. The image is decorative (no alt text, no content on it); all text and controls stay on the solid white panel at the design tokens. The header and footer never sit on the image.
- Setup pages fit one screen: header plus stage fill the viewport, the footer follows below the fold, and the page content scales down uniformly (not below 0.7) to fit without reflowing the layout. Below that scale the panel scrolls instead of shrinking text further.
- Single-choice card sets use keyboard-operable buttons with `aria-pressed`, one selected option, and visible focus. Selecting a card does not advance the screen or commit a financial decision.
- Back navigation within setup preserves selections. Required choices must be valid before Continue becomes available.
- On narrow screens, stack columns and cards, place setup progress above content, and wrap navigation and actions. Keep all choices, financial values, and source information accessible. Admin tables may use a contained horizontal scroll region.

### Color tokens

| Token              | Hex       | Use                                                                 |
| ------------------ | --------- | ------------------------------------------------------------------- |
| `primary`          | `#B3261E` | CAC branding, primary buttons, destructive action accents           |
| `primary-hover`    | `#8F1E18` | Primary button hover/pressed state                                  |
| `accent`           | `#245F8A` | Selected card borders, data accents, links                          |
| `accent-hover`     | `#194767` | Accent hover/pressed state                                          |
| `accent-surface`   | `#EAF2F8` | Selected cards and recap surfaces; use primary text on this surface |
| `text`             | `#111111` | Primary text and headings                                           |
| `text-muted`       | `#595959` | Supporting copy and secondary labels                                |
| `surface`          | `#FFFFFF` | Cards, header, input surfaces, text on filled red/blue buttons      |
| `background`       | `#F5F5F5` | Page background                                                     |
| `border`           | `#767676` | Input and interactive-control boundaries                            |
| `divider`          | `#D9D9D9` | Decorative separators; not the sole control boundary                |
| `disabled-surface` | `#E0E0E0` | Disabled buttons, with muted text and disabled semantics            |
| `focus`            | `#245F8A` | Visible focus ring with a white separation gap on filled controls   |

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

Start simulation confirms the explicit household selection, creates the run through the protected start operation, and opens the pre-game job search. Disable setup controls while creation is pending; retain the selection and show an error if creation fails. Back returns to the landing page. The heading, label and introduction are centered above the carousel. Production values come from approved content.

## 4. CAC support selection (deferred)

Not part of setup for now. The client will offer CAC support as an option after players complete a regular run without it; this will be specified and implemented in a later task. Until then runs are without support and no support selection is shown. The behavior below is retained for that later work.

Display With CAC Support and Without CAC Support as mutually exclusive options. Require an explicit selection before continuing. Explain that support may appear during relevant situations and actual assistance depends on eligibility and availability.

Choosing with support enables relevant assistance choices during gameplay, such as visiting the CAC market when food is low. It does not automatically grant cash or assistance. Without support excludes those assistance choices. Any later support-selection design must preserve direct household confirmation.

## 5. Direct confirmation (approved November 4, 2026)

The household page contains the illustration, name, starting money and story. Its Start simulation button is the sole confirmation action. Legacy Review URLs redirect to household selection, or to gameplay when a run is already active. A navigation revisit must not create another run.

After confirmation, household and support settings are locked for that run. Active gameplay must not expose setup inspection, setup editing, or Back to Review. Replace that navigation with End Simulation.

## 6. Pre-game and fixed employment sequence

Before Day 1, show eligible approved jobs, weekly income, and CAC preparation where applicable. Preparation does not silently change state until its choice is submitted. On Day 2, present the approved professional-clothing choices and show the scripted first-interview result. Purchased or CAC-provided professional clothing is persistent run state and must not be charged again. After failure, show the different-eligible-job reapplication prompt without skipping the result. On Day 3, reuse owned professional clothing and filter choices accordingly; the player gets the different eligible job regardless of the available clothing selection. The job catalog remains unresolved; do not invent it. Display weekly pay only on its scheduled due days, beginning seven days after hiring, with a brief income notification before that day's scenarios.

The non-scheduled Financial Literacy & Taxes scenario displays no refund or deduction for “Try my best.” For the paid-preparer choice, verify that the player can afford the approved fee before applying any consequence; if not, end the game before applying the fee or refund. If affordable, apply the fee and the specified $1,000 refund immediately. CAC assistance applies the specified $1,000 refund immediately without a player-paid fee. The approved preparer fee remains unresolved.

If an optional choice is attempted and unaffordable, end the run even if it is the only available choice. If a required payment is missed or unaffordable, end the run. In both cases, do not display a successful deduction or invent a loan.

## 7. Simulation decision screen

Between scenario, recap and day screens, use a brief 260 ms fade-in with an 8 px upward entrance. Animate only the main scenario content; keep the timeline and financial sidebars stable. Honor reduced-motion preferences. Omit the visible “Saving your decision” message; keep controls disabled and expose `aria-busy` while protected submissions are pending. Animate the next screen only when its committed state is available, without adding a delay to financial operations.

The CAC preparation action reads “Join CAC Adult Education classes”. Show this smaller text directly beneath/beside it, without a dropdown: “The CAC offers a variety of adult education programs. English as a Second or Other Language classes or computer skills classes could help you be more qualified for jobs.” Keep gameplay copy immersive; omit unsolicited real-world disclaimers and explanations of scripted rules. Put review and implementation caveats in staff documentation. Hiring recaps omit first-payday/no-pay-on-hiring-day commentary, and end screens omit the employment and financial history list. Retain committed history for restoration and financial totals.

November 4 presentation revision: use native button cards with explicit selected states and keyboard focus, rather than radio controls. Selection still requires a separate submission. Use thin borders, soft gray shadows and a subtle red hover background. Keep unavailable jobs visible and disabled during reapplication. Place CAC preparation above the job board. Center the initial “It's time to start your job search!” heading and “See who's hiring” button together in the main gameplay panel, with compact spacing. Application recaps show “You got an interview!” and the interview day.

Show employment title, weekly income and simulated CAC enrollment under the household profile. Starting balance, received income and charged expenses come from the validated committed employment history; schedules are projections only. Hide the run ID and redundant top day/status strips. Replace future payday number circles with solid red circles containing centered white dollar signs; accessible labels retain the day number. Use a translucent header background with readable controls. Keep primary actions within a standard desktop viewport, except on job bulletin boards: these may scroll so every job description remains fully readable, with no line clamping, clipping or ellipsis. Preserve scrolling access on smaller screens and for expanded facts.

Automatic weekly pay uses a fading received-income notification and a display-only balance animation over the day's scenario, with reduced-motion support. No separate income confirmation screen is shown. Keep Day 2's failed result and same-day reapplication; after successful Day 2 hiring or the reapplication recap, Continue opens Day 3. After the Day 3 interview recap, Continue opens Day 4. Skip redundant placeholder scenarios on interview days. These transitions use existing protected actions and retain refresh and pending-submission recovery.

Display:

- Pre-game state or current day and progress through 30 days.
- Household's available balance.
- Upcoming expenses with amounts and due dates.
- Scenario heading and explanation.
- Available decision cards with relevant immediate costs or support labels.
- Submit Decision and End Simulation actions.

Render options from scenario content and the selected support setting; do not assume a fixed number of options. Submit Decision remains unavailable until a valid option is selected. Selection alone does not change finances.

Submitting commits the choice and its defined effects once. Every displayed answer resolves the scenario; informational review controls are outside the answer list. Disable repeated submission while processing and after success. Ordinary scenarios and job events occupy separate days. Preserve the existing Day 2 interview/result/immediate reapplication exception and conditional Day 3 interview; no unrelated event shares an interview day. After an ordinary committed result, Continue advances to the next day. Income notices occur first and do not consume another scenario. Unaffordable attempted paid choices and required payments retain existing ending behavior. Normal completion follows Day 30. Do not introduce an automatic ending based only on balance.

Use financial outcomes and expense schedules supplied by the simulation model. Do not invent amounts, income dates, affordability rules, or consequences in presentation components.

## 8. Inline decision recap

Keep the chosen card highlighted and show a recap directly beneath the options. This is a state of the decision screen, not a separate page.

For individual ordinary scenarios, submission opens an interim screen with the scenario heading and fact boxes. Hide the option form and omit Decision Recorded, the consequence sentence and the balance-change/balance-after summary. Continue to next day appears below the facts. Preserve the committed outcome for financial tracking and restoration. Leave at least 20px between choice cards and Submit decision before submission.

Display the scenario's general fact or labeled development context in a bottom card; in CAC mode add a second card only when a supported CAC passage exists. Preserve dates, units and geography in sourced copy where relevant. Do not show a source-link button; retain source metadata in the backend. Distinguish support availability from actual use. Missing CAC facts do not block this development edition.

Individual players use Continue to next day below the fact boxes to advance. Group participants see that advancement is controlled by their host. Both retain access to their own recap.

## 8. Results summary

Show results after normal completion or when a run ends early. Normal completion is labeled Day 30/month complete. Early termination is labeled Simulation ended early and shows the actual day reached; never display 30/30 for a partial run. An unaffordable ordinary choice must open this end screen with Replay from household selection and Return home, rather than leave the player on a disabled scenario. Restore already-ended runs to this screen using the saved terminal status, day and balance; replay creates a new attempt.

Include days completed, ending/current balance, completed decisions and consequences, CAC support availability and actual use, and applicable comparisons. Do not fabricate results for unanswered questions.

Provide Replay, View Data Visualization, Donate to CAC, Visit CAC Site, and Return Home. Replay returns to household setup so the player can choose a household and support setting again. A new run resets balance, day, decision history, circumstances, and expense state.

## 9. Interactive data visualization page

View Data Visualization opens a separate page that provides an interactive educational review of data. Keep this page distinct from the results summary. Allow the user to explore available comparisons through accessible interactive controls and display readable labels, values, units, and source information.

### Measures and visualizations

| Measure                     | Display                                                                                             | Population and calculation                                                                                                                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Decision distribution       | Horizontal bars labeled with each choice, count, and percentage                                     | Count one committed response per run for the selected question. Divide each option count by all valid responses to that question under the active filters. Responses from early-ended runs remain eligible. |
| Ending balance distribution | Balance distribution by CAC support setting, with the current player's balance marked when eligible | Use completed Day 30 runs for the same household. Show dollar units and separate with/without-support groups. Exclude early-ended runs; their balance remains visible in their own summary.                 |
| CAC support use             | Labeled used/unused counts and percentages                                                          | Use completed, support-enabled runs under the household filter. Used means at least one assistance choice was committed. Divide used runs by all eligible completed support-enabled runs.                   |
| Community context           | Source-backed statistic cards beside relevant question context                                      | Show approved figures separately from simulation aggregates, including value, unit, geography, data period, and source. Do not place unrelated real-world metrics on a shared numeric scale.                |

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

Show loading feedback during content retrieval and submission. If required content fails to load, show Retry and prevent invalid advancement. Submission failures preserve the selected option and show an error; do not open the interim fact screen before successful commitment. Announce recap and asynchronous errors to assistive technology. An ended run restores its results state rather than reopening decision submission.

## Verification criteria

Verify explicit household/support choices, direct confirmation and legacy Review redirects, locked active setup, pre-game employment and clothing flow, both support modes, separated ordinary/employment event days with the Day 2 interview/result/immediate reapplication exception, scheduled weekly income and animated notifications, Day 30 completion, inability-to-pay early endings, refresh recovery, duplicate-safe submission, missing comparison data, replay through fresh setup, separate interactive data navigation, host-controlled participant advancement, independent group finances, early group termination, authorized pending-edition editing/approval, and content-version isolation. Check keyboard, desktop fit and narrow-screen use throughout.

### Individual gameplay feedback ? November 9, 2026

Tax choices show the initial expense only, including zero for free preparation; do not disclose the expected refund or net gain before submission. The backend still applies the saved fee/refund rules atomically. Sidebar money values remain on one line with a responsive font size. Overdue rows omit the due-day label and calendar graphic while retaining the bill name, fee, outstanding amount and Pay action.
