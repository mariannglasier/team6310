# Admin panel — open items and follow-ups

Status as of November 9, 2026. This lists what is **not** done or **not verified** for the staff admin panel. It is a working note, not a specification; approved decisions belong in [security](security.md), [architecture](architecture.md), [data model](data-model.md), and the [UI spec](../design/ui-spec.md).

## What exists today

- `/admin/login` signs staff in with Supabase Auth (work email and password) and checks `public.is_cac_staff()`. `/admin/dashboard` opens only for verified staff.
- The dashboard is a **read-only** viewer of stored content: scenarios (with choices and CAC support effects), personas (with scheduled expenses), jobs, statistics and scenario links, and CAC service facts, scoped by edition.
- The sign-in was confirmed working by the team in the browser against the hosted project. Automated tests mock Supabase; none of them signs in against a real project.

## Security and authentication

- [ ] **Verify hosted Auth settings.** Not readable from the tools used so far. Check in the Supabase dashboard: email provider enabled, whether open signup is allowed, rate limits (anonymous sign-ins are limited per IP, which a workshop on one network could hit), password minimum length (local `config.toml` says 6), leaked-password protection, and optional MFA for staff.
- [ ] **CAPTCHA.** `docs/security.md` requires it for anonymous sessions. The frontend does not send a CAPTCHA token yet, so enabling it on the hosted project would break staff sign-in and anonymous play. Add frontend support first, then enable it.
- [ ] **Decide whether open signup should be disabled.** Sign-up cannot create staff (only a `cac_staff` row does), but it can create junk accounts. Confirm that turning signup off does not also block anonymous sign-ins before changing it.
- [ ] **Staff and player sessions share one browser slot.** Signing in as staff replaces an anonymous player session, which cannot be recovered. A staff session also blocks starting a run in that browser. Options: a separate Supabase client with its own storage key for staff, or documented use of a separate browser profile.
- [ ] **Staff revocation timing.** Revoking a staff member (`active = false`) is enforced by the database on every protected request. The dashboard itself only re-checks on load, so an already-open dashboard can stay visible until refresh. Consider a periodic or on-focus re-check.
- [ ] **No staff provisioning interface.** Staff are added by hand (create the Auth user, then insert into `public.cac_staff`; see [security](security.md)). There is no audit trail of who was granted or revoked access.
- [ ] **No staff roles.** There is a single `active` flag. `docs/security.md` says staff-role assignment is separate from content editing, so a role model is needed before editing exists.
- [ ] **Password reset and invitations.** Not built. Hosted site URL and redirect URL settings will matter when they are.
- [ ] **Tighten `public.categories` grants.** `anon` and `authenticated` hold write privileges on the table. RLS has no write policy, so they are blocked today, but revoke the grants so a future permissive policy cannot expose writes.
- [ ] **API-level access tests are not in the repo.** Allow/deny checks (public key, non-staff user, staff, revoked staff) were run as ad-hoc SQL and curl calls. Add repeatable tests under `supabase/tests` that cover the staff-only reads and the denied cases.

## Database and migrations

- [ ] **Migration history has drifted.** The hosted project lists migrations that are not in `supabase/migrations/` (for example the November 5 to 8 outcome-import and bill-schedule migrations), and the repo has files the hosted history does not list (for example `20261025000000_integration_test.sql` and `20261103000000_employment_gameplay.sql`). `cac_staff` and its functions were also created outside recorded migrations. The two staff migrations added in the repo are idempotent mirrors, and `staff_read_categories` was applied to the hosted project under a different version number than its repo file. Reconcile before relying on `supabase db push` or a fresh local rebuild.
- [ ] **Staff cannot see unpublished drafts.** Existing read policies expose only published editions (and only approved, active jobs). Draft and pending content needs staff-only read policies when draft editing is built.
- [ ] **`scenario_statistics` keys.** Its primary key is `scenario_id` alone, which allows one linked statistic per scenario, while the specification calls for one general fact and one CAC fact per scenario edition. Confirm the intended schema with the team.
- [ ] **CAC service facts are not edition-scoped.** The services and facts tables carry no edition, but the specification describes a CAC fact per scenario edition. The dashboard labels them as shared across editions; confirm that is the intended model.
- [ ] **Unclear field meanings.** `scenarios.persona_intent` is shown as "Persona" for 185 of 198 scenarios, and 193 scenarios have no default day. Confirm what these mean so the labels are accurate.

## Features not built yet

- [ ] **Editing, drafts, validation, approval, and publishing.** None exists. The spec calls for validated edits saved as pending drafts, success shown only after persistence, immutable published editions, and active runs keeping their starting `version_id`.
- [ ] **Audit records** of staff actions (actor, record or version, action, time).
- [ ] **Monthly source-check staging** and review of refreshed values (see [API](api.md)).
- [ ] **Scenario generation requests** (administrator-triggered, at most three model attempts).
- [ ] **UI spec mismatch.** `design/ui-spec.md` section 11 describes Statistics and Scenario Questions tabs with category and coverage metadata, content locations, edition status, and last-updated information. The built dashboard uses Scenarios, Personas, Jobs, Statistics, and CAC Service Facts tabs and lacks coverage metadata, display locations, last-updated information, and "related questions" on statistics. Decide which design wins and update the specification.
- [ ] **Statistics are empty.** The `statistics` and `scenario_statistics` tables have no rows, so those tabs show only empty states. Their populated layout has been tested only with sample data in unit tests.
- [ ] **CAC support effects are empty.** `cac_support_effects` has no rows, so that part of the scenario detail has not been seen with real data.
- [ ] **Unapproved jobs are hidden** by the current policy; staff cannot review them.

## Dashboard quality

- [ ] **No visual or browser review yet.** The layout, narrow-screen behavior, colour contrast, focus rings (especially on the blue banner), and a keyboard and screen-reader pass have not been checked in a browser. Check each tab on a phone-width window.
- [ ] **No end-to-end test of the admin flow.** Playwright coverage would need a test staff account and a way to keep its credentials out of Git and logs.
- [ ] **Everything loads at once.** All twelve tables are fetched on open (roughly 1,000 rows). That is fine today but will not scale. Load per tab, search on the server, and consider virtualizing the scenario list (185 non-scheduled scenarios in the newest edition).
- [ ] **Tab, filter, and edition choices are not in the URL**, so there are no deep links and the browser Back button does not restore them.
- [ ] **Raw scenario codes** such as `D005_tax_return` appear as titles. Decide whether staff see display names, codes, or both.
- [ ] **Refresh reloads everything** and shows no "last updated" time.

## Process and environment

- [ ] **Flaky existing test.** `SimulationPages.test.tsx` ("keeps Continue disabled until a household is chosen…") failed once during development and then passed on repeated runs, with and without the admin changes. Investigate separately.
- [ ] **Node version.** The default shell Node is v17. The repo needs Node 24; lint and tests fail on older versions with unrelated-looking errors (`util.styleText`).
- [ ] **Data-model documentation** does not yet describe `cac_staff`, `is_cac_staff()`, or the staff read policies.
