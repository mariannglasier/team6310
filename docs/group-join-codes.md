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
shows a database-committed session code, participant count,
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

Players may change their vote until the server deadline. Each player counts
once per round using their latest accepted choice. The deadline closes vote
acceptance, and the facilitator manually reveals the results. Polling failures
show a reconnecting message while the last synced question remains visible.

Revealed results show the share of votes cast, the number who answered, and
the number who did not. The question’s verified, edition-pinned community
fact and applicable CAC fact appear after reveal. If no verified copy is
available, the result includes a discussion prompt. The facilitator chooses
when to advance.

The group access API regression test is in
`supabase/tests/group-access-api.test.mjs`. It runs against a disposable local
Supabase API with published content when `GROUP_TEST_PUBLISHABLE_KEY` is set,
or against local PostgREST with a fixture-only signing key and preseeded Auth
users. It checks concurrent creation and enrollment, code routing, invalid
and closed code denial, and facilitator, participant, and outsider boundaries.
The verification run used PostgreSQL and PostgREST with signed test identities.
Set `GROUP_TEST_RECONNECT_PERSONA_ID` to a published household with a full
calendar and two eligible jobs to exercise active-round reconnection and
simultaneous votes. Set `GROUP_TEST_WAIT_FOR_DEADLINE=1` to also test that an
expired round rejects votes and keeps tallies hidden until the facilitator
reveals them. `supabase/tests/group-vote-deadline.sql` checks the cutoff with a
transaction that starts before the deadline and submits again after it. The player
tab remembers only the group session ID, and restoring votes still requires
the original anonymous membership. Returning members can also re-enter their
code while voting is open. New enrollment ends when the facilitator starts.

The shared expense sidebar lists the next three unresolved bill occurrences,
ordered by due day. Recurring expenses appear as separate occurrences. A
confirmed Pay deducts the amount on the due day, and paid or ignored
occurrences leave the upcoming list. Overdue settlements follow the separate
overdue workflow.

Scenario option prices use the upfront cost in the pinned Supabase edition
when one applies, and otherwise show the saved balance effect. The group shows
prices on live options and saved results. The paid tax-preparation choice
deducts its stored preparation fee in group play. Individual tax outcomes
continue to follow the individual rules.
Bill amounts use the saved bill principal and any incurred late fee.

Group hiring takes place before Day 1. Checks are deposited into the shared
balance on Days 7, 14, 21, and 28 as each day opens. The stored last payday
prevents duplicate deposits. Existing sessions receive deposits on future
scheduled paydays without retroactive credits. The migration requires
deployment.

New group sessions snapshot bill definitions for the winning household from
the pinned edition. Bill days occupy their own calendar slots. Each bill uses
a timed Pay or Ignore vote and the facilitator confirms the winning choice
before the group proceeds. A tie, zero votes, or an unaffordable winning Pay
choice can be sent back to voting. Ignore incurs the defined fee once. The
facilitator can open another vote for an overdue bill during day results, and
a successful payment settles principal and fee together. The ending reports
unpaid bills and fees separately from the shared balance.

Group tallies show the count and share of votes cast for each option. A round
with no votes shows zero percent for every option. The ending review calculates
each day's percentages from its saved scenario tallies.

The group job board and vote validation use the winning household's English
and computer skills from the session's published edition. Completing CAC
preparation grants both skills. The second job board excludes the first
interview's job. The group job eligibility migration requires deployment.

Starting from the lobby requires 30 distinct, voteable published scenarios
eligible for the winning household. The lobby displays the server's error if
the pinned edition does not meet that requirement.

Leaving the host lobby through Back to home closes the session before
navigation. The facilitator can also end an active round from the host view.
Participants in a session ended by the facilitator return to the join form
when the next session update arrives. Normal completion opens the saved review.
Host a group on the landing page closes any leftover open session and opens
fresh setup. Reloading the host page directly restores an open session.
The facilitator-exit migration records whether the host ended the session.
This migration still needs to be applied to hosted Supabase.

The four-character join code migration generates new codes using uppercase
letters and digits, omitting I, O, 0, and 1. Existing open sessions retain their
12-character codes. The global unique index still reserves previously issued
codes, and session creation retries collisions before returning a retry message.

### Group ending review — November 16, 2026

The group Host and Join screens now use a dedicated ending card based on the
checked-in Figma prototype's `GroupResults` and replay layout. It shows the saved
shared balance, actual day reached, assistance availability, expandable scenario
vote tallies, and the caller's own vote where present. Other participants' votes
are shown as counts, without names or Auth identifiers. Unanswered scenarios are
omitted. These are saved preference votes; the review does not imply that every
vote caused a financial transaction. Employment voting history is not included:
the existing employment tables replace/delete votes across interview attempts.

Hosts can replay with or without CAC assistance through the existing protected
session-creation operation, retaining the decision duration. Replay creates a new
code and fresh household/readiness setup; participants explicitly join that code.
Failed creation leaves the previous summary available. Individual play is unchanged.

`20261116152935_group_ending_review.sql` prepares the read-only
`get_group_session_review` RPC. It delegates to a private function that first
checks the existing anonymous host/member authorization and rejects active
sessions. It adds no direct table grants and changes no financial operations.
This migration has **not** been applied to hosted Supabase. The review requires
it; otherwise the screen offers a retry while balance and replay remain available.
No historical migrations or local manual startup instructions were changed.

Verification: format, lint, typecheck, production build, and `git diff --check`
passed. The full Vitest rerun with two workers passed 398 tests, with two skipped;
an earlier staff-login timeout passed both its isolated rerun and the full rerun.
The new browser test passed its keyboard, overflow, tally, and replay assertions
at desktop, tablet, mobile, and 320-pixel widths. Desktop and narrow-mobile
screenshots were visually inspected. The Playwright runner stalled during server
teardown after all four cases passed and was interrupted; its overall exit was
therefore not successful.

`supabase/tests/group-ending-review.sql` provides rollback-only checks for
own-vote restoration, tallies, repeatable reads, unanswered-day omission, and
active-session/nonmember/unauthenticated denial. These database tests could not
run because the local Docker daemon was unavailable. Existing host restoration
still restores open sessions only; returning to a finished session after a full
page reload is outside this change.

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
