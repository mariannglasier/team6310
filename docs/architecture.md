# System Architecture — CAC Poverty Exercise

## 1. Overview

The CAC Poverty Exercise is a web-based interactive simulation developed for the Community Assistance Center (CAC). It simulates one month of living with financial insecurity, allowing participants to make decisions about household expenses, unexpected situations, and limited resources.

The application supports individual gameplay, facilitated group sessions, educational data visualizations, and administrative content management.

The system follows a **client-server architecture** with three primary layers:

- **Frontend:** Provides the user interface and interactive simulation experience.
- **Backend:** Manages data access, authentication, group communication, and server-side operations.
- **Database:** Stores simulation content, statistics, player responses, and administrative information.

External public data sources may provide updated economic statistics for educational comparisons.

The architecture is intended to support maintainability, accessibility, and the ability to update simulation content without modifying application code.

## 2. Technology Stack

| Component | Technology | Responsibility |
|---|---|---|
| Frontend | React + TypeScript | Interactive pages, simulation interface, group participation, visualizations, and administrative tools |
| Backend | Supabase | Database access, authentication, application services, and real-time communication |
| Database | PostgreSQL (Supabase) | Persistent storage of simulation content, statistics, responses, and sessions |
| Authentication | Supabase Auth | Authentication for authorized CAC employees |
| Real-Time Communication | Supabase Realtime | Synchronization of group sessions across devices |
| Hosting | Cloudflare Pages | Hosting and deployment of the web application |
| External Data | Government data sources/APIs | Economic and demographic statistics for educational comparisons |

**Decisions still needed:**

- **[TEAM DECISION NEEDED: Confirm whether the application will use Supabase Edge Functions, PostgreSQL functions, direct Supabase API operations with Row Level Security, or a combination for server-side business logic.]**
- **[TEAM DECISION NEEDED: Confirm the specific external data APIs and how their statistics will be retrieved and updated.]**

## 3. Major System Components

### 3.1. Frontend — React and TypeScript

The frontend is responsible for displaying the application and handling user interactions. It communicates with Supabase to retrieve and update persistent information.

The frontend consists of five major functional areas.

**Individual Simulation**

- Allows players to select household personas.
- Displays scenarios and available choices.
- Displays the player's current balance, day of the month, and upcoming expenses.
- Shows financial consequences after each decision.
- Tracks progress through the simulated month.
- Supports gameplay with or without CAC assistance enabled.

**Facilitated Group Simulation**

- Allows facilitators to create group sessions.
- Allows participants to join using a session code.
- Displays active scenarios and response deadlines.
- Allows participants to submit individual decisions.
- Displays aggregated group responses for discussion.

**Data Visualization**

- Displays statistics relevant to simulation scenarios.
- Compares previous player responses with real-world economic conditions.
- Distinguishes simulation results from external population statistics.
- Provides source information and context for displayed statistics.

**Administrative Interface**

- Provides protected access for authorized CAC employees.
- Allows staff to manage scenarios, choices, and supporting statistics.
- Supports reviewing and publishing simulation content.
- Provides tools for managing facilitated group sessions.

**CAC Information Pages**

- Explain the purpose of the simulation.
- Provide information about CAC and its community impact.
- Direct users to opportunities to learn more or donate.

### 3.2. Backend — Supabase

Supabase provides the backend services connecting the frontend to the PostgreSQL database.

Its responsibilities include:

- Retrieving simulation content and statistics.
- Recording player decisions and simulation progress.
- Managing group session information.
- Authenticating authorized CAC employees.
- Enforcing data access permissions.
- Supporting real-time group communication.
- Supporting server-side validation and protected administrative operations.

The backend must enforce rules that cannot safely depend on frontend checks alone, including administrative authorization and restrictions on group response submissions.

**[TEAM DECISION NEEDED: Specify how authoritative simulation state changes will be processed. For example, identify whether balance updates, expense payments, and scenario progression will be calculated and validated through database functions, Edge Functions, or another approved approach.]**

### 3.3. Database — PostgreSQL

The application uses a relational PostgreSQL database hosted through Supabase.

Its data is organized into the following categories.

**Simulation Content**

| Entity | Purpose |
|---|---|
| `personas` | Household descriptions, starting balances, and income |
| `persona_expenses` | Scheduled household expenses and recurrence intervals |
| `scenarios` | Situations encountered during gameplay |
| `choices` | Available decisions and their consequences |
| `cac_support_effects` | Assistance associated with decisions when CAC support is enabled |

**Statistics and Player Activity**

| Entity | Purpose |
|---|---|
| `statistics` | Educational facts, values, sources, locations, and reporting periods |
| `scenario_statistics` | Relationships between scenarios and supporting statistics |
| `playthroughs` | Individual simulation attempts and current progress |
| `playthrough_expenses` | Expenses and payment status during a playthrough |
| `player_responses` | Selected choices and their financial effects |
| `group_sessions` | Facilitated sessions, join codes, and round information |

**Administration**

| Entity | Purpose |
|---|---|
| `content_versions` | Content revisions, publication status, and change history |
| Administrator profiles | Information associated with authorized administrative users |

