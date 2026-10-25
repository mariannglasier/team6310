#Proposed Architecture: Client–Server Simulation Calculations and Data Synchronization

Status: Proposed — for architectural planning and review.

Scope: Defines the intended relationship between client-side simulation calculations, server-side authoritative calculations, and optional data collection. This document does not prescribe a final database schema or implementation.

## 1. Purpose and Design Goals

The poverty simulation should support responsive, interactive gameplay while preserving the accuracy and integrity of collected workshop data.

The proposed design uses two calculation environments:

Client-side simulation: Runs in the browser to provide immediate feedback, animations, responsive interactions, and potentially offline play.
Server-side simulation: Runs through a trusted backend to validate participant actions, maintain authoritative recorded state, and produce results used for data collection.

Both environments should implement the same documented simulation rules wherever practical. However, client calculations must not be treated as proof of what actually happened during a recorded playthrough.

The architecture should support both data-collecting and local-only playthroughs without unnecessarily duplicating the entire simulation interface.

## 2. Core Architectural Principles
### 2.1 Shared simulation rules

The client and server should follow the same documented calculation rules for applicable game mechanics, including changes to finances, expenses, available resources, and other simulation state.

Where practical, calculation logic should be implemented in a shared, deterministic TypeScript module that can run in both environments.

Shared code reduces duplicated logic but does not eliminate the need for server-side validation. The server must remain authoritative even when both environments use the same implementation.

### 2.2 Client responsiveness

The client should be able to calculate and display provisional outcomes immediately, without waiting for a network request for every animation or interaction.

Client calculations may be used to:

Animate changes in money, resources, and other simulation state.
Provide immediate visual feedback for participant choices.
Display provisional results while awaiting server confirmation.
Run a local-only playthrough when data collection is disabled.

Client-side state is not inherently trustworthy. Values calculated or stored in the browser must not be accepted as authoritative merely because they were produced by the application's own code.

### 2.3 Server authority for recorded playthroughs

When a playthrough is designated for data collection, the server must be the authority for its recorded state and final results.

The server should:

Verify that the participant is authorized to act on the playthrough.
Validate submitted actions against the current authoritative state and simulation rules.
Calculate or independently verify state transitions.
Reject invalid, unauthorized, duplicated, or out-of-order actions where applicable.
Persist authoritative state and results to the database.
Determine whether a playthrough is completed and whether its results qualify for collection.

The server must not blindly accept client-submitted balances, scores, completion flags, or other calculated outcomes.

The appropriate division of calculations between shared code and server-specific validation remains an implementation decision.

## 3. Proposed Execution Modes

The application should distinguish between two execution modes.

### 3.1 Recorded mode

Recorded mode is used when participant progress and results are intended to contribute to collected data.

In this mode:

The client handles presentation, animation, input, and provisional calculations.
Participant actions are sent to the backend.
The server validates actions and applies authoritative calculations.
The server persists the authoritative state.
The client reconciles its displayed state with the server's response.
Completed results are derived from authoritative server state rather than unverified client claims.

A recorded playthrough should not be considered successfully saved or completed solely because the client has finished its local calculations.

If a network request fails, the client should distinguish between an action that was not accepted, an action whose outcome is unknown, and an action confirmed by the server. It should avoid silently continuing with a state that may disagree with the authoritative record.

### 3.2 Local-only mode

Local-only mode is intended for situations where the participant's playthrough should not be sent to the server for data collection.

In this mode:

The client performs the simulation calculations locally.
Animations, interaction, and simulation rules should remain as consistent as practical with recorded mode.
Participant progress and results remain in local application state unless a separately approved local-persistence feature is implemented.
Simulation actions and results are not uploaded for collection.

Local-only results must not be represented as server-verified data. If results are exported, displayed, or otherwise used outside the local session, their local-only origin should remain clear.

Disabling data collection should be an explicit execution-mode decision, not merely a UI switch that stops saving while the server continues processing participant data.

The final design must clarify whether local-only mode is available offline, whether it uses the same content and rules as recorded mode, and whether any nonessential telemetry or analytics is permitted.

## 4. Client–Server Synchronization

Recorded mode requires a defined protocol for synchronizing client state with authoritative server state.

### 4.1 Action-based communication

Where practical, the client should submit participant actions or choices rather than arbitrary replacement state.

For example, the client may submit a choice to pay a bill. The server then validates that choice against the current state, applies the relevant rules, persists the result, and returns the accepted outcome.

The client should not be able to determine the authoritative outcome simply by submitting a desired new balance.

### 4.2 Server responses

Responses should provide enough information for the client to reconcile its local presentation with authoritative state. Depending on the eventual design, this may include:

Whether the action was accepted.
The authoritative state changes or resulting state.
A version or sequence identifier.
Validation errors or a reason an action was rejected.
Whether the playthrough is complete.

The exact response format should be established when the simulation action protocol is designed.

### 4.3 Ordering and duplicate requests

Network failures and retries can cause requests to arrive late, be repeated, or have uncertain outcomes.

