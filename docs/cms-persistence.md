# CMS persistence (before UX expansion, November 17)

CMS workspaces, revisions and creation identities live in `cms_private.workspaces`;
source-to-draft record mappings in `cms_private.lineage`; save request receipts and
actor/input/result history in `cms_private.receipts`. Content lives in the normal
edition-scoped public tables, including scenarios and choices. Creation explicitly
copies a published edition atomically with new IDs and remapped relationships.

Fields change only in React memory while editing. Explicit Save calls a protected
RPC, checks active staff/draft status and expected workspace revision, commits the
content and receipt together, then reloads through `cms_read_draft`. Reopening a
saved workspace reads database records, not browser state. Unsaved edits are lost
on close/reload after the browser warning; workspace navigation requests discard
confirmation. Switching modes keeps the mounted workspace. There is no content
cookie or content localStorage persistence. Supabase Auth independently persists
its session using the existing client storage configuration.

Choice upfront_cost is an affordability threshold in individual submission: the
balance must cover it before the net balance_change is applied. It is not an
additional deduction. Either affordability failure ends the individual run.
requires_cac restricts individual choices to support-enabled runs and marks use
on commitment. Group progression does not apply equivalent guards. next_scenario_id
is preserved metadata, not followed by either progression system. response_text
is authored feedback retrieved for the committed choice, but currently not rendered in the normal ordinary-scenario panel. Choice ordering added by this expansion is
CMS presentation metadata only: gameplay currently sorts by choice_id.

## Implemented UX expansion

`20261117152243_cms_scenario_choices.sql` adds private CMS choice presentation order,
a staff-only bundle-save RPC and choices in the draft-read response. One Save
commits scenario fields, scheduling, choice insert/update/delete/order, workspace
revision and retry receipt atomically. Existing choice UUIDs are retained; new IDs
are server-generated. Destinations must remain in the draft. A failed validation
rolls back the entire save. The original public read policies and gameplay
functions are unchanged. Choice order is CMS-only, not a gameplay sequencing rule.

The dashboard now has a compact header and Viewer/Editor switch. Both modes retain
mounted context. Drafts appear as a list; the plus action opens a native creation
dialog. Explicit Save remains the only content persistence action. No hosted
changes, publication, timeline, bill or persona editor were introduced.

Verification: frontend format/lint/typecheck/build passed; 462 frontend tests
passed (two opt-in tests skipped). The original rollback-only CMS suite passed
staff/public/revoked checks and historical preservation. The new `cms-choices.sql`
suite passed create/edit/reorder/delete, retry, stale-save and atomic rollback
checks. Real local Chromium passed creation-dialog, scheduling, choice fields and
help, saved reload/reopening, mode switching and 390px overflow checks. Earlier
test failures exposed legacy next-destination defaults and hidden-mode locators;
these were corrected before the final passing runs. New migration was applied
only to the local verification database.

UI polish: choice move controls sit on the left and the shared transparent X
control sits on the right. Saved cards use the same DeleteControl at the top-right
and still require named confirmation. Save Changes and its status share the
editor's top-right action area. These changes do not alter persistence or deletion.
Verification: format/lint/typecheck/build, 463 frontend tests (two skipped), and
the local Chromium persistence/deletion/mobile/control-position journey passed.

Scenario management now also includes protected scenario deletion; see [the current roadmap](cms-roadmap.md) and [actual post-choice trace](cms-post-choice-flow.md). Timeline/node visualization is shelved.
