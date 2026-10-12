# CAC Poverty Simulation — Security and Privacy

## Purpose and scope

This standing specification defines authentication, authorization, data handling, and security constraints for the CAC poverty simulation. Follow it together with [UI specification](./design/ui-spec.md), [User flows](./design/user-flows.md), and the project's architecture, data-model, and API specifications. These are implementation requirements, not claims that protections have already been implemented or tested.

Protect anonymous player runs, group sessions, staff credentials, content integrity, and application secrets. Players interact with fictional households; the application must not collect their actual household finances or treat their decisions as demographic facts.

## Authentication

### Anonymous players and hosts

Use Supabase anonymous authentication internally to bind runs and group ownership to a verified session. Players and hosts do not enter names, email addresses, passwords, or registration details. An internal anonymous Auth identity is a security mechanism, not a public player account or sign-in flow.

Anonymous Auth users have authenticated database sessions; being authenticated does not make them CAC staff. Policies must distinguish ownership, host membership, and staff authorization explicitly. A run ID, participant ID, or group join code alone is never sufficient authorization.

Persist the session using the supported Auth client so refreshing in the same browser restores the player's owned run and group membership. Do not place tokens in URLs, public links, analytics, logs, or exports. Clearing browser storage can remove anonymous access; do not offer recovery through an unverified run identifier. Protect session creation against automated abuse using supported CAPTCHA and rate limiting.

### CAC employees

Staff sign in through Supabase Auth with their work email and password. Provision staff access through a trusted administrative process; public registration and a matching email domain must not confer staff privileges.

Use a protected staff authorization record or server-controlled claim. Users must not be able to grant themselves privileges through editable profile metadata, client state, or request parameters. Staff-role assignment is separate from content editing and is unavailable to anonymous users.

Supabase Auth manages password storage and verification. Never store passwords in application tables or logs. Sign-out clears local staff credentials and returns the interface to public access. Every protected request must validate the current session and authorization. Revoking staff access must prevent subsequent protected operations even if an existing token remains valid.

## Authorization matrix

| Actor | Allowed | Denied |
| --- | --- | --- |
| Public visitor | Read public saved simulation content and privacy-safe aggregates | Read private runs, staff records, drafts, or session credentials; change content |
| Anonymous player | Create owned runs; read owned state; submit valid decisions through protected operations | Access another player's raw run; directly set balances, completion flags, or content versions |
| Group participant | Join an active group through a validated code; access own household/run and permitted group aggregates | Advance other participants, end the group, inspect others' raw histories |
| Group host | Create owned sessions, view participant progress, advance session members individually, end owned sessions, view group comparisons | Control another host's session, change participant answers, edit simulation content |
| Authorized CAC staff | Read/edit statistics and questions; inspect content status and audit records | Unrestricted access to player identities, credentials, or raw runs merely because they can edit content |

A person may have multiple capabilities, but each operation must check the appropriate one. Apply access checks to API calls, database operations, and realtime subscriptions, not only to visible buttons.

## Database and server boundaries

Enable Row Level Security (RLS) on every table exposed through Supabase's Data API. Use minimal grants and operation-specific policies. A table without an applicable allow policy must remain inaccessible. Bind private records to verified Auth ownership, with group membership and host checks where needed.

Public content reads expose only saved player-visible versions and approved source/context fields. Staff authorization and authentication records remain protected. Historical content needed for an existing run must not expose staff-only drafts or credentials.

Use controlled server-side functions or database transactions for starting a run, committing decisions, advancing group participants, ending runs/sessions, and saving content. Validate the caller and affected records within each operation. If an operation uses an elevated key that bypasses RLS, it must independently enforce all applicable authorization checks.

For a decision submission, validate that the run belongs to the caller, is active, the question is current, the option belongs to that question/content version, and the option is permitted by the run's support setting. Calculate effects from trusted content rather than accepting client-supplied balances or costs. Commit response, finances, and progress atomically. Enforce one committed response per run/question so retries do not duplicate effects or aggregate counts.

After confirmation, clients cannot change household or support setting. Ended runs and ended group sessions reject further submissions. Host advancement cannot fabricate answers or override a participant's decision.

## Group session security

Generate nonsequential, difficult-to-guess join codes and validate them server-side. A join code permits participant enrollment in an active session; it does not confer host access or expose existing participants' data.

Bind host authority to the verified creator identity. Check membership before accessing session state and check host ownership before advancement or termination. Rate-limit code guessing, joining, and session creation. Closed sessions reject new gameplay operations. Realtime channels must enforce the same ownership/membership boundaries as ordinary reads.

