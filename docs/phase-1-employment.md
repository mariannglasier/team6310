> Phase 2 server-backed employment is implemented locally, pending migration review and deployment. See [migration effects, recovery and verification limits](phase-2-employment.md). Phase 1 local-only descriptions below are historical.

# Phase 1 employment integration

This integration uses `playthrough-setup` (`96bc7ec`) as its foundation and ports
employment rules and components from `adding-job-selection` (`64ed166`). It runs
at `/simulation` inside the existing Figma Make financial tracking layout.

## Recorded state and provisional gameplay

Review still establishes anonymous Auth and calls
`start_individual_playthrough(p_persona_id)`. The existing owned-run loader,
pinned persona retrieval and expense services remain in place. No gameplay
operation writes to Supabase. The recorded balance, day, support and employment
fields are not replaced by local outcomes.

An explicit Start employment walkthrough action loads skills for the run's
persona/version and jobs from that version. Only a fresh individual run (active,
Day 1, no scenario, job or employment state) with known balance/content can seed
the local overlay. Its balance comes from the loaded playthrough, not catalog
starting money. Its pre-game Day 0 is local; the server's Day 1 remains visible
as confirmed state. Unknown or already-progressed records are not reset.

The overlay is held in SetupProvider memory under the existing run UUID. There
is no second run ID or browser financial action log. Navigation within the app
retains it. Refresh discards the overlay and the existing memory-only creation
receipt; the page then offers household selection. It does not recreate a run
automatically or claim to restore gameplay. Full refresh recovery remains outside
Phase 1.

The timeline and large balance reflect provisional progress once started. Labels
and the separate server-confirmed balance/day distinguish them from saved data.
Upcoming expenses remain saved schedule/occurrence displays and never deduct
money. The saved status remains visible; local completion/ending is shown in the
central content only.

## Retained rules and interaction adaptation

English/computer skills determine job eligibility; unknown flags fail closed.
CAC preparation supplies both run-specific skills and records actual assistance
use. The first interview requires preparation and purchased/CAC professional
clothing. Professional clothing costs $60; ownership prevents another charge.
After failure, reapplication stays on Day 2 and offers all other eligible jobs.
Day 3 hiring succeeds with any available clothing choice. An unaffordable
purchase ends locally without a charge. Pay starts seven days after hiring,
without immediate wages or tax deductions. Days 1–30 otherwise contain labeled
placeholders; no bills or new scenarios were added.

These rules and the recorded skill decisions in the source branch are retained
under the Phase 1 authorization. They supersede older descriptions of a
lower-requirement-only fallback for this integrated walkthrough.

Job and clothing cards now select an option; explicit submission applies the
local decision. This follows the standing selection/submission boundary rather
than the source preview's immediate card submission. Preparation remains an
explicit action. Facts remain labeled placeholders.

Completion and early ending display the local history. Replay clears local setup
and returns to household selection; confirmation creates another recorded run
through the unchanged RPC. Only a completed local run without support offers a
CAC replay. That support preference is local and does not update the RPC's null
support field. Replay eligibility is not server-verified. Previous server runs
and responses are untouched; previous local history is discarded on replay.

## Database prerequisites and limits

No migration, seed, policy, trigger or hosted data change is included. Recorded
migrations establish playthrough creation/read capabilities, current_job_id and
employment_state references. They do not supply gameplay mutation operations.
The complete hosted exports referenced by architecture.md are unavailable in
this checkout, so current hosted capabilities are not certified.

Employment reads expect personas.has_english_skills / has_computer_skills and
jobs.needs_english_skills / needs_computer_skills, with configured boolean data
and at least two approved active jobs requiring neither skill in the pinned
edition. Missing columns, null skills, unavailable content or inadequate jobs
block the preview with a retry/facilitator message; they do not change the
recorded run or substitute assumptions. Household setup remains independent of
those new column reads.

If these flags are absent from the development database, enabling the preview
requires a separately reviewed decision: reuse an existing equivalent skill
representation, or add only the missing nullable flags with approved content
configuration. Do not apply the gameplay branch's published-row mutation seed
or disable its immutability trigger automatically.

Future recorded gameplay needs protected transactional operations and durable
retry/recap/income state. This integration does not establish those capabilities
or produce server-confirmed employment outcomes or full-simulation aggregates.