Primary and foreign keys establish relationships between these records.

See `docs/data-model.md` for detailed entity definitions, attributes, relationships, and constraints.

### 3.4. Real-Time Group Communication

Facilitated group sessions use Supabase Realtime to synchronize information between participant and facilitator devices.

The intended interaction is:

1. A facilitator creates a session.
2. Participants join using a unique code.
3. The facilitator starts a round.
4. Participants receive the active scenario and submit responses.
5. Responses are recorded and validated.
6. Updated session information and aggregate results are distributed to connected devices.

Supabase Realtime uses secure WebSocket connections. Participant devices communicate through the hosted service rather than directly with one another.

**[TEAM DECISION NEEDED: Finalize how group round transitions, response deadlines, and session ownership will be enforced on the backend.]**

### 3.5. External Data Integration

The application is intended to incorporate real-world statistics that provide context for simulation decisions and outcomes.

Potential sources identified in the Detailed Design Document include:

- U.S. Census Bureau
- U.S. Department of Housing and Urban Development (HUD)
- U.S. Bureau of Labor Statistics (BLS)
- U.S. Department of Agriculture (USDA)

Statistics are intended to be stored with their source, geographic area, reporting period, and unit of measurement.

The application should be able to display approved statistics alongside simulation results.

**[TEAM DECISION NEEDED: Identify the approved data sources, specific datasets or endpoints, update frequency, and whether retrieval will be automated or performed manually.]**

**[TEAM DECISION NEEDED: Define how updated statistics will be reviewed or validated before appearing in the simulation.]**

### 3.6. Hosting and Deployment

Cloudflare Pages is the planned hosting platform for the React and TypeScript frontend.

Cloudflare Pages will serve the public website, simulation interfaces, and administrative portal.

Supabase will provide separately hosted backend and database services.

**[TEAM DECISION NEEDED: Confirm the deployment workflow, including production and development environments, environment variable management, and deployment approval process.]**

## 4. System Interactions

### 4.1. Individual Simulation Flow

1. The player opens the application and selects a household persona.
2. The frontend retrieves the persona's starting information from Supabase.
3. The player receives a scenario and selects a decision.
4. The application applies the decision's financial consequences and updates simulation progress.
5. The response and updated state are recorded.
6. Relevant statistics and previous player response comparisons are displayed when available.
7. The process continues through the simulated month.

### 4.2. Group Simulation Flow

1. A facilitator creates a group session and receives a join code.
2. Participants join the session through their devices.
3. The facilitator starts a round.
4. Participants submit responses before the deadline.
5. The backend validates and records responses.
6. Supabase Realtime distributes session updates.
7. Aggregated results are presented for group discussion.

### 4.3. Administrative Content Management Flow

1. A CAC employee authenticates through Supabase Auth.
2. The employee accesses the administrative interface.
3. The employee creates or edits simulation content.
4. The application validates and saves authorized changes.
5. Approved content is published for use in simulations.

Content is stored in the database so it can be updated without changing the frontend source code.

## 5. Data Exchange

The frontend exchanges structured data with Supabase using JSON over HTTPS.

Major exchanges include:

- Retrieving personas, scenarios, choices, and statistics.
- Submitting player decisions.
- Updating simulation progress.
- Creating and managing group sessions.
- Retrieving aggregated response information.
- Creating and editing administrative content.

Supabase Realtime uses secure WebSockets for group session updates.

See `docs/api.md` for detailed interface contracts, operations, and data formats.

## 6. Security and Privacy Architecture

The application separates public participant access from protected administrative functionality.

The following requirements guide the architecture:

- General participants do not need personal accounts.
- CAC employees authenticate through Supabase Auth.
- Administrative actions require appropriate authorization.
- Supabase Row Level Security helps restrict database access.
- Privileged backend credentials must not be exposed in frontend code.
- Participant responses use anonymous identifiers rather than names.
- Group results are presented in aggregate.
- HTTPS and secure WebSockets protect communication between services.

See `docs/security.md` for detailed authentication, authorization, privacy, and data handling requirements.

## 7. Architectural Principles

**Modularity:** Simulation content, user interface components, and data access responsibilities should remain logically separated.

**Maintainability:** Administrators should be able to update simulation content without requiring changes to application code.

**Accessibility:** The application should support desktop and mobile devices, including keyboard-accessible interactions.

**Data Integrity:** Player responses, financial effects, and simulation progress must remain consistent.

**Security:** Protected operations must enforce authorization independently of frontend controls.

**Educational Accuracy:** Statistical comparisons must identify their sources and distinguish real-world population data from simulation participant responses.

## 8. Related Documentation

- `docs/data-model.md` — Database schema and relationships.
- `docs/api.md` — Component interfaces and external integrations.
- `docs/security.md` — Security and privacy requirements.
- `docs/design/ui-spec.md` — Interface specifications and approved designs.
- `docs/design/user-flows.md` — Navigation and interaction flows.

The documents above should be consulted before making implementation decisions affecting their respective areas.