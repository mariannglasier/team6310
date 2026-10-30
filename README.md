## Development Environment Setup

### Frontend foundation status

React Router connects the responsive landing page and clearly labeled feature placeholders. The landing page links Start simulation, Join a group, and Host a group to existing routes; Learn/Donate use team-approved CAC websites. Explore Data reserves `/data`, which currently reaches the fallback page. Simulation, internal CAC information, and staff features remain scaffolding. Run `npm ci` in `frontend/` after pulling dependency changes.

| Route | Placeholder |
| --- | --- |
| `/` | Responsive landing page with team-supplied copy |
| `/learn` | CAC information; approved content/destination pending |
| `/donate` | Donation; approved external destination pending |
| `/simulation/introduction` | Legacy URL redirects to `/simulation/individual` |
| `/simulation/individual` | Persona (household) selection, the first setup step; reads approved households from the published edition (read-only, no run is created). Job selection happens later on Day 1 |
| `/simulation/review` | Review household; confirm to create an individual playthrough using the existing RPC |
| `/simulation` | Loads the created playthrough and pinned-edition household; displays saved balance, day, and status; no gameplay |
| `/simulation/results` | Results/summary |
| `/group/host`, `/group/join` | Host and participant entry |
| `/admin/login` | Employee sign-in; no credential collection yet |
| `/admin/dashboard` | Reserved dashboard; redirects to sign-in |
| Any unmatched path | Page-not-found fallback |

The administrative route boundary denies all dashboard entry until trusted Supabase authentication and separately verified staff authorization are integrated. It is only a UI structure and does not establish backend access control. No protected application data is loaded. The individual placeholder can explicitly establish an anonymous participant Auth session; this creates no simulation run or application row. See the frontend guide for local and hosted Auth prerequisites.

Current frontend structure:

```text
frontend/src/
  app/          Route definitions, shared paths, closed admin boundary
  components/   Shared page wrapper and ui/ components
  hooks/        Explicit restoration and temporary choice selection
  layouts/      Shared navigation, content area, and footer
  pages/
    public/     Landing, information, donation, and fallback placeholders
    individual/ Individual simulation and results placeholders
    group/      Host and participant placeholders
    admin/      Sign-in and reserved dashboard placeholders
  assets/       Local assets
  lib/          Existing Supabase client
  services/     Lazy Supabase access and unconnected simulation contract
  state/        UI selection and service-snapshot reducer
  types/        Initial frontend domain/read models
  test/         Test setup
```

Shared UI components include buttons/router links, forms, text/textarea/select fields, radio cards, navigation, page sections, a controlled native dialog, and four-step setup progress. Roboto 400/500/700 is bundled locally. The exported prototype in `design/figma-prototype/` supplies basic layout references only; repository specifications define behavior and tokens.

The landing page adapts the exported hero/three-card layout with team-supplied copy and repository tokens. It uses the CAC logo and supplied food-pantry photo locally, plus house, receipt, and bar-chart card icons. Text is in `frontend/src/pages/public/landingContent.ts`; approved external destinations are in `frontend/src/app/externalLinks.ts`. No other pages were created for the landing story. Run `npm run test:e2e` in `frontend/` for Chrome checks at desktop, tablet, mobile, and 320px widths. See the frontend guide for browser setup and screenshots.

See [Frontend component and architecture guide](frontend/README.md) for usage, extension boundaries, and remaining verification. Frontend read models are not finalized database rows. Simulation service methods deliberately reject calls until protected backend operations are integrated; no local-storage simulation or financial engine was copied from the prototype.

Routing uses browser history. The deployment must serve the SPA entry document for application deep links; confirm that behavior on Cloudflare Pages before claiming deployed refresh support. Local route tests use a memory router. Public pages do not require Supabase credentials. Explicit participant session preparation on the individual placeholder requires the environment values below; it reuses the lazy centralized client.

### Prerequisites

