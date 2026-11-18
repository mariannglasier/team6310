import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { DeleteControl } from '../../../components/ui/DeleteControl'
import { Dialog } from '../../../components/ui/Dialog'
import { FieldInfo } from '../../../components/ui/FieldInfo'
import {
  Form,
  TextField,
  TextAreaField,
  SelectField,
  RequiredFieldLegend,
} from '../../../components/ui/FormFields'
import { DetailList } from '../../../components/admin/AdminBits'
import { money, formatDate } from '../../../components/admin/format'
import { parseUsdCents } from '../../../services/contentService'
import {
  CmsJobSaveUncertain,
  readCmsDraft,
  saveCmsJob,
  deleteCmsJob,
  type CmsContent,
  type CmsJob,
} from '../../../services/cms'
import { jobFields, jobValues, jobPatch, type JobInput } from './jobFields'

function gross(job: CmsJob | null) {
  if (job?.weekly_gross_income == null) return 'Not available'
  try {
    return money(parseUsdCents(job.weekly_gross_income, 'weekly gross'))
  } catch {
    return `${job.weekly_gross_income} (stored value)`
  }
}
export function JobEditor({
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
    job: CmsJob | null
    initial: JobInput
    input: JobInput
    revision: number
  } | null>(null)
  const [request, setRequest] = useState<{
    payload: string
    id: string
  } | null>(null)
  const [recovering, setRecovering] = useState(false)
  const [validation, setValidation] = useState('')
  const [removing, setRemoving] = useState<{
    job: CmsJob
    revision: number
    request: string
  } | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const dirty =
    !!draft &&
    (recovering ||
      JSON.stringify(draft.input) !== JSON.stringify(draft.initial))
  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])
  useEffect(() => () => onDirtyChange(false), [onDirtyChange])
  function edit(job: CmsJob | null, loaded = content, clear = true) {
    const initial = jobValues(job)
    setDraft({
      job,
      initial,
      input: initial,
      revision: loaded.workspace.revision,
    })
    setRequest(null)
    setRecovering(false)
    setValidation('')
    if (clear) onEdit()
  }
  const jobs = content.jobs?.filter((job) =>
    `${job.title} ${job.soc_code}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  )
  const hasRequired =
    !!draft &&
    jobFields.some(
      (field) =>
        ('required' in field &&
          field.required &&
          (!draft.job ||
            draft.input[field.key] !== draft.initial[field.key])) ||
        (draft.input.is_active === 'true' &&
          ['median_hourly_wage', 'wage_year', 'reviewed_at'].includes(
            field.key,
          )),
    )
  return (
    <>
      <div className="cms-columns">
        <section className="admin-card" aria-label="Job library">
          <div className="cms-draft-heading">
            <h3>Job library</h3>
            <Button
              disabled={busy || !jobs}
              onClick={() => navigate(() => edit(null))}
            >
              New job
            </Button>
          </div>
          <TextField
            label="Search jobs"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {!jobs ? (
            <p role="alert">
              Job data is unavailable. Reload the draft before editing.
            </p>
          ) : (
            <>
              <p className="admin-muted">{jobs.length} jobs</p>
              <ul className="cms-library">
                {jobs.map((job) => (
                  <li key={job.job_id} className="cms-scenario-item">
                    <button
                      type="button"
                      disabled={busy}
                      aria-current={
                        draft?.job?.job_id === job.job_id ? 'true' : undefined
                      }
                      onClick={() => navigate(() => edit(job))}
                    >
                      <strong>{job.title || 'Untitled job'}</strong>{' '}
                      <span>
                        SOC {job.soc_code} ·{' '}
                        {job.is_active ? 'Active' : 'Inactive'} ·{' '}
                        {job.is_approved ? 'Approved' : 'Not approved'}
                      </span>
                    </button>
                    <DeleteControl
                      className="cms-scenario-delete"
                      disabled={busy}
                      label={`Delete job ${job.title}`}
                      onClick={() =>
                        navigate(() => {
                          setDeleteError('')
                          setRemoving({
                            job,
                            revision: content.workspace.revision,
                            request: crypto.randomUUID(),
                          })
                        })
                      }
                    />
                  </li>
                ))}
              </ul>
              {!jobs.length && <p>No jobs match this search.</p>}
            </>
          )}
        </section>
        <section className="admin-card" aria-label="Job editor">
          {!draft ? (
            <>
              <h3>Select a job</h3>
              <p>Choose a job from this draft, or create a new job.</p>
            </>
          ) : (
            <Form
              aria-label="Job editor"
              requiredIndicator="asterisk"
              onSubmit={(event) => {
                event.preventDefault()
                onEdit()
                let fields
                try {
                  fields = jobPatch(
                    draft.input,
                    draft.initial,
                    draft.job === null,
                  )
                  setValidation('')
                } catch (failure) {
                  setValidation(
                    failure instanceof Error
                      ? failure.message
                      : 'Check job values.',
                  )
                  return
                }
                void perform(async () => {
                  const payload = JSON.stringify([
                    content.workspace.version_id,
                    draft.revision,
                    draft.job?.job_id,
                    fields,
                  ])
                  const id =
                    request?.payload === payload
                      ? request.id
                      : crypto.randomUUID()
                  setRequest({ payload, id })
                  let saved
                  try {
                    saved = await saveCmsJob(
                      content.workspace.version_id,
                      draft.revision,
                      id,
                      draft.job?.job_id ?? null,
                      fields,
                    )
                  } catch (failure) {
                    if (failure instanceof CmsJobSaveUncertain)
                      setRecovering(true)
                    throw failure
                  }
                  setRecovering(true)
                  let loaded: CmsContent
                  try {
                    loaded = await readCmsDraft(content.workspace.version_id)
                    if (
                      !loaded.jobs?.some((job) => job.job_id === saved.job_id)
                    )
                      throw new Error('Missing job readback')
                    await onSaved(loaded)
                  } catch {
                    throw new Error(
                      'The job save may have completed, but it could not be reloaded. Retry Save Changes to recover the same request before editing further.',
                    )
                  }
                  edit(
                    loaded.jobs!.find((job) => job.job_id === saved.job_id)!,
                    loaded,
                    false,
                  )
                })
              }}
            >
              <div className="cms-save-controls">
                <Button type="submit" loading={busy}>
                  Save Changes
                </Button>
                <div className="cms-save-status">
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
                  <RequiredFieldLegend show={hasRequired} />
                </div>
              </div>
              <h3>{draft.job ? 'Edit job' : 'New job'}</h3>
              {validation && (
                <p role="alert" className="ui-field__error">
                  {validation}
                </p>
              )}
              {recovering && (
                <p>
                  Retry Save Changes to confirm the saved content before editing
                  further, or reload the draft.
                </p>
              )}
              <div className="admin-figures">
                <div>
                  <span className="admin-figures__value">
                    {gross(draft.job)}
                  </span>
                  <span className="cms-info-heading">
                    Weekly gross (saved, read-only)
                    <FieldInfo
                      label="Weekly gross"
                      text="PostgreSQL generates weekly gross as hourly wage multiplied by weekly hours, rounded to two decimal places. This shows the saved value and updates after Save and reload; it cannot be edited separately. A missing wage produces no calculated income."
                    />
                  </span>
                </div>
              </div>
              {draft.input.is_active === 'true' &&
                (!draft.input.needs_english_skills ||
                  !draft.input.needs_computer_skills) && (
                  <p className="admin-notice">
                    Skill requirements are not fully configured. Individual
                    application validation requires explicit skill flags.
                  </p>
                )}
              <fieldset
                disabled={busy || recovering}
                className="cms-editor-fields"
              >
                {[
                  'Job details',
                  'Wages and area',
                  'Requirements',
                  'Sources and availability',
                ].map((section) => (
                  <section className="cms-job-section" key={section}>
                    <h4>{section}</h4>
                    {jobFields
                      .filter((field) => field.section === section)
                      .map((field) => {
                        const labelAction =
                          'info' in field ? (
                            <FieldInfo label={field.label} text={field.info} />
                          ) : undefined
                        const required =
                          ('required' in field &&
                            field.required &&
                            (!draft.job ||
                              draft.input[field.key] !==
                                draft.initial[field.key])) ||
                          (draft.input.is_active === 'true' &&
                            [
                              'median_hourly_wage',
                              'wage_year',
                              'reviewed_at',
                            ].includes(field.key))
                        const common = {
                          label: field.label,
                          labelAction,
                          required,
                          value: draft.input[field.key],
                          onChange: (
                            e: React.ChangeEvent<
                              | HTMLInputElement
                              | HTMLTextAreaElement
                              | HTMLSelectElement
                            >,
                          ) =>
                            setDraft({
                              ...draft,
                              input: {
                                ...draft.input,
                                [field.key]: e.target.value,
                              },
                            }),
                        }
                        if ('options' in field)
                          return (
                            <SelectField {...common} key={field.key}>
                              {field.key !== 'is_active' &&
                                field.key !== 'is_approved' && (
                                  <option value="">
                                    {field.key === 'geography_level'
                                      ? 'Choose a geography'
                                      : 'Not configured'}
                                  </option>
                                )}
                              {field.options.map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </SelectField>
                          )
                        return 'multiline' in field ? (
                          <TextAreaField {...common} key={field.key} rows={3} />
                        ) : (
                          <TextField
                            {...common}
                            key={field.key}
                            inputMode={
                              ['median_hourly_wage', 'hours_per_week'].includes(
                                field.key,
                              )
                                ? 'decimal'
                                : field.key === 'wage_year'
                                  ? 'numeric'
                                  : undefined
                            }
                          />
                        )
                      })}
                  </section>
                ))}
                <DetailList
                  items={[
                    {
                      label: 'Last source sync · Read-only',
                      value: formatDate(draft.job?.last_synced_at ?? null),
                    },
                    {
                      label: 'Created · Read-only',
                      value: formatDate(draft.job?.created_at ?? null),
                    },
                  ]}
                />
              </fieldset>
            </Form>
          )}
        </section>
      </div>
      <Dialog
        open={removing !== null}
        title="Delete job?"
        description={`Delete “${removing?.job.title ?? ''}” from this draft? Persona, gameplay or other references will block deletion. Published sources are unchanged.`}
        onDismiss={() => setRemoving(null)}
        dismissLabel="Cancel"
        dismissDisabled={busy}
      >
        {deleteError && <p role="alert">{deleteError}</p>}
        <Button
          variant="danger"
          loading={busy}
          onClick={() =>
            void perform(async () => {
              if (!removing) return
              try {
                await deleteCmsJob(
                  content.workspace.version_id,
                  removing.revision,
                  removing.request,
                  removing.job.job_id,
                )
                const loaded = await readCmsDraft(content.workspace.version_id)
                await onSaved(loaded, 'Job deleted.')
                setDraft(null)
                setRecovering(false)
                setRemoving(null)
              } catch (failure) {
                setDeleteError(
                  `${failure instanceof Error ? failure.message : 'Unable to confirm deletion.'} Retrying Delete job uses the same request; your form is retained.`,
                )
              }
            })
          }
        >
          Delete job
        </Button>
      </Dialog>
    </>
  )
}
