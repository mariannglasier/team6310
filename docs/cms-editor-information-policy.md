# CMS editor information policy — November 18, 2026

This policy applies to existing and future CMS authoring interfaces. It changes
presentation only: required-field rules, persistence, financial behavior, gameplay
and authorization remain unchanged.

## Field and control explanations

Use the shared `frontend/src/components/ui/FieldInfo.tsx` for every explanatory
description of a field, control, or authoring section. Place it beside the field
label using `labelAction`, or beside a text-only section heading in a
`cms-info-heading` wrapper. Put the complete explanation in its `text` prop;
do not duplicate the explanation beneath the input or list. CMS explanatory copy
must not use the permanently visible `hint` presentation. Other application forms
can continue using that existing shared-field API.

```tsx
<TextField
  label="First due day"
  required={existingRequiredRule}
  labelAction={
    <FieldInfo
      label="First due day"
      text="The simulation day of the first occurrence…"
    />
  }
/>
```

Describe verified behavior. Distinguish individual/group behavior where it differs,
first due date versus repeat interval, and authored values versus calculated state.
Do not create new financial rules or implied gameplay behavior through help copy.

`FieldInfo` is the single implementation for Scenario, Persona and Job editors. It uses
an explicitly labeled native button with expanded/control and content-description associations; Enter or
Space toggles it, Escape dismisses and returns focus, and outside pointer/focus
also dismisses. Explanations are floating portal content with viewport-clamped
position/width, so opening them never changes form layout. They reposition on
scroll/resize. A control inside a native dialog portals into that dialog so its
information remains in the modal's top layer. No new UI library is involved.

Section titles and field labels remain ordinary text. Help buttons are siblings
of labels/headings, not nested inside labels, so their names do not contaminate
the accessible names of fields or sections. Tests select form controls by label
prefix/role to distinguish them from separately labeled About buttons.

## Required indicators

CMS forms use `<Form requiredIndicator="asterisk">`. Shared fields retain their
exact existing native `required` values and validation. The visual marker is a
red asterisk immediately following the label; it is hidden from the accessible
name because the input's native required state already supplies the semantics.
Unrelated application forms retain their previous presentation.

Use `RequiredFieldLegend` directly beneath the unsaved/save state inside
`cms-save-status`. It renders “* is a required field” in compact secondary text.
Show it only when the editor actually has required field indicators. Scenario
forms always have required fields; existing Persona forms can have none until a
value changes or expenses are present. This display calculation must not change
the conditional required rules. The draft-creation dialog also uses asterisks
and shows the legend while open, alongside its existing required controls.

## Information that stays visible

Do not put essential operational information behind an icon:

- Validation errors, stale/failed saves, recovery instructions, dirty/save status
  and missing-data errors.
- Current-data warnings: incompatible legacy starting employment/income, an
  expense producing no occurrences within Days 1–30, and linked recap records
  preventing removal.
- Destructive confirmation names, consequences and blockers; pending-removal and
  Restore controls.
- Navigation instructions, list counts/empty states, read-only labels and actual
  content/value summaries, including fact eligibility or financial amounts.

These communicate current state, consent or recovery, rather than optional
explanations of how a field works. Preserve them even where general field help
also explains the relevant rule. Ordinary authored scenario/fact text and existing
read-only fact evidence are content/data, not help descriptions.

## Applied refinement inventory

- Persona: removed Technical details from the interface entirely; all internal
  IDs/job references remain in state and protected persistence. Starting balance
  and missing-description guidance moved into label help. Scheduled-expense
  sorting, combined-save and occurrence explanations moved to section help.
- Expense fields: amount, fixed late fee, first due day, recurrence and repeat
  interval use adjacent help. The old bottom paragraph is removed. Add expense
  sits below cards/pending removals and uses the secondary button convention,
  including for empty lists.
- Scenario: Choices ordering/progression context and Scenario facts overview use
  section help. Both general and CAC fact text retain final-copy/no-placeholders
  guidance in label help. Source URL, reporting period, copy type and eligibility
  also have consistent information controls. Existing CAC requirement, upfront
  cost, response and destination help now use the same shared component.

Verification: 510 frontend tests passed (two existing opt-in tests skipped), all
seven unchanged local CMS SQL suites and the genuine local API regression passed.
Three Chromium journeys cover Scenario, Persona and expenses, including keyboard
help, no layout shift, red markers/legend placement, tooltip viewport bounds and
390px no-overflow layout. Formatting, lint, TypeScript and production build passed.
No new migration, schema/persistence operation, hosted change or deployment is
part of this refinement. No commits or pushes were performed.
