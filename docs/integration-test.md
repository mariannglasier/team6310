# Temporary owned-row integration test

This is development-only infrastructure, separate from the simulation model.
The route is available only in Vite development mode, with no navigation link.
Removing the page, service, tests, and route removes the frontend diagnostic.
Removing a migration file does not remove a previously deployed table.

## Apply manually

No migration has been applied by this task. In the **intended hosted development
project**, verify the project identity matches the frontend environment, then open
Supabase Dashboard → SQL Editor. Review and run the complete contents of:

`supabase/migrations/20261025000000_integration_test.sql`

Run it once, not against production. It creates `public.integration_test`, with a
database-generated UUID, an Auth user foreign key, a required nonblank message,
and database-generated timestamp. Only `authenticated` has insert permissions on
`owner_id`/`message` and select permission. RLS requires both the caller's
`auth.uid()` as owner and a signed `is_anonymous` claim. There are no update/delete
grants or policies and no public/anon grants. Authenticated permanent users also
fail these policies. Dashboard SQL execution does not automatically record CLI
migration history; reconcile that separately before adopting CLI deployment.

## Website check

1. Use Node 24 and run `npm run dev` from `frontend/` with the existing development
   `.env.local`. Open the printed Vite URL plus `/dev/integration-test` (normally
   `http://localhost:5173/dev/integration-test`). Production/preview builds omit it.
2. Select **Prepare participant session**. This reuses the existing anonymous Auth
   mechanism, without altering administrator sessions. Hosted anonymous sign-in
   must be enabled; preserve any CAPTCHA requirements. No CAPTCHA integration is
   added here. An already valid anonymous session can be reused.
3. Enter a fictional unique marker and select **Insert test row**. Success is
   displayed only after the insert returns its row ID. If the response is lost,
   check Table Editor before retrying; this temporary insert is not idempotent.
4. In Dashboard → Table Editor → `integration_test`, find that ID/marker. Confirm
   `owner_id` matches the anonymous user in Auth → Users and `created_at` is set.
   Dashboard administrative reads do not demonstrate participant RLS enforcement.

## Direct RLS checks from the local browser

Prepare two anonymous participants in separate browser profiles A and B. Insert
one marker each. Keep their user/row IDs locally; do not share tokens or sessions.
In profile A's developer console, import the existing client:

```js
const { supabase } = await import('/src/lib/supabaseClient.ts')
```

Attempt a forged owner using **B's actual Auth UUID**, replacing the placeholder:

```js
const forged = await supabase.from('integration_test').insert({
  owner_id: 'REPLACE_WITH_PARTICIPANT_B_AUTH_UUID',
  message: 'ownership denial test',
});
({ rejected: !!forged.error, code: forged.error?.code, status: forged.status })
```

Expect an RLS error (normally HTTP 403 / SQLSTATE `42501`), and no new marker row
in Table Editor. Use a real B UUID so a foreign-key failure is not mistaken for
an ownership-policy denial.

```js
const other = await supabase.from('integration_test').select('id')
  .eq('owner_id', 'REPLACE_WITH_PARTICIPANT_B_AUTH_UUID');
({ count: other.data?.length, failed: !!other.error })
```

Expect zero rows without an error; an unfiltered participant select should show
only A's rows. Attempts to update/delete B's known row must fail with permission
denied, since no update/delete grants exist. Also verify a request without an
Auth session is denied, using a separate fresh browser profile without preparing
a session. Do not sign out or replace the testing participant's session merely
to perform that check. Never use privileged credentials for these API checks.

Mocked frontend tests cover UI/service behavior only. Until these checks run
against the applied migration, neither live inserts nor RLS enforcement are
verified. No simulation data, financial calculations, or cleanup is implemented.
