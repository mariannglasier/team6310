# CAC Poverty Exercise

An educational poverty simulation for the Community Assistance Center
in Sandy Springs, Georgia.

## Technology Stack

- Frontend: React + TypeScript, built with Vite
- Backend and database: Supabase / PostgreSQL
- Group updates: Supabase Realtime
- Planned hosting: Cloudflare Pages

## Current Development Status

The frontend starter and verification tooling are configured.
Supabase connection, database migrations, and seed data are being
configured separately. Game features are still under development.

## Prerequisites

- Git
- Node.js 24.x and npm

## Install

Clone the repository:

```bash
git clone https://github.com/mariannglasier/team6310.git
cd team6310/frontend
npm ci
```

## Run Locally

From the frontend directory:

```bash
npm run dev
```

Open the local URL printed in the terminal.
Press Ctrl+C to stop the development server.

## Verify Changes

Run these commands from the frontend directory:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

All commands must succeed before submitting a change.

Additional development commands:

```bash
# Apply formatting
npm run format

# Run tests continuously while developing
npm run test:watch
```

The current test checks the starter counter interaction.
Game-specific tests will be added as features are implemented.

## Continuous Integration

The Frontend CI GitHub Actions workflow runs formatting checks,
linting, TypeScript checks, tests, and a production build on pushes
and pull requests.

View results in the repository's Actions tab.

## Database and Environment Setup

Supabase setup is owned by the database integration teammate.

This section must be updated with:
- Required environment variables and an .env.example
- Local or hosted development database instructions
- Migration and seed-data commands
- Instructions for verifying the connection

Do not commit local environment files or privileged credentials.

## Repository Structure

- frontend/: React application and frontend tooling
- docs/: Architecture, data model, and external data documentation
- AGENTS.md: Instructions for development agents
- .github/workflows/ci.yml: Automated frontend checks

## Project Documentation

- [Architecture](docs/architecture.md)
- [Data Model](docs/data_model.md)
- [External Data Sources](docs/apis.md)

## Windows PowerShell

If PowerShell blocks npm.ps1, use npm.cmd instead of npm.
For example:

```powershell
npm.cmd ci
npm.cmd run dev
```