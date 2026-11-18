import { useEffect, useState } from 'react'
import { Badge, DetailList } from '../../../components/admin/AdminBits'
import { money } from '../../../components/admin/format'
import { Button } from '../../../components/ui/Button'
import { FieldInfo } from '../../../components/ui/FieldInfo'
import { DeleteControl } from '../../../components/ui/DeleteControl'
import { Dialog } from '../../../components/ui/Dialog'
import { PersonaAvatar } from '../../../components/simulation/PersonaAvatar'
import { PersonaExpenseCards } from './PersonaExpenseCards'
import { expenseKey } from './personaExpenses'
import {
  Form,
  RequiredFieldLegend,
  TextField,
  TextAreaField,
  SelectField,
} from '../../../components/ui/FormFields'
import { parseUsdCents } from '../../../services/contentService'
import {
  CmsPersonaSaveUncertain,
  readCmsDraft,
  saveCmsPersona,
  deleteCmsPersona,
  type CmsContent,
  type CmsPersona,
  type CmsExpenseInput,
  type PersonaFields,
} from '../../../services/cms'

type Values = {
  name: string
  description: string
  balance: string
  english: string
  computer: string
}
function values(persona: CmsPersona | null): Values {
  const skill = (value: boolean | null | undefined) =>
    value == null ? '' : value ? 'yes' : 'no'
  return {
    name: persona?.name ?? '',
    description: persona?.description ?? '',
    balance:
      persona?.general_starting_balance == null
        ? ''
        : String(persona.general_starting_balance),
    english: skill(persona?.has_english_skills),
    computer: skill(persona?.has_computer_skills),
  }
}
function amount(value: string | number | null) {
  if (value === null) return 'Not configured'
  try {
    return money(parseUsdCents(value, 'stored amount'))
  } catch {
    return `${value} (stored value)`
  }
}

