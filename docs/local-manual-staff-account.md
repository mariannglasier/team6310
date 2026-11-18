# Dedicated local manual-testing staff account

Provisioned November 14, 2026, in the existing local verification Supabase stack.
This account is deliberately retained for manual testing, unlike the temporary
accounts used by automated integration/browser tests.

- Email: `cac-admin@local.test`
- Auth UUID: `86c87640-70ed-4fd8-946b-bdb7c73d45f5`
- Credentials: `/tmp/team6310-local-manual-staff/credentials.json`
- Login route: `http://127.0.0.1:5173/admin/login` when the local app is running.

Read the password locally; it is not stored in repository files, documentation,
frontend code or tool output:

```bash
cat /tmp/team6310-local-manual-staff/credentials.json
```

The credential directory is mode `0700` and the file is mode `0600`. `/tmp` can
be cleared by the operating system, so retain the password in your own password
manager if needed. The script refuses to overwrite an account whose matching
credential record is missing; it does not reset placeholder users' passwords.

Use the existing local verification mode:

```bash
cd frontend
npm run dev -- --mode verification --host 127.0.0.1 --port 5173 --strictPort
```

## Provisioning and reuse

Run from the repository root:

```bash
python3 tools/provision_local_staff.py
```

The tool fixes its Docker socket, local container, API URL and dedicated email.
It requires local email/password signup and automatic email confirmation, both
already enabled in this development stack. It uses Supabase's supported Auth
signup/password API, not raw inserts into Auth credential tables. Trusted local
SQL creates the existing-schema `cac_staff` authorization record. It requires no
service-role key and changes no Auth settings or database definitions.

Reusing the tool authenticates the same dedicated identity and preserves its
password. It ensures that account's `cac_staff.active` is true, verifies
`is_cac_staff()`, and ends only its own verification session. It fingerprints all
other Auth users and staff rows to detect unrelated changes. It never accepts a
hosted URL, modifies other accounts, or creates another anonymous identity.

## Verified results

- A confirmed, non-anonymous email/password Auth account was created.
- Its corresponding `cac_staff` row is active, using the Auth UUID above.
- Password authentication succeeded; `is_cac_staff()` returned true.
- Chromium signed in through the actual employee login form against local Vite
  and local Supabase. The employee dashboard loaded without alerts.
- Refresh restored the dashboard with the same staff UUID.
- Repeated provisioning returned `created=false` with the same UUID and password;
  other Auth users and staff rows were unchanged.

Browser evidence is stored under `/tmp/team6310-local-manual-staff/` as
`browser-verification.json` and `dashboard-verified.png`, alongside the private
credential file. The verification browser used port 4175 and stopped its own Vite
server afterward. The account remains active for the user's normal local app.

No hosted users or staff records, existing placeholder accounts, migrations,
frontend source, gameplay rules, or authorization definitions were changed.
