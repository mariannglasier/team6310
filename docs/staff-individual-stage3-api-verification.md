# Stage 3: genuine local Supabase Auth/API verification

**Subsequent status:** [Stage 4 real-browser verification](staff-individual-stage4-browser-verification.md)
has now passed locally. The original Stage 3 scope and limitations below are
retained for history. No hosted deployment has occurred.

November 14, 2026. **All nine requested verification areas passed.** Tests used
the existing reconciled local database and its already-applied Stage 1 migration.
No reset, migration reapplication, database-definition change, frontend edit,
hosted request, browser testing or Stage 4 work occurred.

## Method and identities

The new `tools/test_staff_individual_local_api.py` runner fixes its API endpoint
to `http://127.0.0.1:55321` and its SQL connection to the local verification Docker
container through the `default` context. It refuses redirects and disables HTTP
proxies. It reads the ignored local verification environment without changing it.
It never accepts a hosted URL or prints keys, passwords or session tokens.

The full run used five genuine Auth identities: one anonymous individual/group
host, two independently authorized staff accounts, one independently revocable
staff account, and a second anonymous user required for separate group membership.
Staff accounts signed up and signed in through the password token endpoint.
Only their actual Auth UUIDs were inserted into `cac_staff` by trusted local SQL.
Before provisioning the first staff account, its ordinary authenticated session
was also verified ineligible, avoiding another account solely for that test.

Protected gameplay used HTTP Auth, PostgREST RPC and REST requests with the access
tokens issued by Supabase. Every created individual run was read through REST
and its owner UUID compared with the UUID returned by `/auth/v1/user`. No JWTs
were forged and no simulated `request.jwt.claims` were used.

Direct SQL was limited to prerequisite/catalog inspection, trusted staff
provisioning/revocation, separate synthetic group content, preservation checks and
scoped cleanup. It did not fabricate player answers, balances or progression in
the runs under test.

## Genuine Auth/API coverage

| Requested area                                        | Result and evidence                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anonymous individual creation and operation           | Passed. Existing bills fixture, full employment sequence, ordinary decisions and Day 30 completion.                                                                                                                                                                                                                             |
| Staff creation using the existing staff Auth identity | Passed. Three separate password accounts created owned runs; returned owners matched genuine Auth user UUIDs.                                                                                                                                                                                                                   |
| Staff refresh and owned restoration                   | Passed. Genuine refresh-token exchange followed by fresh REST and snapshot requests retained the same UUID and committed state.                                                                                                                                                                                                 |
| Employment, decisions and bills                       | Passed for anonymous and staff runs. Application/reapplication/interviews, scheduled wages, ordinary submissions/restoration, Pay and Ignore, duplicate bill/decision requests, and exact final financial reconciliation.                                                                                                       |
| Termination, completion and replay                    | Passed. Day 30 completion with unpaid obligations, support-enabled replay, preparation, explicit termination and repeated termination receipts.                                                                                                                                                                                 |
| Staff isolation                                       | Passed. Another authorized staff UUID received empty REST results for the run/responses/expenses, no financial snapshot, and rejected employment/Pay/Ignore RPC requests. Original owned state was unchanged.                                                                                                                   |
| Revocation                                            | Passed. An active run became inaccessible using the unchanged, still-valid Auth access token after `cac_staff.active=false`. Creation/actions/bills/scenario submissions were rejected, reads and recaps hidden. A genuine session refresh did not restore staff permission.                                                    |
| Staff group rejection                                 | Passed for both active staff accounts. Host creation, enrollment, state retrieval, job votes and scenario votes returned the existing `42501` anonymous-session requirement.                                                                                                                                                    |
| Anonymous group functionality                         | Passed after the harness correction below. Distinct real anonymous host/member identities created/joined a group, chose a household, submitted employment votes through reapplication/hiring, voted through all 30 scenario days, completed, refreshed and restored group state. The member could not perform host advancement. |

The same staff session remained a genuine authenticated user and returned true
from `is_cac_staff()` after gameplay. A staff-only dashboard content REST request
also succeeded. This verifies the dashboard **API boundary**, not browser
navigation or dashboard rendering.

The second staff account also refreshed and retried an already-committed request
using the same request UUID; no effect was reapplied. This checks receipt recovery
over genuine HTTP but does not simulate an actual transport-level lost response.

## Initial failure and investigation

The first anonymous group case failed with `That job is not available.` The
harness looked for a nonexistent `sharedJobId` response field, then selected the
original job again during the second application. The unchanged server correctly
rejects that choice on reapplication.

The harness now tracks its first submitted job ID explicitly. A focused rerun
asserted that the same-job choice is rejected, selected the other job, and passed
the entire group journey. No application function, policy, Auth setting or
security rule was changed. There are no unresolved executed test failures.

The full run made 512 local HTTP requests and cleaned up all five identities,
six individual runs and its group fixture. The focused group rerun used only two
necessary anonymous identities and made 153 requests. Private UUID/result
evidence is retained at:

- `/tmp/team6310-stage3-api-s3r61i50/results.json` — full run, including the initial group harness failure;
- `/tmp/team6310-stage3-api-qmznqh5o/results.json` — successful focused group rerun.

## Cleanup and preservation

The test group used a new, uniquely identified synthetic content edition with
one cloned household, two cloned local test jobs and 30 zero-effect test scenarios.
This supplied the complete group month missing from existing local fixtures.
Original editions were neither modified nor replaced.

Cleanup signed out the tracked sessions, removed only records owned by the newly
created Auth UUIDs, deleted those staff records/Auth users, and removed only the
new test edition and its dependencies. The test edition was returned to draft
solely for its cleanup through the existing content guards; no trigger or
constraint was disabled.

After **both** runs, all 27 application-table and Auth-user fingerprints matched
their respective pre-test snapshots. Existing 130 Auth users, 145 playthroughs,
90 responses and 224 bill occurrences remained intact. Function definitions,
execution ACLs, policies and trigger definitions matched their pre-test hashes.
No test accounts, runs, group sessions or synthetic content were retained.

## Other verification levels and remaining boundary

| Level                                                       | Status                                                                                                                                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Genuine local Auth/API                                      | Passed as detailed above; no mocked frontend responses substituted.                                                                                                     |
| Isolated PostgreSQL authorization/concurrency               | Previously passed in Stage 1 on November 14; not rerun or counted as genuine Auth/API verification in Stage 3.                                                          |
| Isolated employment/PGlite and bills/PostgreSQL regressions | Previously passed in Stage 1; distinct from this HTTP run.                                                                                                              |
| Local database cleanup/catalog verification                 | Passed after both HTTP runs.                                                                                                                                            |
| Failed cases                                                | Initial group harness selection failure, corrected and successfully rerun; none unresolved.                                                                             |
| Unverified                                                  | Browser refresh/navigation/rendering, actual dashboard UI return, transport-failure injection, production content-library completeness, and hosted behavior/deployment. |

Reproduce the complete local HTTP suite with `python3 tools/test_staff_individual_local_api.py`.
`--group-only` runs only the group regression with two anonymous identities.
The runner always uses scoped cleanup and returns nonzero on an executed failure.
It needs access to the local Docker socket and loopback API.

Stage 3 is complete. Stage 4 has not started.
