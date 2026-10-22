## Development Environment Setup

### Frontend foundation status

React Router connects the responsive landing page and clearly labeled feature placeholders. The landing page links Start simulation, Join a group, and Host a group to existing routes; Learn/Donate use team-approved CAC websites. Explore Data reserves `/data`, which currently reaches the fallback page. Simulation, internal CAC information, and staff features remain scaffolding. Run `npm ci` in `frontend/` after pulling dependency changes.

| Route | Placeholder |
| --- | --- |
| `/` | Responsive landing page with team-supplied copy |
| `/learn` | CAC information; approved content/destination pending |
| `/donate` | Donation; approved external destination pending |
| `/simulation/introduction` | Legacy URL redirects to `/simulation/individual` |
| `/simulation/individual` | Individual setup/gameplay |
| `/simulation/results` | Results/summary |
| `/group/host`, `/group/join` | Host and participant entry |
| `/admin/login` | Employee sign-in; no credential collection yet |
| `/admin/dashboard` | Reserved dashboard; redirects to sign-in |
| Any unmatched path | Page-not-found fallback |

The administrative route boundary denies all dashboard entry until trusted Supabase authentication and separately verified staff authorization are integrated. It is only a UI structure and does not establish backend access control. No protected data or API calls are present in these placeholders.

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

Routing uses browser history. The deployment must serve the SPA entry document for application deep links; confirm that behavior on Cloudflare Pages before claiming deployed refresh support. Local route tests use a memory router. The app's placeholders do not import the Supabase client or require live credentials; future client consumers require the environment values below.

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
