# Stage 3 local integration: blocked by baseline differences

**Subsequent status:** reconciliation and Stage 1 are complete locally, and
[Stage 3 genuine Auth/API verification](staff-individual-stage3-api-verification.md)
passed on November 14. Stage 4 has not started. The original read-only findings
below are retained as the pre-reconciliation record.

November 13, 2026. Read-only checks used `docker --context default` and the
`supabase_db_team6310-phase2-verification` container. No hosted connection was
used. No database changes, migration application, test identities, or gameplay
records were created. Browser testing and Stage 4 were not started.

## Environment and preflight

The local Supabase database, Auth, REST, Kong, metadata and Studio containers are
running. Database catalog queries through local PostgreSQL succeed. The selected
Docker Desktop context has a missing socket; the system `default` context works.

Comparing current local `pg_get_functiondef` hashes and policy expressions with
the reviewed Stage 1 baseline found material differences:

- `public.cac_staff` and `public.is_cac_staff()` are absent.
- `get_scenario_recap_facts(uuid, uuid)` and
  `get_event_recap_facts(uuid, text)` are absent.
- `submit_scenario_decision(uuid, uuid, uuid)` has local definition hash
  `9b5964183cf2de0c32f6de410a1ee78a`, versus reviewed hash
  `edf74410eb87fbc8f3a004b9c85c2f72`. The local definition predates the
  non-scheduled scenario condition, CAC eligibility, upfront-cost check,
  employment ending-state synchronization and assistance-use update.
- No functions exist in `group_private`, so this local stack lacks the reviewed
  group implementation required for the positive and negative group checks.
- The other nine existing Stage 1 target functions match their reviewed hashes.
- The four ownership policies on playthroughs/responses/expenses match the
  reviewed expressions. `is_individual_player()` is not installed.

These are application-schema differences, not a Docker startup failure. The
Stage 1 migration intentionally refuses this baseline; its guards were not
removed or bypassed. The earlier explicit instruction to stop and report material
local-definition differences prevents silently replacing these definitions.

## Coverage

| Level                                                          | Result                                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Real local infrastructure/catalog                              | Passed: running local containers, database connection, function and policy comparison.                       |
| Real Auth/API gameplay                                         | Not run: Stage 1 could not safely be applied to the current baseline. No genuine test sessions were created. |
| Isolated database authorization/concurrency                    | Previously passed in Stage 1; not rerun or counted as real Supabase integration.                             |
| Frontend mocked verification                                   | Previously passed in Stage 2; not substituted for Stage 3.                                                   |
| Anonymous/staff individual lifecycle, ownership and revocation | Unverified against genuine local Auth/API.                                                                   |
| Anonymous group operation and staff group rejection            | Unverified against genuine local Auth/API; reviewed group functions are absent locally.                      |
| Dashboard session preservation                                 | Unverified with genuine local Auth/API; no browser testing performed.                                        |
| Failed gameplay cases                                          | None executed; preflight failed because the application schema differs materially.                           |

## Required next step

Review and authorize a local-only schema reconciliation to the already reviewed
application baseline, preserving existing local data and without resetting the
database, changing Auth architecture or touching hosted Supabase. This includes
the staff authorization foundation, current scenario/recap dependencies and group
implementation. Then repeat the Stage 1 preflight, apply Stage 1 locally, verify
catalog/ACL/RLS results, and run the genuine Auth/API matrix with scoped cleanup.