The synchronization design should address:

Ordering of actions within a playthrough.
Duplicate submissions and retry behavior.
Stale client state.
Conflicting or concurrent requests.
Recovery after a disconnected client reconnects.

Where an action must only be applied once, the backend should use an appropriate idempotency or equivalent duplicate-prevention mechanism. A client timeout must not automatically be interpreted as proof that the server did not process the action.

### 4.4 Reconciliation

After a server response, the client should reconcile its provisional state with the authoritative result.

If client and server calculations disagree, the server result takes precedence in recorded mode. The client should update its state and presentation accordingly rather than preserving an incorrect local result.

The implementation should provide a clear recovery path for rejected actions, stale state, and failed synchronization without silently corrupting the playthrough.

## 5. Calculation Consistency and Verification

The client and server should share calculation rules wherever practical, but matching code alone is not a security boundary.

The implementation should establish:

A documented representation of simulation state and valid actions.
Consistent rules for monetary values, rounding, limits, and state transitions.
Validation of all relevant action preconditions on the server.
Tests that exercise calculation rules independently of the user interface.
Cross-environment tests that compare client-side provisional outcomes with server-side authoritative outcomes for equivalent states and actions.
A strategy for keeping calculation versions consistent when the simulation rules change.

Server-side validation should establish that a submitted action is legal and applicable to the current state. It should not rely solely on the client asserting that the action or resulting state is valid.

If the simulation rules change between playthrough creation and completion, the design should determine which rule version governs that playthrough. Historical results must remain interpretable using the rules under which they were recorded.

## 6. Data Collection and Integrity

Only records produced through the authoritative recorded-mode process should qualify as verified simulation data.

The backend should define when a playthrough is considered complete and when its results become eligible for analysis. Completion should be established through trusted state transitions, not solely through a client-supplied completion flag.

The database and backend authorization model must prevent participants from modifying authoritative results or accessing another participant's protected data without permission.

Anonymous participant authentication identifies a session, but it does not by itself establish that submitted actions are valid or that a participant is a unique real-world individual. Appropriate authorization, validation, and abuse-prevention controls remain necessary.

## 7. Failure Handling and Offline Behavior

The system should distinguish between:

A recorded playthrough with confirmed server state.
A recorded playthrough with pending or uncertain synchronization.
A local-only playthrough that has no authoritative server record.

If a participant loses connectivity during recorded mode, the application must not silently treat unconfirmed local progress as saved or verified.

Whether recorded playthroughs may temporarily queue actions for later synchronization is an open design decision. If supported, queued actions must be validated and reconciled against authoritative server state when connectivity returns.

Local-only mode should remain usable without server synchronization if offline play is an explicit requirement.

## 8. Security Boundaries

The browser is an untrusted execution environment. Participants can modify client-side code, requests, and local state.

Consequently:

Client-side calculations are for responsiveness and presentation, not security enforcement.
Database Row Level Security protects data access but does not replace validation of simulation actions.
The server must derive participant identity from verified authentication context rather than trusting a client-supplied owner identifier.
Authoritative updates must follow a trusted backend path with appropriate validation and permissions.
Privileged credentials must never be exposed in frontend code.
Server-side operations should be restricted to the minimum permissions necessary.

The final implementation must choose an appropriate backend execution mechanism for authoritative calculations. This document does not require Supabase Edge Functions specifically; the choice should follow the actual requirements and existing architecture.

## 9. Testing and Acceptance Expectations

Before recorded mode is considered ready for data collection, tests should demonstrate that:

Valid participant actions produce expected authoritative state transitions.
Invalid or unauthorized actions are rejected.
Client-submitted calculated values cannot override authoritative results.
Client and server calculations agree for supported rules and inputs.
Duplicate or out-of-order requests do not silently corrupt recorded state.
Client state reconciles correctly after successful responses and recoverable failures.
Incomplete or unverified playthroughs are not misrepresented as completed, verified results.
Local-only playthroughs do not inadvertently upload simulation progress or results.

Testing should include automated calculation and backend validation tests, plus appropriate end-to-end verification.

## 10. Decisions Deferred Until Implementation Planning

This document establishes intended behavior rather than a complete implementation specification. The following decisions remain open:

The exact client/server calculation module structure.
Which calculations must execute on the server and which can remain presentation-only.
The backend mechanism for authoritative actions and persistence.
The action request and response formats.
The handling of retries, concurrent actions, and temporary disconnection.
Whether recorded mode supports offline queuing.
How local-only mode is selected and communicated to participants.
How simulation rule versions are tracked.
How completed results are retained, anonymized, and used for analysis.
Which backend and database operations require additional authorization or auditing.

These decisions should be made when the simulation state model, action rules, and database schema are better understood.

Guiding Principle

The client is responsible for responsive interaction; the server is responsible for authoritative recorded outcomes.

Both environments should follow the same simulation rules wherever practical, but only server-validated and server-recorded results qualify as verified collected data. Local-only play remains a separate execution mode in which calculations can run without sending participant progress to the server.
