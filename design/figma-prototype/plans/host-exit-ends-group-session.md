# End group sessions when the host exits

## Approved behavior

- Remove **Resume group session** entirely.
- Refreshing, closing the host tab/window, navigating away from the app, or confirming an in-app exit ends the hosted session, in both lobby and active phases.
- In-app exits require confirmation; cancel keeps the session open and leaves the host in place.
- Preserve committed participant progress and personal results. Do not finish pending saves or advances while ending.
- Continue to label this as a single-browser, simulated prototype. Browser-exit handling is best effort, not reliable production presence detection.

## Scope and constraints

Change only the group lifecycle, its landing-page resume action/wiring, focused regression tests, and group documentation. Preserve approved individual screens, assets, styles, simulation arithmetic, schedule, and timer rules. Do not add competition, participant financial access for hosts, or a timeout policy.

Preserve the join-screen requirements: **Play with a group!**, no **Facilitator notes**, the existing shortened community-learning eyebrow, a dismissible **Session does not exist** dialog for invalid/unknown/ended codes, and access to saved personal progress without **Return to session**.

Respect previous selection restrictions: do not broaden `SimulationHeader.tsx` changes beyond the already-authorized group logo behavior. Prefer leaving that file untouched and handling its existing callbacks in the group flow. Do not change logo behavior on individual screens or other page variants.

## Repository findings

- `App.tsx` initializes group routing with `hasGroupView()`, exposes the landing resume callback, and returns from community learning with a `"resume"` entry mode.
- `LandingPage.tsx` renders the conditional resume action.
- `GroupFlow.tsx` currently preserves the view on Home, passes Learn through directly, and already has native dialogs for explicit ending and missing sessions.
- `groupSessionService.ts` stores all group data in `cac-group-prototype-v1`. `endSession()` reads the committed snapshot directly, marks the session ended, and clears deadlines and pending timestamps without resolving pending work.
- `retrieveState()` can commit due pending operations. Startup closure must therefore run **before** any recovery reads, including `hasGroupView()`.
- The app runs React Strict Mode. Effect cleanup must not end sessions.
- Prototype controls switch host/participant presentation inside the same document; this must remain usable.

## Implementation

### 1. Explicit document-level host ownership and startup closure

In `groupSessionService.ts`, add an optional `hostDocumentId` field on a group session and generate a single document identifier per loaded JS document, outside React rendering. `createSession()` records it on newly hosted sessions.

Add narrow service operations for:

- Initializing the document: synchronously end all non-ended sessions owned by an earlier document, including legacy snapshots with no ownership field.
- Ending sessions hosted by the current document on actual page exit, independent of which simulated role is currently displayed.

Both operations must load the last committed snapshot directly, reuse the same internal ending mutation as `endSession()`, and write one coherent snapshot. Never invoke pending-operation recovery first. Clear an ended host view so it cannot reopen as host; preserve participant identity and participant views for saved-progress access. Keep ended sessions stored rather than deleting them.

Run document initialization once from `src/main.tsx` before mounting React. Make it idempotent for repeated calls within the same document. A failed storage write must not be reported as success: prevent recovery/host restoration, surface a storage error and retry path, and retry initialization before allowing further group operations. Individual gameplay remains available.

Legacy behavior is intentionally retired: persisted open sessions from before this change are closed on the next document initialization, with committed progress preserved. No old host session resumes.

### 2. Browser lifecycle handling

Install document-level lifecycle listeners outside transient `GroupFlow` mounts, using the app root or a focused helper:

- `beforeunload`: request the browser's native warning only when the document owns an open session. Do not end or write in this handler, because users can cancel.
- `pagehide`: synchronously attempt to end sessions owned by this document, including page-cache navigation. Repeated events must be harmless.
- `pageshow` for back/forward-cache restoration: refresh the visible state so an ended session is never presented as playable.
- Do not end on `visibilitychange`, focus loss, React effect cleanup, rerenders, or simulated role switching.

If `pagehide` is skipped by a browser/process kill, startup initialization closes the abandoned local session before recovery on the next load. Document that closure cannot be guaranteed at the instant of an OS kill, nor can it notify another device in this prototype. A future production backend needs authoritative presence/expiry and authenticated host ownership.

### 3. Confirm in-app host exits

