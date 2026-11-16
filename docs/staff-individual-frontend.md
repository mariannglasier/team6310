# Staff individual gameplay: Stage 2

November 13, 2026. Frontend implementation against the prepared
[Stage 1 database contract](staff-individual-authorization.md). No migration,
hosted definition, staff authentication, group service, or shared client changes
are part of this stage.

`services/individualSession.ts` separates individual eligibility from the strict
anonymous participant service used by groups:

- `individualPlayerId()` verifies the current user through Auth. Anonymous users
  qualify directly; other authenticated users must receive literal `true` from
  `is_cac_staff()`. Eligibility is not cached across calls.
- `ensureIndividualSession()` shares preparation already in flight. It checks the
  current SDK session and invokes the existing anonymous participant service only
  when none exists. That service rechecks the session before creation. Existing
  identities are never deliberately replaced or signed out.
- Restoration calls only `individualPlayerId()`. Missing/invalid identities and
  staff authorization failures produce errors without creating accounts or runs.

Creation, owned-run loading, employment identity/locator operations and ordinary
scenario restoration use the individual helper. Bills inherit the individual
identity check through the existing employment helper. Server-side authorization
remains authoritative for every protected request; a staff revocation between a
frontend check and an RPC must still be rejected by Stage 1.

Owner comparisons, locator/pending-request key formats, retry and reconciliation
behavior, financial parsing and edition validation are preserved. Neither service
adds an automatic creation retry. Group gameplay continues using the unchanged
`ensureParticipantSession()` and remains anonymous-only. Development preview and
integration-test restrictions remain unchanged.

## Verification and integration boundary

Frontend tests mock Supabase responses. Focused tests exercise the real identity
service together with creation, restoration, employment locators/actions,
scenario submissions/restoration, unchanged staff session restoration and strict
group admission. They cover anonymous/staff success, literal staff authorization,
revocation, failed verification/network requests, absent identities, concurrent
preparation, owner validation and absence of automatic sign-out/replacement.
Existing component and service regression suites also run.

Completed checks using Node.js 24.22.1: `npm run format:check`, `npm run lint`,
`npm run typecheck`, `npm test` (458 passed, two skipped; 47 files passed and one
skipped), and `npm run build`. All passed. These are local check results, not CI
or deployment results.

The local Supabase database port was unavailable. Genuine Supabase Auth/API and
browser journeys against the database are not established by these frontend
tests. Stage 1 must be applied to the target database before staff gameplay can
work there; that deployment has not been performed by this stage. Full-stack
verification must include same-identity dashboard return, termination, completion,
replay, bills and revocation with real tokens. Stage 3 has not been started.