Before running the project, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (version 24.x)
- npm (included with Node.js)
- [Git](https://git-scm.com/downloads)

### 1. Clone the Repository

Clone the repository to your local machine:

```bash
git clone https://github.com/mariannglasier/team6310.git
```

Navigate to the project directory:

```bash
cd team6310
```

### 2. Install Dependencies

Navigate to the frontend directory containing `package.json`:

```bash
cd frontend
```

Install the required dependencies:

```bash
npm ci
```

### 3. Configure Environment Variables

This project uses Supabase for backend services. Before running the application, configure your local environment variables.

1. In the `frontend` directory, locate the `.env.example` file.
2. Create a copy of `.env.example` and rename it to `.env.local`.
3. Open `.env.local` and replace the placeholder values with your Supabase project credentials.
4. Save the file before starting the development server.

The environment variables should follow the structure provided in `.env.example`.

**Note:** Contact a team member if you need access to the Supabase project credentials. Do not commit `.env.local` to GitHub, as it contains environment-specific configuration. Ensure `.env.local` is included in `.gitignore`.

### 4. Start the Development Server

Once the dependencies and environment variables are configured, run:

```bash
npm run dev
```

Open the local URL displayed in the terminal (typically `http://localhost:5173/`) to view the application.

The development server supports hot module replacement, allowing changes to appear automatically in the browser.

### 4. Run Tests and Code Quality Checks

The following commands are available:

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run tests using Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Check code for ESLint issues |
| `npm run typecheck` | Check TypeScript types |
| `npm run format` | Format code using Prettier |
| `npm run format:check` | Check code formatting without modifying files |

### 5. Stop the Development Server

Press `Ctrl + C` in the terminal to stop the server.

### Troubleshooting

**Missing dependencies:** Run `npm install` again from the frontend directory.

**Port already in use:** Vite may automatically select another available port. Check the terminal for the correct URL.

**PowerShell execution policy error (Windows):** If PowerShell blocks npm commands, use `npm.cmd install` and `npm.cmd run dev`, or run the commands in Command Prompt.

## BLS wage synchronization

`integrations/bls_oews/` keeps the eight CAC jobs' wages current from the U.S. Bureau of Labor Statistics Occupational Employment and Wage Statistics (OEWS). It updates draft `public.jobs` rows only. It never approves, activates, or publishes content, and it never touches personas, playthroughs, balances, or CAC-authored job fields. Design details: [docs/api.md](docs/api.md#implemented-job-wage-integration-draft-content-only).

### Where the data comes from and how jobs map

- Measure: median hourly wage, Atlanta-Sandy Springs-Roswell, GA metro (`12060`), cross-industry, latest annual OEWS release (reference month May). Official source: <https://www.bls.gov/oes/tables.htm>; reference profile: <https://data.bls.gov/oesprofile/>.
- Automated path: the BLS Public Data API (the OEWS files on `bls.gov` reject scripted downloads with HTTP 403). The latest published year is detected at run time, not hardcoded.
- Fallback: download the official OEWS metropolitan `.xlsx` (for example `MSA_M2025_dl.xlsx`) in a browser and pass `--file`.
- Mapping (matched to `public.jobs` by `soc_code` and `version_id`): 35-3023 Fast Food Worker; 41-2011 Cashier; 41-2031 Retail Sales Associate; 53-7065 Warehouse Stocker; 37-2011 Janitor / Cleaner; 31-1120 Home Health / Personal Care Aide; 43-4051 Customer Service Representative; 43-9061 General Office Clerk. Edit `integrations/bls_oews/config.py` only with team approval.
- Written fields: `median_hourly_wage`, `wage_year`, `wage_source_url` (the specific BLS series), `last_synced_at`. `weekly_gross_income` is computed by PostgreSQL from the wage and CAC-set `hours_per_week`. Unchanged rows are not rewritten, so repeated runs change nothing.

### Run locally

Requires Python 3.11+. From the repository root:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r integrations/bls_oews/requirements.txt
python -m pytest integrations/bls_oews/tests -q

# Fetch and validate only; nothing is written. Works without Supabase credentials
# (database comparison is then skipped).
python -m integrations.bls_oews.bls_oews_sync --dry-run

# Compare against the database (still read-only) once credentials are set:
python -m integrations.bls_oews.bls_oews_sync --dry-run

# Live write to the latest draft version:
python -m integrations.bls_oews.bls_oews_sync

# Use a manually downloaded official file instead of the API:
python -m integrations.bls_oews.bls_oews_sync --dry-run --file ~/Downloads/MSA_M2025_dl.xlsx
```

Options: `--version-id <uuid>` targets a specific content version; `--year` is required if the file name has no `M20YY`; `--source-url` sets provenance for `--file` runs. Exit codes: `0` success, `1` some wages were missing or invalid (others may still be updated), `2` missing configuration, `3` source/database error or protected-content violation.

### Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | Live runs and database dry-runs | Project URL (`https://<ref>.supabase.co`). |
| `SUPABASE_SERVICE_ROLE_KEY` | Live runs and database dry-runs | Privileged server-side key. Never put it in `frontend/`, any `VITE_*` variable, Git, docs, or logs. |
| `BLS_API_KEY` | Optional | Free BLS registration key; raises API limits. |

For local runs, export them in your shell or keep them in an untracked file (for example `integrations/bls_oews/.env`, which `.gitignore` excludes) and load it with `set -a; source integrations/bls_oews/.env; set +a`. Use placeholders only in committed files.

### Scheduled workflow

`.github/workflows/bls_oews_sync.yml` runs at midnight `America/New_York` on the first day of each month (two UTC crons plus a local-time guard cover daylight saving) and on demand via **Actions > BLS OEWS wage sync > Run workflow** (defaults to dry run). It runs the importer tests, verifies that the secrets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` exist (failing visibly if not; optional `BLS_API_KEY`), then runs the sync and writes a change/error summary to the run page. If the latest content version is draft, its wages are updated in place. Content Version 1 is now published, so the next run that finds changed wages creates a new draft version (version 2) rather than editing it. If the latest version is published, a new draft version containing copies of the eight jobs is created (once; later runs reuse it), and the published version is untouched. A run fails when any occupation lacks a valid Atlanta median wage.

### CAC administrator review and approval

1. Open the workflow run summary and review the before/after wages and any errors or warnings.
2. In Supabase, inspect the draft version's jobs and compare `wage_source_url` and `wage_year` with the BLS profile for Atlanta.
3. Confirm `hours_per_week` and requirements, then set `reviewed_at`, `is_approved`, and (when ready for play) `is_active`. These are manual staff actions; the importer never sets them. A new draft's jobs start unapproved and inactive.
4. Publishing a content version is a separate staff decision. Active and completed playthroughs stay pinned to their starting `version_id`.

### Troubleshooting

- `CONFIGURATION ERROR: Missing required environment variable(s)`: set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or GitHub Actions secrets).
- `BLS API did not succeed` / `REQUEST_NOT_PROCESSED`: daily API limit or outage. Retry later, set `BLS_API_KEY`, or use `--file`.
- HTTP 403 from `bls.gov`: expected for scripts; download the file in a browser and use `--file`.
- `no valid <year> median hourly wage published` / suppressed (`*`, `#`): BLS did not publish a usable value for that occupation and area. The stored wage is left unchanged; ask CAC whether to choose another occupation.
- `hourly median ... disagrees with annual median`: ambiguous source data was rejected; verify against the OEWS profile before proceeding.
- `release ... is older than stored wage_year`: a stale release was ignored.
- `published content is immutable`: the target version is published; omit `--version-id` or target a draft.
- `no job row in version`: the importer never inserts jobs into an existing version; ask staff to add the missing CAC job row.
