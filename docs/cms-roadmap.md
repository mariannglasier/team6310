# CMS direction — November 18, 2026

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

Persona details and integrated scheduled expense management are implemented locally
(Stages 2–3), using the shared draft workspace and atomic persona bundle. Persona
management includes protected deletion that blocks scenario, recap and historical
references; expense removal never deletes linked recap content. Expenses stay inside
Persona Editor, with chronological cards and no separate management screen. See [Persona Editor design and implementation](cms-persona-editor-design.md). Jobs now have a third editor tab in the same draft workspace. See the [Job Editor contract](cms-job-editor.md) for generated-income behavior, protected persistence and reference-blocked deletion.
Statistics remain read-only. Unsupported legacy effects need gameplay decisions,
not speculative editing controls. No authoritative run state becomes editable.

The timeline/node-editor concept is shelved. No timeline visualization, node graph
or drag-and-drop scheduling is planned for the current authoring work. Existing
form-based scheduling remains. This direction supersedes earlier CMS timeline
proposals and separate bill-editor placement ideas.

CMS editor UI refinements now remove Persona Technical details, use shared field
information icons and required asterisks/legends, and keep Add expense below its
list. See the [editor information policy](cms-editor-information-policy.md) for
future authoring work. This changes no gameplay, persistence or required rules.
