#Terminal commands

### Startup

```
nvm use 24
python3 tools/local_supabase.py start
python3 tools/local_supabase.py status
python3 tools/local_supabase.py frontend-env
cd frontend
npm run dev -- --mode verification --host 127.0.0.1 --port 5173 --strictPort
```


### Teardown

```
cd ..
python3 tools/local_supabase.py stop
```

# Local Port Locations

### Vite Website:

> http://127.0.0.1:5173

### Local Supabase Interface

> http://127.0.0.1:55323

### Extra Local Supabase info

Seems important but you probably dont need it

- Volume: supabase_db_team6310-phase2-verification
- Inside the container: /var/lib/postgresql/data
- Studio: http://127.0.0.1:55323
- API: http://127.0.0.1:55321
- PostgreSQL database address: 127.0.0.1:55322

## Local categories/scenarios compatibility update

On November 6, 2026, the existing verification database received the one-time
local-only update in `tools/local_sql/scenario_compatibility.sql`. This is not a
repository migration or a hosted installer. Do not reapply it: it deliberately
fails if `categories` already exists.

The update reproduces inspected hosted definitions: `categories` (four columns,
primary key, postgres ownership, RLS enabled, no policies), nullable
`scenarios.persona_intent`, and the three scenario foreign keys to category,
persona, and content version with RESTRICT update/delete actions. Existing
scenario published-content SELECT policy is unchanged. Category table grants
match hosted; there is no category SELECT policy, so participant roles cannot
see category rows through RLS.

Verification passed for columns/defaults/nullability, validated constraints,
indexes, table RLS/ownership, policy definitions, participant-role SELECT queries,
and local publishable-key PostgREST reads (HTTP 200). Scenarios/choices remain
empty; no fixtures were loaded. Published-row visibility still needs a later
fixture test. Checksums confirmed unchanged playthrough data, employment function
definitions, personas, jobs, versions, responses, scenarios, and choices.

Column order differs: the new `persona_intent` is appended after `schedule_type`.
Named-column queries are compatible; no tables were rebuilt to reorder columns.
