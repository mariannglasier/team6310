import { useEffect, useState } from 'react'
import { ChoiceEditor } from './ChoiceEditor'
import { Button } from '../../../components/ui/Button'
import { DeleteControl } from '../../../components/ui/DeleteControl'
import { Dialog } from '../../../components/ui/Dialog'
import {
  Form,
  SelectField,
  TextAreaField,
  TextField,
} from '../../../components/ui/FormFields'
import {
  deleteCmsDraft,
  deleteCmsScenario,
  createCmsDraft,
  listCmsDrafts,
  readCmsDraft,
  saveCmsScenario,
  type CmsContent,
  type CmsDraft,
  type CmsScenario,
  type ScenarioInput,
} from '../../../services/cms'
import type { AdminEdition } from '../../../types/adminContent'

export function ScenarioWorkspace({
  editions,
  onDirtyChange,
}: {
  onDirtyChange?: (dirty: boolean) => void
  editions: readonly AdminEdition[]
}) {
  const [removingScenario, setRemovingScenario] = useState<{
    scenario: CmsScenario
    request: string
  } | null>(null)
  const [deleting, setDeleting] = useState<CmsDraft | null>(null)
  const [drafts, setDrafts] = useState<CmsDraft[]>([])
  const [content, setContent] = useState<CmsContent | null>(null)
  const [source, setSource] = useState(
    [...editions]
      .sort((a, b) => b.versionNumber - a.versionNumber)
      .find((e) => e.status === 'published')?.versionId ?? '',
  )
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [persona, setPersona] = useState('all')
  const [selected, setSelected] = useState<CmsScenario | null>(null)
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState<ScenarioInput>({
    title: '',
    description: '',
    category_id: null,
    persona_intent: null,
  })
  const [baseline, setBaseline] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [leave, setLeave] = useState<(() => void) | null>(null)
  const [creation, setCreation] = useState<{
    source: string
    name: string
    request: string
  } | null>(null)
  const [saveRequest, setSaveRequest] = useState<{
    payload: string
    request: string
  } | null>(null)
  const dirty = editing && JSON.stringify(input) !== baseline
  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])
  useEffect(() => {
    let active = true
    void listCmsDrafts()
      .then((rows) => {
        if (active) setDrafts(rows)
      })
      .catch(() => {
        if (active)
          setError('Unable to load CMS drafts. Retry using Refresh drafts.')
      })
    return () => {
      active = false
    }
  }, [])
  useEffect(() => {
    if (!dirty) return
    const prevent = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    const link = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest('a[href]') &&
        !window.confirm('Discard unsaved scenario changes?')
      ) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }
    document.addEventListener('click', link, true)
    window.addEventListener('beforeunload', prevent)
    return () => {
      window.removeEventListener('beforeunload', prevent)
      document.removeEventListener('click', link, true)
    }
  }, [dirty])
  function navigate(action: () => void) {
    if (dirty) setLeave(() => action)
    else action()
  }
  async function perform(action: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'Unable to save draft.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function open(id: string) {
    const loaded = await readCmsDraft(id)
    setContent(loaded)
    setEditing(false)
    setSelected(null)
    setPersona('all')
    setQuery('')
  }
  function edit(scenario: CmsScenario | null, loaded = content) {
    const next = {
      schedule_type: scenario?.schedule_type ?? 'non_scheduled',
      default_day: scenario?.default_day ?? null,
      choices:
        loaded?.choices?.filter(
          (c) => c.scenario_id === scenario?.scenario_id,
        ) ?? [],
      title: scenario?.title ?? '',
      description: scenario?.description ?? '',
      category_id: scenario?.category_id ?? null,
      persona_intent: scenario?.persona_intent ?? null,
    }
    setSelected(scenario)
    setInput(next)
    setBaseline(JSON.stringify(next))
    setEditing(true)
    setSaveRequest(null)
    setNotice('')
    setError('')
  }
  const filtered =
    content?.scenarios.filter(
      (s) =>
        s.title.toLowerCase().includes(query.toLowerCase()) &&
        (persona === 'all' ||
          (persona === 'general'
            ? !s.persona_intent
            : s.persona_intent === persona)),
    ) ?? []
  return (
    <section
      className="cms-workspace"
      aria-labelledby="cms-heading"
      aria-busy={busy}
    >
      <header>
        <p className="admin-muted">Content workspace · Drafts only</p>
        <h2 id="cms-heading">Scenario workspace</h2>
        <p>Create a draft from a published edition, or reopen a saved draft.</p>
      </header>
      {error && (
        <p role="alert" className="ui-field__error">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <div className="cms-draft-heading">
        <h3>Saved drafts</h3>
        <Button
          disabled={busy}
          aria-label="Create new draft"
          onClick={() => navigate(() => setCreating(true))}
        >
          ＋ New draft
        </Button>
      </div>
      <ul className="cms-draft-list">
        {drafts.map((d) => (
          <li key={d.version_id}>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                navigate(() => void perform(() => open(d.version_id)))
              }
            >
              {d.name}
            </Button>
            <span className="admin-muted">Revision {d.revision}</span>
            <DeleteControl
              className="cms-draft-delete"
              disabled={busy}
              label={`Delete ${d.name}`}
              onClick={() => navigate(() => setDeleting(d))}
            />
          </li>
        ))}
      </ul>
      <Dialog
        open={creating}
        title="Create draft"
        description="Copy a published edition into a new editable draft."
        onDismiss={() => setCreating(false)}
        dismissLabel="Cancel"
        dismissDisabled={busy}
      >
        <fieldset disabled={busy} className="cms-editor-fields">
          <Form
            aria-label="Create CMS draft"
            onSubmit={(event) => {
              event.preventDefault()
              navigate(
                () =>
                  void perform(async () => {
                    const request =
                      creation?.source === source && creation.name === name
                        ? creation.request
                        : crypto.randomUUID()
                    setCreation({ source, name, request })
                    const id = await createCmsDraft(source, name, request)
                    await open(id)
                    setDrafts(await listCmsDrafts())
                    setCreation(null)
                    setCreating(false)
                    setNotice('Draft created. Published content is unchanged.')
                  }),
              )
            }}
          >
            <SelectField
              label="Published source edition"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              required
            >
              <option value="">Choose an edition</option>
              {editions
                .filter((e) => e.status === 'published')
                .map((e) => (
                  <option key={e.versionId} value={e.versionId}>
                    Edition {e.versionNumber}
                  </option>
                ))}
            </SelectField>
            <TextField
              label="Draft name"
              value={name}
              maxLength={120}
              required
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit">Create draft</Button>
          </Form>
        </fieldset>
      </Dialog>
      {content && (
        <>
          <div className="cms-draft-heading">
            <div>
              <h3>{content.workspace.name}</h3>
              <p className="admin-muted">
                Draft · Revision {content.workspace.revision}
              </p>
            </div>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                navigate(
                  () => void perform(() => open(content.workspace.version_id)),
                )
              }
            >
              Reload draft
            </Button>
          </div>
          <div className="cms-columns">
            <section aria-label="Scenario library" className="admin-card">
              <div className="cms-draft-heading">
                <h3>Scenario library</h3>
                <Button
                  disabled={busy}
                  onClick={() => navigate(() => edit(null))}
                >
                  New scenario
                </Button>
              </div>
              <TextField
                label="Search scenarios"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <SelectField
                label="Filter by persona"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
              >
                <option value="all">All personas</option>
                <option value="general">General / unassigned</option>
                {content.personas.map((p) => (
                  <option key={p.persona_id} value={p.persona_id}>
                    {p.name}
                  </option>
                ))}
              </SelectField>
              <p className="admin-muted">{filtered.length} scenarios</p>
              <ul className="cms-library">
                {filtered.map((s) => (
                  <li key={s.scenario_id} className="cms-scenario-item">
                    <button
                      type="button"
                      disabled={busy}
                      aria-current={
                        selected?.scenario_id === s.scenario_id
                          ? 'true'
                          : undefined
                      }
                      onClick={() => navigate(() => edit(s))}
                    >
                      <strong>{s.title}</strong>
                      <span>
                        {content.personas.find(
                          (p) => p.persona_id === s.persona_intent,
                        )?.name ?? 'General / unassigned'}{' '}
                        ·{' '}
                        {s.schedule_type === 'scheduled'
                          ? 'Scheduled'
                          : 'Unscheduled'}
                      </span>
                    </button>
                    <DeleteControl
                      className="cms-scenario-delete"
                      disabled={busy}
                      label={`Delete scenario ${s.title}`}
                      onClick={() =>
                        navigate(() =>
                          setRemovingScenario({
                            scenario: s,
                            request: crypto.randomUUID(),
                          }),
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
              {!filtered.length && <p>No scenarios match these filters.</p>}
            </section>
            <section className="admin-card" aria-label="Scenario editor">
              {!editing ? (
                <>
                  <h3>Select a scenario</h3>
                  <p>
                    Choose a library item to edit its content, or create an
                    ordinary scenario.
                  </p>
                </>
              ) : (
                <Form
                  aria-label="Scenario editor"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void perform(async () => {
                      const payload = JSON.stringify([
                        content.workspace.version_id,
                        content.workspace.revision,
                        selected?.scenario_id,
                        input,
                      ])
                      const request =
                        saveRequest?.payload === payload
                          ? saveRequest.request
                          : crypto.randomUUID()
                      setSaveRequest({ payload, request })
                      const result = await saveCmsScenario(
                        content.workspace.version_id,
                        content.workspace.revision,
                        request,
                        selected?.scenario_id ?? null,
                        input,
                      )
                      const loaded = await readCmsDraft(
                        content.workspace.version_id,
                      )
                      setContent(loaded)
                      const saved = loaded.scenarios.find(
                        (s) => s.scenario_id === result.scenario_id,
                      )
                      if (!saved)
                        throw new Error(
                          'Saved scenario could not be reloaded. Reload the draft to recover.',
                        )
                      edit(saved, loaded)
                      setDrafts(await listCmsDrafts())
                      setNotice('Saved and reloaded from the database.')
                    })
                  }}
                >
                  <div className="cms-save-controls">
                    <Button type="submit" loading={busy}>
                      Save Changes
                    </Button>
                    <span
                      aria-live="polite"
                      className={dirty ? 'cms-unsaved' : 'admin-muted'}
                    >
                      {dirty ? 'Unsaved changes' : 'No unsaved changes'}
                    </span>
                  </div>
                  <h3>
                    {selected ? 'Edit scenario' : 'New ordinary scenario'}
                  </h3>
                  <fieldset disabled={busy} className="cms-editor-fields">
                    <TextField
                      label="Scenario title"
                      value={input.title}
                      required
                      maxLength={200}
                      onChange={(e) =>
                        setInput({ ...input, title: e.target.value })
                      }
                    />
                    <div className="cms-inline">
                      <SelectField
                        label="Schedule type"
                        value={input.schedule_type ?? 'non_scheduled'}
                        onChange={(e) =>
                          setInput({
                            ...input,
                            schedule_type: e.target.value,
                            default_day:
                              e.target.value === 'scheduled'
                                ? (input.default_day ?? 1)
                                : null,
                          })
                        }
                      >
                        <option value="non_scheduled">Unscheduled</option>
                        <option value="scheduled">Scheduled</option>
                      </SelectField>
                      <TextField
                        label="Default day"
                        type="number"
                        min="1"
                        max="30"
                        disabled={input.schedule_type !== 'scheduled'}
                        required={input.schedule_type === 'scheduled'}
                        value={input.default_day ?? ''}
                        onChange={(e) =>
                          setInput({
                            ...input,
                            default_day: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                      />
                      <SelectField
                        label="Category"
                        value={input.category_id ?? ''}
                        required
                        onChange={(e) =>
                          setInput({
                            ...input,
                            category_id: e.target.value || null,
                          })
                        }
                      >
                        <option value="">Choose a category</option>
                        {content.categories.map((c) => (
                          <option key={c.category_id} value={c.category_id}>
                            {c.name}
                          </option>
                        ))}
                      </SelectField>
                    </div>
                    <SelectField
                      label="Persona applicability"
                      value={input.persona_intent ?? ''}
                      onChange={(e) =>
                        setInput({
                          ...input,
                          persona_intent: e.target.value || null,
                        })
                      }
                    >
                      <option value="">General / unassigned</option>
                      {content.personas.map((p) => (
                        <option key={p.persona_id} value={p.persona_id}>
                          {p.name}
                        </option>
                      ))}
                    </SelectField>
                    <TextAreaField
                      label="Scenario description"
                      value={input.description ?? ''}
                      required
                      maxLength={20000}
                      rows={10}
                      onChange={(e) =>
                        setInput({ ...input, description: e.target.value })
                      }
                    />
                    <ChoiceEditor
                      choices={input.choices ?? []}
                      scenarios={content.scenarios}
                      onChange={(choices) => setInput({ ...input, choices })}
                    />
                  </fieldset>
                </Form>
              )}
            </section>
          </div>
        </>
      )}
      <Dialog
        open={removingScenario !== null}
        title="Delete scenario?"
        description={`Delete “${removingScenario?.scenario.title ?? ''}” and its choices and supporting content from this draft? Bill definitions and statistics are retained.`}
        onDismiss={() => setRemovingScenario(null)}
        dismissLabel="Cancel"
        dismissDisabled={busy}
      >
        {error && <p role="alert">{error}</p>}
        <Button
          variant="danger"
          loading={busy}
          onClick={() =>
            void perform(async () => {
              if (!content || !removingScenario) return
              await deleteCmsScenario(
                content.workspace.version_id,
                content.workspace.revision,
                removingScenario.request,
                removingScenario.scenario.scenario_id,
              )
              const loaded = await readCmsDraft(content.workspace.version_id)
              setContent(loaded)
              if (
                selected?.scenario_id === removingScenario.scenario.scenario_id
              ) {
                setSelected(null)
                setEditing(false)
              }
              setDrafts(await listCmsDrafts())
              setRemovingScenario(null)
              setNotice('Scenario deleted.')
            })
          }
        >
          Delete scenario
        </Button>
      </Dialog>
      <Dialog
        open={deleting !== null}
        title="Delete draft?"
        description={`Permanently delete “${deleting?.name ?? ''}” and all its copied content? Published editions are not affected.`}
        onDismiss={() => setDeleting(null)}
        dismissLabel="Cancel"
        dismissDisabled={busy}
      >
        <Button
          variant="danger"
          loading={busy}
          onClick={() =>
            void perform(async () => {
              if (!deleting) return
              try {
                await deleteCmsDraft(deleting.version_id, deleting.revision)
              } catch (failure) {
                setDeleting(null)
                setDrafts(await listCmsDrafts())
                throw failure
              }
              if (content?.workspace.version_id === deleting.version_id) {
                setContent(null)
                setEditing(false)
                setSelected(null)
              }
              setDrafts(await listCmsDrafts())
              setDeleting(null)
              setNotice('Draft deleted.')
            })
          }
        >
          Delete draft
        </Button>
      </Dialog>
      <Dialog
        open={leave !== null}
        title="Discard unsaved changes?"
        description="Your unsaved scenario edits will be lost."
        onDismiss={() => setLeave(null)}
        dismissLabel="Keep editing"
      >
        <Button
          variant="danger"
          onClick={() => {
            leave?.()
            setLeave(null)
          }}
        >
          Discard changes
        </Button>
      </Dialog>
    </section>
  )
}
