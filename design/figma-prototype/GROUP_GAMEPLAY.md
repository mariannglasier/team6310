# Group gameplay prototype

## Scope and demonstration

This is a local, single-browser prototype. It does not synchronize devices or
provide authorization. `src/groupSessionService.ts` is the replaceable session
operations boundary; React presentation lives in `GroupFlow.tsx`. The individual
snapshot (`cac-gameplay-v2`) is never overwritten by group play. Group snapshots,
view, participant identity, setup stage, pending operations, ledger, and absolute
timer deadlines persist in separate localStorage keys. There is no host resume
path: refreshing, closing the tab/window, navigating away, or confirming an
in-app host exit ends the locally hosted session, in the lobby or during play.
Only committed progress and personal results are preserved.

1. Choose **Host a group**, configure decision duration, and create a session.
2. Copy its generated code. Expand **Prototype controls** and simulate arrivals
   to demonstrate the lobby; four arrivals are sample data, not a participant limit.
3. Choose **Join as a participant** and enter the same code. Complete the approved
   household carousel, CAC support selection, and Final Review. Neither option
   is preselected for the real participant.
4. Confirm setup. On the waiting screen choose **Switch to simulated host**.
   Finish sample setups and start once **every joined participant** is ready.
5. **Join as a participant** with the same code to reconnect to the same identity.
   Choose, observe saving and consequence, then choose **Ready to continue**.
   Switch to the host and advance that participant alone. Rejoin to see the next
   stage. The last outcome’s readiness opens that participant’s own results.
6. **Simulate next sample event** affects sample participants only, alternating
   saved choices, readiness, and notice acknowledgement. Host advancement remains
   individual. Connection toggling is also explicitly simulated.
7. Test early ending and its confirmation. Participants see a dismissible
   **Session does not exist** pop-up over the join form, also used for invalid or
   unknown codes. Closing it focuses the code field to enter another code. Existing participants can
   choose **View your saved progress** to access their preserved partial results.
   Community learning is a standalone page, available without playing.

Anonymous aliases are assigned in join order and carry no rank or rewards.
The host cannot open another participant's financial recap.

## Preserved rules

The individual simulation has seven approved decisions on days 1, 4, 8, 15, 22,
29, and 30. Group play reuses that schedule, choice data, support gating, scheduled
charges/deposits, ledger IDs, and calculations unchanged. The read-only tracker
generates exactly 1–30 from data; it is not a day navigation control. Days without
approved scenarios are not fabricated.

Existing setup, logo, neighborhood background, household illustrations, buttons,
typography, colors, gameplay layout, receipt, and reduced-motion-aware entry
transitions are reused. New group styles are scoped.

Operations: `createSession`, `joinSession`, `updateSetup`, `markReady`,
`startSession`, `submitChoice`, `markReadyToAdvance`, `advanceParticipant`,
`endSession`, `retrieveState`, and `acknowledgeCharges`. `simulateEvent` and
`setView` are explicitly prototype-only controls.

Saving persists the selected option and a due timestamp before completing a
mock 650ms operation. Retrieval resumes an accepted pending save, atomically
writing its outcome and ledger, with existing stable transaction IDs. A choice
accepted before expiry can finish saving after expiry. Only successful snapshot
writes are published. Storage failures surface with no confirmed money change;
retrieval retries pending work without duplicating it.

Ready-to-advance does not change the day. The host's per-participant advance
persists a processing marker that disables repeat requests; retrieval completes
it once. Scheduled transaction notices pause the next decision's timer until
acknowledged. Consequence reading is not timed. Rejoining retains the original
deadline, not a fresh duration.

Ending reads the last committed snapshot without completing pending saves or
advances, clears all operation timestamps and timer deadlines, and closes choices.
Results list only committed decisions and ledger totals. A completed participant
retains a completed-month recap; other participants see **Session ended by host**.
Lobby participants with no gameplay see that no decisions were completed.

Home/Play (including the group logo), Return to Play, and Community learning
require confirmation while this document owns an open session. Cancel/Escape
keeps the session open. Confirm ends it before navigating; storage failures
keep the exit retryable. Learning after a host exit returns to Play, not a host
dashboard. Explicit Close lobby / End session early can retain an ended summary.

Ownership belongs to the loaded document, not the visible simulated role.
**Join as a participant** and **Switch to simulated host** are internal prototype
operations, not exits. Refreshing or leaving from either role still ends a session
hosted in that document. Switching tabs, minimizing, focus loss, and React
cleanup do not end it. A valid participant view may restore for saved-progress
access; an ended participant sees the missing-session pop-up, not resumed play.

