# Stage 4: staff individual gameplay in Chromium

November 14, 2026. **Passed against the real local application and Supabase.**
No runtime application changes were needed. No hosted endpoint, deployment,
migration, authorization change, retention feature or run classification was used.

## Browser test and method

Added:

- `frontend/e2e-local/staff-individual.spec.ts`
- `tools/staff_browser_fixture.py`

The test used Chromium (`/usr/bin/chromium`) at 1280×900, the local Vite
verification server at `http://127.0.0.1:4175`, and Supabase at
`http://127.0.0.1:55321`. Network routing only rejects nonlocal origins; it never
fulfills requests with mock responses. Gameplay changes are made by browser
clicks, not injected balances, simulated JWT claims, direct progression writes
or service-method action calls. Read-only verification uses the actual browser
client's `getUser()` and protected financial snapshot RPC.

One temporary password account was provisioned as authorized staff before the
browser signed in through the normal employee login form. A separate browser
context then tested one genuine anonymous participant. The existing synthetic
bills edition supplied gameplay content; no content edition was added or changed.

## Walkthrough results

| Browser journey                                     | Result                                                                                                                                                                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Open app, sign in, load employee dashboard          | Passed through the real form; dashboard content loaded without alerts.                                                                                                                                                         |
| Main site → individual simulation → new playthrough | Passed through visible controls; backend owner matched the existing staff Auth UUID.                                                                                                                                           |
| Employment setup                                    | Passed initial application, interviews, reapplication and hiring through UI controls.                                                                                                                                          |
| Ordinary gameplay and bills                         | Passed four ordinary submissions, five payments and three Ignore actions; successful RPC responses were observed.                                                                                                              |
| Refresh during a committed ordinary recap           | Passed. The owner-scoped locator, run UUID and complete saved snapshot were unchanged, and Continue remained available.                                                                                                        |
| Return to employee dashboard                        | Passed by browser navigation to the existing `/admin/dashboard` route; signed-in dashboard content remained accessible without another login.                                                                                  |
| Dashboard → Main site → Start simulation            | Passed. The existing active run resumed with the same UUID and saved state.                                                                                                                                                    |
| Complete the run                                    | Passed through Day 30, including scheduled income and outstanding bills.                                                                                                                                                       |
| Supported replay                                    | Passed “Try again with CAC support,” household selection, a distinct new run, server-confirmed support eligibility and CAC preparation.                                                                                        |
| Terminate replay                                    | Passed the Give Up confirmation dialog; server status became `ended`.                                                                                                                                                          |
| Staff group access                                  | The group host route showed its existing blocked restoration error. No group session or membership was created. Returning to the dashboard still worked. Genuine host/join/vote API denial was separately verified in Stage 3. |
| Anonymous participant regression                    | Separate context created one anonymous identity, started an owned run, initialized employment, refreshed/restored that run, submitted an application and terminated through the UI.                                            |

The dashboard round trip used the existing admin URL and existing “Main site” /
“Start simulation” links. No new navigation control was added.

## Identity and account-creation evidence

The successful staff Auth UUID was
`04118cf5-84ad-4690-b4f9-c1cd96073ecf`. All observed staff-page Auth user/token
responses retained that UUID, and owned-run checks matched it throughout.

During the staff browser journey:

- anonymous-signup requests: **0**;
- sign-out requests: **0**;
- password sign-in requests: **1**;
- total Auth-user/anonymous-user counts before and after gameplay: unchanged;
- group-session/membership counts: unchanged.

The staff run was `f683c04b-4b92-43a1-9ec3-3970b3d79548`; the supported replay
was `ca90269d-7e54-42c7-9d99-9993860e7ca3`, both owned by the same staff UUID.

The separate anonymous regression intentionally created exactly **one** anonymous
identity (`20cc8115-e727-441a-81a3-213c0115ea69`). Its refresh retained its own run
and identity. It did not change the still-open staff context's identity.

## Preservation and artifacts

After browser contexts closed, scoped cleanup signed out/deleted only the
test-created accounts and their records. All 27 application-table and Auth-user
fingerprints matched the pre-test snapshot, including the original 130 Auth
users, 145 playthroughs, 90 responses and 224 bill occurrences. Function, policy,
execution-ACL and trigger fingerprints also matched. No test runs or accounts
remain. The private fixture credential/token file was deleted after cleanup.

Successful evidence:

- `/tmp/team6310-stage4-browser-results-6/staff-individual-staff-bro-ecf32-replay-anonymous-regression/verification.json`
- `staff-gameplay-restored.png`, `staff-dashboard-return.png` and
  `staff-completed.png` in that same directory;
- `/tmp/team6310-stage3-api-9lp36333/browser-cleanup.json` for cleanup/preservation.

Earlier attempts exposed test-harness assumptions: an exact password label that
omitted “(required),” an obsolete run-ID DOM selector, reading scenario controls
before loading finished, an old CAC-preparation button label, and an overly
specific group-denial message expectation. The harness was corrected to match
the current UI and wait for actual controls. No application defect or weakened
security check was involved. Every attempt used scoped fixture cleanup; the
final complete browser test passed in 34.4 seconds (36.8 seconds including runner
overhead). No executed case remains failing.

## Other checks and limitations

Using Node.js 24.22.1, frontend formatting, lint, typecheck, all unit tests
(458 passed, two skipped) and production build passed. Python fixture compilation
and whitespace checks passed. These are local results, not CI/deployment results.

This stage verifies desktop Chromium. Other browsers, mobile layouts and the
group join form were not separately browser-tested here. The anonymous browser
regression covers creation/restoration/employment/termination, while its full
30-day Auth/API lifecycle passed in Stage 3. No hosted deployment was attempted.

Reproduction:

```bash
cd frontend
LOCAL_CHROMIUM_PATH=/usr/bin/chromium npx playwright test --config playwright.local.config.ts staff-individual.spec.ts --output /tmp/team6310-stage4-browser-results
```

Use Node.js 24 and the running local verification stack. The runner starts its
own local Vite server and creates/cleans its own test identities. Docker and
browser socket permissions may require execution approval in restricted agents.
