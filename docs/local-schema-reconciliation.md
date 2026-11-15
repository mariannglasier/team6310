# Local schema reconciliation before staff gameplay verification

**Subsequent status, November 14:** Stage 1 has been applied locally and verified.
See the [Stage 1 local verification](staff-individual-stage1-local-verification.md).
Stage 3 has not started; the original pre-Stage-1 reconciliation record follows.

November 13, 2026. **Completed locally; Stage 1 is not applied and Stage 3 has
not resumed.** No database reset, existing-row deletion, ownership transfer, Auth
account creation, browser testing, or hosted write occurred.

## Source of drift

The local verification stack deliberately disables automatic migrations and
seeding. It had no `supabase_migrations.schema_migrations` ledger. Its schema was
installed through an older compatibility export and direct local installers:
`tools/reconstruct_local_schema.py`, `tools/install_scenario_submission.py`,
`tools/install_scenario_progression.py`, and `tools/install_bills_local.py`.
Those tools target the fixed local container and do not maintain a migration
ledger. The original export referenced by the reconstruction tool is no longer
present in this checkout.

Catalog evidence showed the employment/bills definitions and the later
pre-employment termination extension were already installed, but none of the
November 9 staff, recap, routing or group additions were present. The older
scenario function lacked the exact extensions supplied by the existing library
routing and synchronized-ending migrations. Shortened names on three foreign
keys and two policies were also present in the older compatibility schema, with
otherwise equivalent definitions.

This identifies the schema and installer gap; absent a ledger, it does not prove
the exact historical commands or their execution timestamps. Earlier migrations
were not blindly replayed or retroactively marked applied.

## Changes committed locally

The following **existing, unchanged** migration bodies were applied in filename
order, together in one outer transaction after rollback rehearsals:

1. `20261109000000_cac_staff_authorization.sql`
2. `20261109120000_staff_read_categories.sql`
3. `20261109151703_group_join_codes.sql`
4. `20261109181809_scenario_recap_facts.sql`
5. `20261109181822_library_routing.sql`
6. `20261109181824_event_recap_facts.sql`
7. `20261109183118_add_group_decision_duration.sql`
8. `20261109183456_guard_library_content.sql`
9. `20261109185716_group_session_state_and_participant_ids.sql`
10. `20261109191033_group_voting_rounds.sql`
11. `20261109192118_group_household_readiness.sql`
12. `20261109192414_synchronize_scenario_ending.sql`
13. `20261109194013_group_month_and_job_vote.sql`
14. `20261109200648_group_shared_household_employment.sql`
15. `20261109202343_allow_single_choice_group_days.sql`
16. `20261109202520_include_general_group_scenarios.sql`

The two staff content base tables, `cac_services` and `cac_service_facts`, have no
creation migration in the repository. The additional local-only
[compatibility SQL](../tools/local_sql/reviewed_staff_content.sql) creates them
empty using current read-only reviewed catalog definitions, including constraints,
RLS, policies and grants. It also corrects the five equivalent shortened names.
This is not a historical migration or hosted installer. No hosted content or
participant records were copied.

Three functions produced by the existing migrations differed from the reviewed
definitions only in whitespace: `is_cac_staff()`, `assert_cac_staff(uuid)`, and
`group_private.control_session(uuid,text)`. SQL token comparisons preserved quoted
strings and confirmed identical tokens. Their formatting was then aligned with
the reviewed current definitions, retaining ownership and ACLs. This satisfies
Stage 1's exact hash checks without weakening or removing the checks. The newer
scenario extensions and existing employment termination extension are intact.

## Verification

Read-only hosted catalog metadata supplied the comparison baseline; all mutations
used only Docker's `default` context and the fixed
`supabase_db_team6310-phase2-verification` container. No hosted mutation or
deployment was performed.

The committed catalog was compared by object identity, not array order:

| Objects                                                | Reviewed matches |
| ------------------------------------------------------ | ---------------- |
| Tables, owners and RLS flags                           | 27/27            |
| Columns, types, defaults and nullability               | 208/208          |
| Constraints                                            | 133/133          |
| RLS policies, roles and expressions                    | 22/22            |
| Trigger definitions and enabled states                 | 17/17            |
| Function definitions, owners and execution permissions | 48/48            |
| Index definitions                                      | 47/47            |

All application SELECT/DML grants match. Existing local grants omit 17 reviewed
`MAINTAIN` privileges: 15 for `service_role`, plus two for `anon`/`authenticated`
on `group_participants`. These maintenance privileges were intentionally not
added to older tables. They are not required by Stage 1 or gameplay. No other
table-grant differences remain.

The existing anonymous-only, authenticated-callable local fixture helper
`open_local_day4_run()` remains unchanged as a documented extra function. It is
not part of the application or the Stage 1 admission path.

Before/after counts and fingerprints compared every original column value in all
16 pre-existing application tables and `auth.users`. All matched, including:

- 130 Auth users;
- 145 playthroughs;
- 90 responses;
- 224 bill occurrences;
- 25 choices and the remaining existing content/expense records.

New columns have the existing migrations' defaults. There were no group sessions,
memberships or group-linked runs, so the migrations' group conversion updates
affected zero rows. Existing individual owner IDs and financial state were not
changed. Assertions ran before commit and were checked again afterward.

A private schema backup, source SHA256 receipt, transaction SQL and catalog
comparison are retained under `/tmp/team6310-local-reconciled-9tiauznb/`.
No fake historical ledger was introduced. The repository migration files were
not changed by reconciliation.

## Readiness and stopping point

All Stage 1 target function hashes and staff authorization prerequisites match
the reviewed baseline. The individual ownership policies are still the original
pre-Stage-1 policies. `is_individual_player()` is absent.

**The local database is ready for the Stage 1 migration.** It has not been applied.
Genuine Auth/API gameplay testing remains pending. Existing local simulation
content is preserved, rather than replaced with the hosted content library;
Stage 3 may require scoped synthetic test content, especially for a full group
journey. No gameplay/API test or browser test was substituted for this catalog
verification.