Browser exit handling is best effort. `beforeunload` requests a native warning
where supported and does not write, so cancelling leaves the session open.
`pagehide` attempts synchronous closure, including back/forward-cache navigation;
restoring that page refreshes its visible state. If the browser skips `pagehide`
(for example after an OS/process kill), the next loaded document closes prior
and legacy sessions **before** recovering pending operations. Failed startup
persistence blocks group operations until retry succeeds; individual play remains
available. This cannot guarantee immediate closure at an OS kill or notify
another device. Production needs authoritative presence/expiry and authenticated
host ownership, not these browser heuristics.

## Configurable assumption and unresolved product rules

- **Configurable assumption:** everyone who has joined must be ready before start.
  There is no assumed participant cap.
- **Unresolved:** timeout resolution. At expiry the participant waits for the host,
  with no selected choice, penalty, or automatic outcome. Advancement is unavailable
  because no outcome was saved. The host can end the session. Retry, extension,
  bypass, or removal policies require product approval; none is silently invented.
- Late new joins are closed after start; an existing identity can always reconnect.
  Any production late-entry policy remains to be approved.
- Decision durations are selectable prototype configuration, not a mandated
  45-second rule. Production supported duration ranges need approval.

## Required production integration

1. **Authorized host controls:** authenticated host ownership checked server-side
   for creation, starting, advancing the specified participant, and ending. Remove
   prototype role-switching and simulated-event controls in production.
2. **Participant-scoped access:** opaque authenticated/recoverable participant
   identity; only their own setup, choices, ledger, and results are readable.
   Host progress subscriptions must omit financial and household/support details.
   Rate-limit code attempts and define session-code lifetime and retention.
3. **Server-authoritative timers and financial calculations:** authoritative
   deadlines and transaction arithmetic in integer minor units; reconcile server
   clock offsets on clients. Reject choices received after the deadline.
4. **Atomic saving and duplicate protection:** persist decision, ledger, stage,
   operation IDs, and version in one transaction. Use unique constraints,
   idempotency keys, and optimistic locking; protect advances and session ending
   against concurrent save/advance requests. Define ordering of end/save races.
5. **Reliable synchronization and recovery:** authenticated realtime subscriptions
   or versioned polling, durable participant membership, connection presence,
   reconnect snapshots and replay cursors, reliable delivery and retry behavior.
   Do not reset deadlines or create participants when reconnecting.
6. **Content-version consistency:** pin scenario/choice/expense versions when the
   session is created and serve those versions until it ends, including refresh
   after deployment. The prototype tags snapshots and rejects incompatible joins;
   production needs actual versioned content storage, not just a version label.
7. Approve timeout resolution, accessibility accommodations, participant removal,
   late entry, retention/privacy, and disconnected-participant facilitation policy.

## Verification

- `node --test tests/groupSession.test.cjs`: group operations and recovery.
- `node --test tests/gameSession.test.cjs`: preserved individual financial rules.
- `pnpm build`: production build.
- `pnpm exec tsc --noEmit`: known existing syntax failure in
  `src/AdminPortal.tsx:407`, unrelated to this work. The active app dependency
  graph can be checked separately using the installed TypeScript compiler API.

Earlier browser verification covered host creation, sample arrivals, unselected household
and support setup, waiting, starting, saved outcomes, readiness without advancing,
individual host advancement, native confirmation focus, partial
results, and community-learning return. Desktop and 320px/390px mobile layouts
were checked for horizontal overflow; reduced motion disables stage animations.
The approved local logo and neighborhood image were confirmed at their callsites.

Host refresh recovery is intentionally retired. Lifecycle regression tests cover
document ownership, abandoned lobby/active/legacy closure before overdue recovery,
role-switch ownership, repeated ending, preserved recaps/identities/individual
keys, ended-session join restrictions, and failed persistence with retry.
Current-change Chromium checks against the supervised preview passed for:
absence of resume UI, group-logo exit cancellation/confirmation and restored
focus, learning exit and landing return, refresh termination from the simulated
participant role, active-host native reload warning cancellation and acceptance,
in-app storage failure with successful exit retry, ended-session dialog dismissal
and code-input focus, and no horizontal overflow at 390px. No runtime exceptions
were observed. The first test browser hit resource limits; rerunning with
shared-memory-safe browser settings succeeded. External font stylesheet requests
encountered a certificate error in that test environment.

Actual tab/window closure, back/forward-cache restoration, tab switching/minimize,
and the full keyboard/mobile matrix remain unverified for this change. Service
tests do not establish browser event delivery. The production build succeeds
with a bundle-size warning; an active-app TypeScript check including
`src/vite-env.d.ts` passes (not the full-repository `tsc` entry point).
