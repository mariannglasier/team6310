# Group join-code screen

Implemented November 9, 2026 at `/group/host` and `/group/join`.

Team-approved rules: globally unique join codes; enrollment only while a session
is open; restore the same host's open session on refresh. One open session per
host. Codes do not expire by clock time and are not reused. Closing is terminal.

Before creating the session, the host chooses 30, 60, 90, or 120 seconds per
decision. The selection is stored with the database session. Outcome reading is
untimed. The approved readiness assumption requires every joined participant to
be ready before the host starts; start/readiness operations remain later work.

The host UI follows the exported Figma prototype's setup and lobby layouts. It
shows a database-committed 12-character hexadecimal code, participant count,
status, timing, clipboard copying, refresh and retry.
Players enter the code on Join a Group to create an idempotent membership and
see a waiting confirmation. Enrollment creates one database-generated anonymous
participant ID per participant/session pair and returns that same ID on retries.
It does not collect a name or start an individual playthrough.

`20261109151703_group_join_codes.sql` adds globally unique codes and a unique
waiting host index. Public invoker RPCs delegate to functions in the non-exposed
`group_private` schema. These validate anonymous identity and host ownership,
select published content, serialize concurrent creation, and enroll only into
waiting sessions. Direct session/membership INSERT grants are revoked from
frontend roles. Existing row-level read policies remain in place. Code guessing
is limited to ten attempts per minute per anonymous identity; Supabase Auth's
anonymous-sign-in abuse controls are still needed to limit new identities.
`20261109183118_add_group_decision_duration.sql` adds the validated duration and
updates protected session operations to return it with the participant count.
`20261109185716_group_session_state_and_participant_ids.sql` changes the lifecycle
to `open`/`closed`, stores the active question in `current_scenario_id`, adds the
anonymous participant identifier, and links group playthroughs to a participant
membership. Protected read and update functions require host or member access;
only the host may update state, and an active question must belong to the pinned
content version.

`20261109191033_group_voting_rounds.sql` adds the facilitator-controlled voting
flow. Starting snapshots an ordered deck from the session's published content,
collapsing persona-specific copies with identical question text and excluding
scenarios without at least two choices. Each participant has one replaceable
vote per question while its configured timer is active. The host ends voting to
reveal the tally, then explicitly advances. Votes are preference records only;
they do not invoke individual financial effects or fabricate player decisions.

`20261109192118_group_household_readiness.sql` implements the Figma lobby setup.
Participants select a household from the session's pinned published edition and
explicitly mark themselves ready. The host receives a roster of anonymous,
session-scoped aliases with household and readiness status. Start is enforced in
the database only when at least one participant has joined and every participant
has a valid household and is ready. Setup locks when the first voting round starts.

`20261109194013_group_month_and_job_vote.sql` makes the group exercise a
pre-game job-board round followed by exactly Days 1–30. The job board uses the
published job catalog and one replaceable anonymous job vote per participant.
After the host closes job voting and advances, the protected operation stores
the winning job and opens Day 1. Session creation snapshots exactly 30 distinct,
voteable published scenarios; Day 30 completion closes the month.

## Connection and deployment

Migration applied to `cac-poverty-exercise` (`uucneyuspeqpygiucfvr`).
Local `.env.local` matches that project's URL and contains a publishable key.
Do not commit real environment values. Anonymous sign-in must be enabled.
Restart Vite after changing environment variables. Hosted frontend builds need
the same two VITE variables configured in hosting; frontend deployment is separate.

## Verification

- Frontend format, lint, typecheck, existing tests and production build passed.
- Four group UI tests cover creation/copy, restoration, recovery and enrollment retry.
- Five service tests cover Auth preparation, normalization, protected state reads
  and updates, malformed results, and controlled errors.
- Transactional database tests passed before and after deployment for
  creation/restoration, stable anonymous participant IDs, member retrieval,
  host-only progress updates, closed sessions, direct-write denial, and attempt
  limits. All fixture rows rolled back.
- Live REST/Auth verification passed using two disposable anonymous users:
  create, restore and enroll. Test sessions/users were then removed.
- Existing security advisor findings were reviewed before deployment; unrelated
  findings remain outside this task. No browser visual verification was performed.

New files: group session service and tests, group screen tests/styles, migration.
The existing `GroupPages.tsx` now contains the Host and Join interfaces.
