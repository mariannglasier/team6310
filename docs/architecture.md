# Architecture — CAC Poverty Exercise

## 1. System Overview

The CAC Poverty Exercise is a web-based interactive simulation designed to help users understand the financial challenges faced by individuals and families experiencing poverty. Players navigate a simulated month, making financial decisions that affect their household's resources and outcomes.

The application also supports facilitated group simulations, interactive statistical comparisons, and an administrative interface that allows Community Assistance Center (CAC) staff to manage simulation content and workshop sessions.

The system follows a **client-server architecture**, separating the user interface, backend services, and persistent data storage. This modular structure allows simulation content and statistics to be updated without requiring changes to the application's core code.

## 2. Technology Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React + TypeScript | Interactive simulation, user interface, group participation, and administration pages |
| Backend | Supabase | Database communication, authentication, application services, and real-time updates |
| Database | PostgreSQL (Supabase) | Stores simulation content, player responses, statistics, and group session data |
| Hosting | Cloudflare Pages | Hosts and deploys the web application |
| External Data | Government APIs | Provides economic and demographic statistics for educational comparisons |
| Real-Time Communication | Supabase Realtime | Synchronizes group sessions across participant and facilitator devices |

## 3. Major System Components

### 3.1. Frontend — React and TypeScript

The frontend provides the interactive interface through which players, facilitators, and CAC administrators access the application.

Its major responsibilities include:

- **Individual Simulation:** Displays household personas, financial situations, available choices, current balances, upcoming expenses, and simulation progress.
- **Group Simulation:** Allows participants to join sessions using a code, submit timed responses, and view group results.
- **Data Visualization:** Presents interactive comparisons between player decisions, aggregated simulation results, and real-world statistics.
- **Administration Portal:** Provides interfaces for authorized CAC employees to manage simulation scenarios, statistics, and group sessions.
- **CAC Information:** Provides educational information about CAC and links to opportunities to learn more or donate.

The frontend communicates with Supabase to retrieve simulation content, submit responses, and receive updates.

### 3.2. Backend — Supabase

Supabase provides the backend services that connect the frontend to persistent application data.

Its responsibilities include:

- Processing requests to retrieve and update simulation information.
- Saving player responses and simulation progress.
- Managing group sessions and their current states.
- Authenticating CAC administrators through Supabase Auth.
- Enforcing database access permissions.
- Supporting real-time communication between devices during group simulations.
- Supporting server-side operations that require additional validation or privileged access.

Backend services are responsible for ensuring that data modifications follow the application's rules and that administrative operations are restricted to authorized users.

### 3.3. Database — PostgreSQL

The application uses a PostgreSQL relational database managed through Supabase.

The database stores three main categories of information:

**Simulation Content**
- Household personas and starting financial circumstances.
- Scenarios and available choices.
- Financial consequences and scheduled expenses.
- CAC assistance effects.
- Educational statistics and their sources.

**Simulation Activity**
- Individual playthroughs and progress.
- Anonymous player responses.
- Group sessions, join codes, and round information.
- Simulation results used for aggregate comparisons.

**Administrative Data**
- Administrator profiles and access information.
- Editable simulation content.
- Content versions and publication status.

The relational database structure connects personas, scenarios, choices, statistics, and player activity through primary and foreign keys.

### 3.4. External Data Sources

The application is designed to incorporate real-world statistics from public data sources to provide educational context for the simulation.

Potential sources include:

- U.S. Census Bureau — demographic and economic statistics.
- U.S. Department of Housing and Urban Development (HUD) — housing-related data.
- U.S. Bureau of Labor Statistics (BLS) — employment and labor statistics.
- U.S. Department of Agriculture (USDA) — food and economic data.

Relevant statistics are stored with identifying information such as their source, reporting period, geographic area, and unit of measurement.

These statistics can then be displayed alongside simulation results. External data integration is planned, and specific automated retrieval methods will be determined during implementation.

### 3.5. Hosting — Cloudflare Pages

Cloudflare Pages is the planned deployment platform for the frontend application.

It hosts the public website, individual and group simulation interfaces, and administrative portal. The deployed frontend communicates with Supabase's hosted backend services.

## 4. Component Interactions

### Individual Simulation

1. A player opens the website and selects a household persona.
2. The frontend requests the persona's starting conditions and scenarios from Supabase.
3. The player selects a response to a financial situation.
4. The application records the response and applies its financial consequences.
5. Updated resources, expenses, and progress are displayed.
6. Relevant statistics or previous player response comparisons are shown when available.
7. The process continues until the simulated month ends.

### Facilitated Group Simulation

1. A facilitator creates a group session and receives a unique join code.
2. Participants enter the code on their devices to join the session.
3. The facilitator begins a round, and participants receive the same scenario.
4. Participants submit their choices before the round deadline.
5. Supabase stores the responses and synchronizes session updates using Supabase Realtime.
6. Aggregated results are displayed for the facilitator to lead a group discussion.

### Administrative Content Management

1. A CAC employee signs in through Supabase Auth.
2. The administrator accesses protected content management pages.
3. The administrator creates or modifies scenarios, choices, or statistics.
4. Authorized changes are saved to the PostgreSQL database.
5. Published content becomes available for use in new simulations without requiring changes to frontend source code.

## 5. Data Exchange and Communication

The frontend communicates with Supabase through secure HTTPS requests, exchanging structured application data in JSON format.

Group simulation updates use **Supabase Realtime over secure WebSockets**, allowing multiple devices to receive session changes without communicating directly with one another.

The PostgreSQL database provides persistent storage, while Supabase services manage access to stored information.

## 6. Security and Privacy

The application is designed to minimize the collection of personal information and restrict access to administrative features.

- **Authentication:** CAC employees sign in using Supabase Auth. General participants do not need accounts.
- **Authorization:** Database permissions and Supabase Row Level Security (RLS) restrict access to protected records and administrative operations.
- **Anonymous Participation:** Simulation responses are associated with generated identifiers rather than participant names.
- **Secure Communication:** HTTPS and secure WebSockets protect data transmitted between devices and backend services.
- **Protected Credentials:** Privileged backend credentials are not exposed in frontend code.
- **Aggregated Results:** Group visualizations use aggregated response data rather than identifying individual participants.

## 7. Architecture Goals

The architecture prioritizes:

- **Maintainability:** Separating frontend, backend, and database responsibilities to simplify updates and debugging.
- **Modularity:** Allowing simulation scenarios and statistics to be edited independently of application code.
- **Scalability:** Supporting both individual players and multiple participants in facilitated group sessions.
- **Accessibility:** Providing responsive interfaces for desktop and mobile devices.
- **Data Accuracy:** Maintaining traceable sources and reporting dates for real-world statistics.
- **Security:** Protecting administrative functionality and minimizing the collection of participant information.