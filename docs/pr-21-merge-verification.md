# PR #21 local merge verification — November 18, 2026

This record covers the uncommitted integration of `feature/end-screen-updates`
(`ead46831ccb55d37e515796f43f990139ea79758`) into local `main`
(`ead95804bc9fc632e7df93b96d04bcb3b5f1a762`). The merge was started with
`git merge --no-commit --no-ff origin/feature/end-screen-updates`. Committing and
pushing remain manual actions. This is not a hosted deployment record.

## Conflict resolutions

- `EmploymentGame.tsx`: retain `main`'s explicit `allowPlaceholder` readiness
  permission, defaulting to false, alongside the incoming run ID and loading
  props. Income and pending transitions display Loading without a Next button.
  Only a resolved ordinary day with permission displays No more decisions today
  and its next-day action. Preserve incoming employment recaps, immediate
  clothing submission, and the shared terminal results screen.
- `EmploymentPanel.tsx`: retain matching run, edition, day and scenario checks,
  financial revision checks, and the requirement for a bill handler on bill days.
  Pass readiness permission and the new results/loading props to EmploymentGame.
- `employmentGameplay.ts`: retain `main`'s positive clothing-price validation
  below $1,000,000, exact cents conversion, and legacy $60 fallback. Remove the
  incoming redundant, less restrictive check.

## Additional integration adjustments

The merged employment tests now use immediate clothing submission while retaining
restored-price and affordability assertions. Rendering regression tests assert
whether Next is available instead of looking for the retired Placeholder heading.
An additional regression verifies that a due bill without a handler cannot expose
end-of-day controls; the pending-transition test explicitly supplies readiness
permission to ensure loading still takes precedence.

The incoming pie-chart calculation now computes slice positions without mutating
an outer variable in a render callback, satisfying the installed React lint rule.
The scenario manifest was regenerated to update its stale source hash; all compiled
card values were unchanged.
Browser tests use the new assisted replay and Canopy Thrift labels and check bill
layout against its story text, explicitly verifying removal of the old amount line.

## Verification

Verification uses Node.js 24.22.1 and the existing frontend dependencies.

- Frontend formatting, lint, TypeScript and production build pass.
- Frontend unit tests: 519 passed, 2 opt-in integration tests skipped.
- Browser checks: 10 passed across desktop and mobile, using local Chromium and
  the mocked API. Suites: employment-integration, bills-visual, scenario-facts and
  give-up. This includes the full month, assisted replay, refresh and navigation.
- `node tools/scenario-library.mjs --check` passes after hash regeneration.
- Source/compiler suites pass: 4 scenario-library, 15 game-data and 7 Census tests.
  Commands: `node tools/scenario-library.test.mjs`,
  `node integrations/game_data/game-data.test.mjs`, and
  `node integrations/game_data/census-facts.test.mjs`.
- Isolated database suites pass: `supabase/tests/employment.test.mjs` and
  `supabase/tests/bills-foundation.test.mjs`, using `PGLITE_MODULE` pointing to a
  temporary PGlite installation under `/tmp/team6310-merge-db`. Coverage includes
  replay eligibility, result ownership, peer percentages, small nonempty result
  cohorts, CAC bill settlement, retries, rollback, RLS/ACLs and cross-owner denial.

The full `git diff --check HEAD` also reports incoming trailing whitespace in the
PR's generated scenario inventory Markdown/HTML. Those artifacts are preserved
without unrelated whitespace edits; the frontend formatting check passes.

## Deployment boundary

The incoming 14 migration files and Edge Function are preserved from the PR.
No hosted migrations, functions, secrets, schedules or content were changed during
this merge. No Supabase MCP was available, so the target hosted migration history
and installed function definitions could not be independently checked. The PR's
reported hosted verification remains an author report, not verification by this
merge task. Review the target's migration history and function definitions before
any separately authorized deployment; do not blindly reapply these migrations.
Browser checks mock the API and database suites use disposable fixtures; neither
establishes hosted compatibility or deployment. Two opt-in frontend integration
tests require their configured local database environment and remain skipped.