Hosts see progress and authorized comparisons, not names, emails, access tokens, or other participants' unrestricted decision histories. Group comparisons remain within the session's authorized audience rather than becoming publicly queryable by join code.

## Data handling and privacy

Collect only data needed for gameplay and comparisons: anonymous owner/run identifiers, persona and support setting, content version, current day, balances/circumstances, decisions, timestamps, and group association. Staff email addresses are used for employee access, not attached to player response records.

Do not collect player names, contact information, precise location, actual income, real assistance eligibility, or free-text personal stories. Fictional personas and assistance options are educational content, not requests for real CAC services. Donations link to the approved destination; this application does not process payment-card details.

Describe player data accurately as anonymous to other users but linked internally to a session. Do not promise that infrastructure never processes IP addresses or operational identifiers. Display a brief privacy notice explaining saved progress, response aggregation, same-browser restoration, and group-host visibility.

Public visualizations return aggregate values only. Never return raw session identifiers, Auth IDs, tokens, timestamps, or complete individual histories as part of chart payloads. Suppress public filtered cohorts smaller than five eligible runs/responses; show Insufficient responses instead of exact counts/percentages. Apply this threshold consistently to filter combinations and derived views to reduce identification through subtraction. This restriction does not prevent a player viewing their own result or authorized session members viewing their group debrief.

Question aggregates may include submitted responses from early-ended runs. Ending-balance/support-use aggregates use completed runs as defined in the design files. Keep incompatible content versions separate. Replays create distinct runs and do not imply distinct people; label counts as runs or responses rather than unique individuals.

Raw data is not retained indefinitely. Retention and cleanup are centrally configured and enforced by maintenance tooling rather than hardcoded into UI components. Retain active state for supported recovery and historical content while referenced by retained runs. Cleanup must cover expired anonymous identities, orphaned group/run records, and unnecessary logs. Do not delete credentials/content still required by active runs. Restrict maintenance actions to trusted operators.

## Content integrity and auditing

Only authorized staff can save question/statistic changes. Validate required values, units, sources, geography, dates, option relationships, and financial fields. Preserve references to earlier content versions for existing runs. Newly started simulations use content saved before their start; active runs retain their initial version, including after refresh.

Record content changes with staff actor, affected record/version, action, and time. Do not log passwords or tokens. Content removal must preserve valid historical references and must not alter already committed player outcomes.

## Secrets, deployment, and browser security

The browser may contain the Supabase project URL and publishable key. Secret/service-role keys, database credentials, signing secrets, and deployment credentials remain server-side. Frontend build environment variables are bundled into public assets; they are not secret storage.

Keep secrets out of Git, Markdown, screenshots, example credentials, source maps, and logs. Use placeholder values in example environment files and platform secret configuration for real values. Separate development/test data from production. Rotate exposed secrets and revoke compromised staff access.

Use HTTPS. Restrict cross-origin access for application-owned endpoints to intended origins, while recognizing that origin checks are not authentication. Configure browser security headers, including an appropriate Content Security Policy, and avoid embedding untrusted scripts. Render content as text; sanitize any supported rich text and reject executable markup or unsafe source-link schemes. Use parameterized database operations. Do not cache protected staff or player responses in shared public caches.

Rate-limit high-cost or write operations and constrain request sizes. Return readable errors without internal SQL, stack traces, credentials, or another user's data. Log operational event categories and necessary identifiers with restricted access; avoid complete request/session dumps.

## Required verification

Verify allow/deny behavior directly through the API/database, beyond UI checks:

- A visitor or anonymous user cannot edit content or grant staff permissions.
- Player A cannot read/change Player B's run using known identifiers.
- Participants cannot invoke host controls; Host A cannot control Host B's session.
- Duplicate, stale, disallowed-support, and ended-run submissions are rejected or safely return the existing committed result.
- Refresh restores state without repeating financial effects or counts.
- Staff revocation and sign-out prevent subsequent protected access.
- Saved edits apply to new runs while existing runs retain their content version.
- Public chart responses expose aggregates only and enforce small-cohort suppression.
- Production bundles/repository contain no privileged keys, credentials, or sample passwords.
- Malicious content and invalid links do not execute in the browser.

Add policy/integration checks when implementing these boundaries. This specification does not claim those checks have passed.

## Platform references

- [Supabase anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase CAPTCHA protection](https://supabase.com/docs/guides/auth/auth-captcha)