In `GroupFlow.tsx`, centralize navigation to Home/Play and Community learning through a host-exit guard. This covers the existing group logo callback, Play navigation, Return to Play, and Learn links without modifying shared header behavior.

- When the current document owns the open session, retain the requested destination and show the existing styled native confirmation dialog adapted to that destination.
- Explain that leaving ends the session for everyone and preserves already-saved progress.
- Cancel/Escape clears the pending destination, restores focus, and changes neither session nor route.
- Confirm runs the shared ending operation first, then clears host presentation and invokes the destination callback only after persistence succeeds.
- On storage failure, keep the user on the current screen, keep the dialog/action retryable, and show the existing error presentation.
- Explicit **Close lobby** / **End session early** uses the same ending semantics but may remain on the existing ended-host summary. Returning home thereafter needs no warning.
- Navigating to learning after ending must not return to an ended host dashboard as an active session; return to the landing page.
- Participant-only navigation does not close a session unless the same document also owns it through the prototype's simulated host controls.

Keep **Join as a participant** / **Switch to simulated host** as explicit internal prototype operations, not exits. The hosted-session ownership survives these switches, so refreshing or actually leaving still ends that session.

### 4. Remove resume UI and narrow restoration

- Delete the `onResumeGroup` prop, conditional button, and App callback; do not replace them with a renamed resume action.
- Replace the overloaded `"resume"` entry value with an internal `"current"` (or equivalent) entry used only for participant restoration and same-document prototype state, never as a landing action.
- After initialization, only a valid participant view may restore automatically. An ended participant view leads to the existing join form plus missing-session dialog and saved-progress access. A host view cannot restore a live session from a previous document.
- Ensure form/back controls never expose **Return to session** for an ended session.
- Retain existing participant rejoin behavior for open sessions and ended-session saved-results access. Do not create new participants in ended sessions.
- The removed resume button may let the existing layout naturally close its gap; do not redesign surrounding landing content.

### 5. Documentation

Update `GROUP_GAMEPLAY.md` to distinguish participant recovery from host refresh termination, explain prototype role-switch exceptions, describe the browser best-effort limitation and startup fallback, and replace the previous host-refresh-recovery verification claim with the new expectations.

## Verification

Use existing commands exactly:

1. `node --test tests/groupSession.test.cjs`
2. `node --test tests/gameSession.test.cjs`
3. `pnpm build` for this cross-file lifecycle change.

Extend group tests to cover:

- Current-document ownership on creation; initialization is idempotent and does not close a session created in the same document.
- New-document initialization ends both lobby and active sessions, including legacy snapshots.
- Startup closure precedes recovery even when pending save/advance timestamps are overdue.
- Repeated explicit/lifecycle ending preserves committed ledgers, completed participant recaps, identities, and personal saved-progress access; deadlines and pending timestamps are cleared.
- Current-document lifecycle closure still works while displaying the simulated participant role.
- Unknown/new identities cannot join ended sessions; existing identities can reach preserved results without reopening play.
- Unrelated individual save keys remain untouched.
- Failed persistence does not publish a successful end, clear the host view, or permit recovery before initialization succeeds; retry works.

Manually verify through the existing supervised preview; do not start another development server:

- No resume button before or after hosting, ending, or reloading.
- Logo/Play/Return to Play/Learn exits: cancel leaves the lobby/game unchanged; confirm ends it and navigates correctly.
- Explicit ending, lobby closure, and refresh in both phases.
- Browser warning cancellation leaves the session open; confirmed reload closes it.
- Page exit/return through back-forward cache never reopens play.
- Simulated role switching remains functional; refresh afterward ends the owned session.
- Switching tabs or minimizing does not end the session.
- Ended participants see the dismissible missing-session dialog; Close focuses/selects the code input; saved progress remains available and no Return to session appears.
- Dialog keyboard/focus behavior and narrow/mobile layout remain intact.
- Individual gameplay and shared-header logo behavior outside group mode remain unchanged.

The documentation records an existing unrelated `tsc` syntax issue in `src/AdminPortal.tsx`; do not fix it as part of this work or claim typechecking passed without running it. Runtime/browser checks should be reported as completed only if actually performed.

## Completion criteria

There is no user-visible host resume path. Any approved host exit ends the locally hosted session, with deterministic reload fallback before pending work can recover. Only committed progress survives; individual-game behavior and the requested join-screen presentation are preserved. Verification results and browser limitations are reported accurately.
