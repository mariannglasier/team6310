## Development Environment Setup

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