export function PersonaEditor({
  content,
  busy,
  navigate,
  perform,
  onDirtyChange,
  onEdit,
  onSaved,
}: {
  content: CmsContent
  busy: boolean
  navigate: (action: () => void) => void
  perform: (action: () => Promise<void>) => Promise<void>
  onDirtyChange: (dirty: boolean) => void
  onEdit: () => void
  onSaved: (content: CmsContent, message?: string) => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<{
    persona: CmsPersona | null
    initial: Values
    input: Values
    revision: number
    expenses: CmsExpenseInput[] | undefined
    initialExpenses: string
  } | null>(null)
  const [request, setRequest] = useState<{
    payload: string
    id: string
  } | null>(null)
  const [validation, setValidation] = useState('')
  const [recovering, setRecovering] = useState(false)
  const [removingExpense, setRemovingExpense] =
    useState<CmsExpenseInput | null>(null)
  const [expenseError, setExpenseError] = useState('')
  const [removingPersona, setRemovingPersona] = useState<{
    persona: CmsPersona
    request: string
    revision: number
  } | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const linked = new Set(
    content.bill_links?.map((link) => link.expense_id) ?? [],
  )
  const dirty =
    draft !== null &&
    (recovering ||
      JSON.stringify(draft.input) !== JSON.stringify(draft.initial) ||
      JSON.stringify(draft.expenses) !== draft.initialExpenses)
  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])
  useEffect(() => () => onDirtyChange(false), [onDirtyChange])
  function edit(
    persona: CmsPersona | null,
    loaded = content,
    clearFeedback = true,
  ) {
    const initial = values(persona)
    const expenses = persona
      ? loaded.expenses?.filter((e) => e.persona_id === persona.persona_id)
      : []
    setDraft({
      persona,
      initial,
      input: initial,
      revision: loaded.workspace.revision,
      expenses,
      initialExpenses: JSON.stringify(expenses),
    })
    setRequest(null)
    setRecovering(false)
    setValidation('')
    if (clearFeedback) onEdit()
  }
  function fields(): PersonaFields {
    if (!draft) return {}
    const { input, initial, persona } = draft
    const patch: PersonaFields = {}
    if (!persona || input.name !== initial.name) {
      if (!input.name.trim()) throw new Error('Enter a persona name.')
      patch.name = input.name.trim()
    }
    if (!persona || input.description !== initial.description) {
      if (!input.description.trim())
        throw new Error(
          'Enter a description. An existing missing description can be left unchanged.',
        )
      patch.description = input.description
    }
    if (!persona || input.balance !== initial.balance) {
      if (
        !/^[0-9]+(\.[0-9]{1,2})?$/.test(input.balance) ||
        Number(input.balance) >= 10000000000
      )
        throw new Error(
          'Enter a starting balance from $0 to less than $10 billion, with at most two decimal places.',
        )
      patch.general_starting_balance = input.balance
    }
    if (!persona || input.english !== initial.english) {
      if (!['yes', 'no'].includes(input.english))
        throw new Error('Choose Yes or No for English skills.')
      patch.has_english_skills = input.english === 'yes'
    }
    if (!persona || input.computer !== initial.computer) {
      if (!['yes', 'no'].includes(input.computer))
        throw new Error('Choose Yes or No for computer skills.')
      patch.has_computer_skills = input.computer === 'yes'
    }
    return patch
  }
  const filtered = content.personas.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <>
      <div className="cms-columns">
        <section aria-label="Persona library" className="admin-card">
          <div className="cms-draft-heading">
            <h3>Persona library</h3>
            <Button disabled={busy} onClick={() => navigate(() => edit(null))}>
              New persona
            </Button>
          </div>
          <TextField
            label="Search personas"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <p className="admin-muted">{filtered.length} personas</p>
          <ul className="cms-library">
            {filtered.map((p) => (
              <li key={p.persona_id} className="cms-scenario-item">
                <button
                  type="button"
                  disabled={busy}
                  aria-current={
                    draft?.persona?.persona_id === p.persona_id
                      ? 'true'
                      : undefined
                  }
                  onClick={() => navigate(() => edit(p))}
                >
                  <strong>{p.name || 'Unnamed persona'}</strong>{' '}
                  <span>
                    Starting balance {amount(p.general_starting_balance)}
                  </span>
                </button>
                <DeleteControl
                  className="cms-scenario-delete"
                  disabled={busy}
                  label={`Delete persona ${p.name}`}
                  onClick={() =>
                    navigate(() => {
                      setDeleteError('')
                      setRemovingPersona({
                        persona: p,
                        request: crypto.randomUUID(),
                        revision: content.workspace.revision,
                      })
                    })
                  }
                />
              </li>
            ))}
          </ul>
          {!filtered.length && <p>No personas match this search.</p>}
        </section>
        <section
          className="admin-card cms-persona-editor"
          aria-label="Persona editor"
        >
          {!draft ? (
            <>
              <h3>Select a persona</h3>
              <p>Choose a persona from this draft, or create a new persona.</p>
            </>
          ) : (
            <Form
              aria-label="Persona editor"
              requiredIndicator="asterisk"
              onSubmit={(event) => {
                event.preventDefault()
                let patch: PersonaFields
                try {
                  patch = fields()
                  setValidation('')
                } catch (failure) {
                  setValidation(
                    failure instanceof Error
                      ? failure.message
                      : 'Check the persona fields.',
                  )
                  return
                }
                void perform(async () => {
                  const payload = JSON.stringify([
                    content.workspace.version_id,
                    draft.revision,
                    draft.persona?.persona_id,
                    patch,
                    draft.expenses,
                  ])
                  const id =
                    request?.payload === payload
                      ? request.id
                      : crypto.randomUUID()
                  setRequest({ payload, id })
                  let saved: { persona_id: string; revision: number }
                  try {
                    saved = await saveCmsPersona(
                      content.workspace.version_id,
                      draft.revision,
                      id,
                      draft.persona?.persona_id ?? null,
                      patch,
                      draft.expenses,
                    )
                  } catch (failure) {
                    if (failure instanceof CmsPersonaSaveUncertain)
                      setRecovering(true)
                    throw failure
                  }
                  setRecovering(true)
                  let loaded: CmsContent
                  try {
                    loaded = await readCmsDraft(content.workspace.version_id)
                    if (
                      !loaded.personas.some(
                        (p) => p.persona_id === saved.persona_id,
                      )
                    )
                      throw new Error('Persona missing from readback')
                    await onSaved(loaded)
                  } catch {
                    throw new Error(
                      'The persona save may have completed, but it could not be reloaded. Your edits are still here. Retry Save Changes to recover the same save.',
                    )
                  }
                  edit(
                    loaded.personas.find(
                      (p) => p.persona_id === saved.persona_id,
                    )!,
                    loaded,
                    false,
                  )
                })
              }}
            >
              <div className="cms-save-controls">
                <Button
                  type="submit"
                  loading={busy}
                  disabled={draft.expenses === undefined}
                >
                  Save Changes
                </Button>
                <div className="cms-save-status">
                  {' '}
                  <span
                    aria-live="polite"
                    className={dirty ? 'cms-unsaved' : 'admin-muted'}
                  >
                    {recovering
                      ? 'Save awaiting confirmation'
                      : dirty
                        ? 'Unsaved changes'
                        : 'No unsaved changes'}
                  </span>
                  <RequiredFieldLegend
                    show={
                      !draft.persona ||
                      JSON.stringify(draft.input) !==
                        JSON.stringify(draft.initial) ||
                      (draft.expenses?.length ?? 0) > 0
                    }
                  />
                </div>
              </div>
              <h3>{draft.persona ? 'Edit persona' : 'New persona'}</h3>
              {validation && (
                <p role="alert" className="ui-field__error">
                  {validation}
                </p>
              )}
              {recovering && (
                <p className="admin-muted">
                  Retry Save Changes to confirm the saved content before editing
                  further, or reload the draft.
                </p>
              )}
              <fieldset
                disabled={busy || recovering}
                className="cms-editor-fields"
              >
                <header className="admin-card__header admin-card__header--persona">
                  <span className="cms-persona-avatar">
                    <PersonaAvatar name={draft.input.name} variant="profile" />
                  </span>
                  <div>
                    <strong>{draft.input.name || 'New persona'}</strong>
                    <div className="admin-badges">
                      <Badge tone="blue">
                        {
                          content.scenarios.filter(
                            (s) =>
                              s.persona_intent === draft.persona?.persona_id,
                          ).length
                        }{' '}
                        linked scenarios
                      </Badge>
                    </div>
                  </div>
                </header>
                <TextField
                  label="Persona name"
                  value={draft.input.name}
                  required={
                    !draft.persona || draft.input.name !== draft.initial.name
                  }
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      input: { ...draft.input, name: e.target.value },
                    })
                  }
                />
                <div className="admin-figures cms-persona-finances">
                  <TextField
                    label="Starting balance (USD)"
                    inputMode="decimal"
                    value={draft.input.balance}
                    required={
                      !draft.persona ||
                      draft.input.balance !== draft.initial.balance
                    }
                    labelAction={
                      <FieldInfo
                        label="Starting balance (USD)"
                        text={`Starting balance applies to future playthroughs. Existing runs stay unchanged.${draft.persona?.general_starting_balance === null ? ' Not configured. Leave unchanged to preserve the stored value.' : ''}`}
                      />
                    }
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        input: { ...draft.input, balance: e.target.value },
                      })
                    }
                  />
                  <div>
                    <span className="admin-figures__value">
                      {amount(draft.persona ? draft.persona.weekly_income : 0)}
                    </span>
                    <span className="admin-figures__label">
                      Weekly income · Read-only
                    </span>
                  </div>
                </div>
                <TextAreaField
                  label="Persona description"
                  rows={6}
                  value={draft.input.description}
                  required={
                    !draft.persona ||
                    draft.input.description !== draft.initial.description
                  }
                  labelAction={
                    draft.persona?.description === null ? (
                      <FieldInfo
                        label="Persona description"
                        text="No description stored. Leave unchanged to preserve it. New descriptions must contain nonblank text."
                      />
                    ) : undefined
                  }
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      input: { ...draft.input, description: e.target.value },
                    })
                  }
                />
                <DetailList
                  items={[
                    {
                      label: 'Starting job · Read-only',
                      value: draft.persona?.starting_job_id
                        ? 'Configured job (read-only)'
                        : 'None',
                    },
                  ]}
                />
                {draft.persona &&
                  ((draft.persona.weekly_income !== null &&
                    Number(draft.persona.weekly_income) !== 0) ||
                    draft.persona.starting_job_id) && (
                    <p className="admin-notice">
                      This stored persona has a starting job or nonzero income.
                      Those values are retained; the current individual
                      household selector expects an unemployed start.
                    </p>
                  )}
                <div className="cms-inline">
                  {(['english', 'computer'] as const).map((key) => (
                    <SelectField
                      key={key}
                      label={
                        key === 'english' ? 'English skills' : 'Computer skills'
                      }
                      value={draft.input[key]}
                      required={
                        !draft.persona ||
                        draft.input[key] !== draft.initial[key]
                      }
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          input: { ...draft.input, [key]: e.target.value },
                        })
                      }
                    >
                      <option
                        value=""
                        disabled={!draft.persona || draft.initial[key] !== ''}
                      >
                        {draft.persona ? 'Not configured' : 'Choose Yes or No'}
                      </option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </SelectField>
                  ))}
                </div>
                <section
                  aria-label="Scheduled expenses"
                  className="cms-expenses"
                >
                  <div className="cms-info-heading">
                    <h4>Scheduled expenses</h4>{' '}
                    <FieldInfo
                      label="Scheduled expenses"
                      text="Expenses are ordered by first due day, then name and stable identity. Changes save together with persona details. Amounts apply per occurrence. Enter an explicit fixed late fee, including zero when appropriate. One-time recurrence is stored as NULL; repeating expenses need a positive interval. Individual gameplay creates occurrences through Day 30; group mode currently shows expense definitions as context."
                    />
                  </div>
                  {draft.expenses === undefined ? (
                    <p role="alert">
                      Expense data is unavailable. Reload the draft before
                      saving.
                    </p>
                  ) : (
                    <PersonaExpenseCards
                      expenses={draft.expenses}
                      linked={linked}
                      onChange={(expenses) => setDraft({ ...draft, expenses })}
                      onRemove={(expense) => {
                        setExpenseError('')
                        setRemovingExpense(expense)
                      }}
                    />
                  )}
                  {draft.expenses &&
                    (
                      JSON.parse(
                        draft.initialExpenses || '[]',
                      ) as CmsExpenseInput[]
                    )
                      .filter(
                        (e) =>
                          e.expense_id &&
                          !draft.expenses!.some(
                            (current) => current.expense_id === e.expense_id,
                          ),
                      )
                      .map((e) => (
                        <div className="cms-draft-heading" key={e.expense_id}>
                          <span>Pending removal: {e.name}</span>
                          <Button
                            variant="secondary"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                expenses: [...draft.expenses!, e],
                              })
                            }
                          >
                            Restore expense {e.name}
                          </Button>
                        </div>
                      ))}
                  <div className="cms-choice-actions">
                    {' '}
                    <Button
                      variant="secondary"
                      disabled={draft.expenses === undefined}
                      onClick={() => {
                        if (!draft.expenses) return
                        setDraft({
                          ...draft,
                          expenses: [
                            ...draft.expenses,
                            {
                              expense_id: null,
                              client_key: crypto.randomUUID(),
                              persona_id: draft.persona?.persona_id ?? null,
                              version_id: content.workspace.version_id,
                              name: '',
                              amount: '',
                              first_due_day: '',
                              repeat_interval_days: null,
                              late_fee_amount: '',
                            },
                          ],
                        })
                      }}
                    >
                      Add expense
                    </Button>
                  </div>
                </section>
              </fieldset>
            </Form>
          )}
        </section>
      </div>
      <Dialog
        open={removingExpense !== null}
        title="Remove expense?"
        description={`Remove “${removingExpense?.name || 'New expense'}” from this persona? The removal takes effect only when you save changes. Bill recap content will not be removed.`}
        onDismiss={() => setRemovingExpense(null)}
        dismissLabel="Cancel"
      >
        {expenseError && <p role="alert">{expenseError}</p>}
        <Button
          variant="danger"
          onClick={() => {
            if (!draft || !removingExpense) return
            if (
              removingExpense.expense_id &&
              linked.has(removingExpense.expense_id)
            ) {
              setExpenseError(
                'This expense is linked to a bill recap and cannot be removed. No content was removed.',
              )
              return
            }
            setDraft({
              ...draft,
              expenses: draft.expenses?.filter(
                (e) => expenseKey(e) !== expenseKey(removingExpense),
              ),
            })
            setRemovingExpense(null)
          }}
        >
          Remove expense
        </Button>
      </Dialog>
      <Dialog
        open={removingPersona !== null}
        title="Delete persona?"
        description={`Delete “${removingPersona?.persona.name ?? ''}” and its unreferenced expenses from this draft? Linked scenarios, bill recaps and historical records block deletion. Published sources are unchanged.`}
        onDismiss={() => setRemovingPersona(null)}
        dismissLabel="Cancel"
        dismissDisabled={busy}
      >
        {deleteError && <p role="alert">{deleteError}</p>}
        <Button
          variant="danger"
          loading={busy}
          onClick={() =>
            void perform(async () => {
              if (!removingPersona) return
              try {
                await deleteCmsPersona(
                  content.workspace.version_id,
                  removingPersona.revision,
                  removingPersona.request,
                  removingPersona.persona.persona_id,
                )
                const loaded = await readCmsDraft(content.workspace.version_id)
                await onSaved(loaded, 'Persona deleted.')
                setDraft(null)
                setRecovering(false)
                setRemovingPersona(null)
              } catch (failure) {
                setDeleteError(
                  failure instanceof Error
                    ? `${failure.message} Retrying Delete persona uses the same request. Your form has been retained.`
                    : 'Unable to confirm deletion. Retry the same deletion or reload the draft.',
                )
              }
            })
          }
        >
          Delete persona
        </Button>
      </Dialog>
    </>
  )
}
