# CMS direction — November 17, 2026

The Scenario Editor is the centerpiece: functional draft authoring is the priority.
Scenario management includes creating, editing and safely deleting draft scenarios.
Persona-specific and general scenarios stay in one global library with persona
filtering; no duplicate editors or automatic persona variants.

Current scope: persisted draft creation/reopening, scenario fields and scheduling,
choices/direct effects, compact controls, and protected scenario/draft deletion.
Publication is absent; published editions and gameplay remain isolated.

Implemented: supporting-copy authoring inside Scenario Editor, informed by
[cms-post-choice-flow.md](cms-post-choice-flow.md). This includes source/period and
Eligible for gameplay display, without editorial roles or approval workflows. See [scenario fact authoring](cms-scenario-facts.md) for fields and persistence.
Ordinary response text is authored/loaded but currently hidden during normal
recap; deciding to render it is separate gameplay/UI work.

Persona details editing is implemented locally (Stage 2), using the shared draft
workspace and protected persona bundle. Existing expenses are read-only and retained.
Expense management remains Stage 3, integrated inside Persona Editor; it is not a
separate editor. See [Persona Editor design and implementation](cms-persona-editor-design.md). Job editing will have its own editor.
Statistics remain read-only. Unsupported legacy effects need gameplay decisions,
not speculative editing controls. No authoritative run state becomes editable.

The timeline/node-editor concept is shelved. No timeline visualization, node graph
or drag-and-drop scheduling is planned for the current authoring work. Existing
form-based scheduling remains. This direction supersedes earlier CMS timeline
proposals and separate bill-editor placement ideas.
