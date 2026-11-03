> Hosted-schema reconciliation now supersedes the earlier missing-schema status below. See [compatibility, real local verification and deployment recommendation](hosted-schema-compatibility.md).

# Phase 2 implementation and migration review

## Deployment boundary

`supabase/migrations/20261103000000_employment_gameplay.sql` is prepared for review
only. It has not been applied to hosted Supabase. No hosted writes, publication
changes, old migration rewrites or database resets were performed.

The verified 13-column inventory supplies existing JSONB employment storage and
financial/job/day/support fields. The migration reuses these fields, adds three
functions and one AFTER INSERT trigger, and grants only action-RPC execution.
It does not rely on service_role table grants or grant participant UPDATE access.

**Preflight resolved:** the hosted structural export lists no playthrough status/day
CHECK constraint, so `completed` and `ended` require no constraint amendment.
The final hosted preflight confirms postgres execution/ownership privileges,
nonprivileged participant roles without owner membership, and configured skill
flags for published personas. The supplied fallback result contains three
eligible no-skill jobs. The tested migration is ready for hosted deployment
review; it remains unapplied. See the reconciliation report for evidence hashes,
local integration results, the deployment sequence and rollback procedure.

## Fresh and legacy runs

The AFTER INSERT trigger stamps only new, initially empty individual runs with
an engine/version marker and an uninitialized stage, after the existing INSERT
policy checks. This preserves the existing invoker start RPC and UUID return.
The trigger never backfills or updates earlier runs. Existing null employment
states and unknown documents are read-only recovery failures, never candidates
for initialization. Other nonempty documents are not overwritten.

Pre-game is represented by stage while current_day remains 1; the UI shows
Before Day 1. Initialize loads skills/catalog and locks support. Non-CAC runs
start without assistance. A CAC initialization references an owned completed
non-CAC Phase 2 run at Day 30. The same predecessor may qualify multiple fresh
replays: the existing gameplay specifies no one-use eligibility restriction.
Retries on a single run are idempotent; replay references never modify the prior
run. Local Phase 1 progress is not imported or treated as server completion.

## Authoritative actions and restoration

submit_employment_action locks the owned playthrough, checks an existing request
receipt before revision/terminal checks, validates stage/intent/content and
calculates exact numeric changes. It commits JSONB progress/history/receipts,
balance, day, hired job, support and status in one transaction. Clothing is $60;
hiring and weekly pay preserve Phase 1 rules. Wage day identities under the same
row lock prevent repeat credits. Recap stages survive refresh; acknowledgment
never reapplies a financial consequence. No fake choices/player_responses or
expense records are generated for this employment-only flow.

The client displays the returned committed run and decodes validated employment
state. It retains selection only while awaiting confirmation and blocks actions
while a request is pending/uncertain. Owner-scoped local storage contains the
run locator and pending intent/request ID, never authoritative finances. A lost
response retries the identical persisted request. A known server rejection
clears that pending request and instructs refresh before another attempt.
Storage failure prevents submitting an action whose retry identity cannot be
persisted. Missing/invalid recovery never creates a replacement automatically.
A user can explicitly list and choose owned saved runs; multiple matches are
never resolved by silently picking the newest.

Creation persists the locator before returning its UUID. If storage is unavailable,
the existing owned-run chooser remains the recovery path. Creation retains its
non-idempotent uncertain-result warning and is never automatically retried.

## Local verification

The standalone `supabase/tests/employment.test.mjs` runs against an isolated
PGlite PostgreSQL schema fixture, not a reconstruction of the hosted database.
Install @electric-sql/pglite outside the repository and set PGLITE_MODULE to its
module path to run it. It verifies PL/pgSQL, ownership/permissions, legacy
preservation, exact deductions, receipt retries, stale revisions, both wage
schedules, CAC references, terminal guards and insufficient funds. PGlite queues
one connection; these tests do not prove real multi-session lock behavior or
hosted schema compatibility. Run concurrent-transaction tests on a disposable
PostgreSQL environment before hosted deployment.

Frontend tests cover incompatible documents, participant-scoped locators,
lost-response retries and rejection without local financial mutation. Browser
Supabase mocks model committed snapshots; database assertions are separate.
The full poverty simulation, approved facts and ordinary bills remain absent.

## Newly created run rejected before backend deployment

The existing creation RPC returns a UUID and inserts null employment_state.
Only the prepared AFTER INSERT trigger adds the Phase 2 initialization marker.
With the migration intentionally unapplied, successful creation therefore does
not imply employment-backend readiness. The client formerly masked this as
"This run cannot be resumed by this version." It now distinguishes missing
markers from unsupported documents and unrelated restoration failures. It never
fabricates a marker or initializes a null document. Even a recognized marker is
rejected when the run is progressed, ended, or otherwise not fresh.

A component regression exercises the actual creation and loading services with
the unmodified RPC response. The isolated SQL regression runs the recorded RPC
before/after the prepared migration and confirms the old null-state run remains
untouched. Applying the migration later does not unlock already-created unmarked
runs; only eligible runs created after deployment receive the server marker.
This is a deployment prerequisite, not a client-side validation bypass.

## Security corrections before deployment

The two SECURITY DEFINER functions are explicitly owned by the existing
playthrough-table owner. A pure SECURITY INVOKER document validator has the same
owner and no client EXECUTE grant. Ownership is no longer inherited implicitly
from whichever role runs the migration. This deliberately uses table-owner
access for the narrow gameplay updates; it is not a new least-privilege role.
The migration aborts when playthrough RLS is disabled, FORCE RLS is enabled,
or the selected owner lacks the required content SELECT privileges. Owner
memberships and content RLS visibility still require hosted review.

At the end of the transaction all nonowner function grants (including inherited
creation defaults recorded as direct ACL entries) are revoked. Only authenticated
receives gameplay EXECUTE. Membership in the owner role remains a deployment
review item; ACL cleanup cannot remove the owner's inherent authority. No global
default privileges or table permissions are altered.

Requests are shape-checked before row locking. Both target/replay SELECTs and
the final UPDATE include caller ownership predicates. Day comparisons are
null-safe. Shared SQL document validation rejects textual schema versions,
malformed receipts/history and incompatible documents before writes. Client
validation now enforces corresponding numeric, receipt and monetary shapes.

The insertion trigger independently verifies anonymous identity, ownership,
started_at, published persona/edition and the approved starting balance.
Maintenance/registered-user inserts and mismatched inserts remain unstamped,
even if their path bypasses RLS. Existing runs are never backfilled.

Before applying, run the read-only preflight queries and review function/table
owners, role inheritance, effective INSERT policies, default grants and terminal
status/day constraints. Only after that review, the deployment operator must
explicitly execute `SET cac.employment_security_reviewed = 'on'` in the deployment
session. The migration fails closed without this acknowledgment. This setting
is not proof of a review and does not replace checking the query results.
No hosted inspection, acknowledgment or deployment was executed by this change.
