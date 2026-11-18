import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
import { FieldInfo } from '../../../components/ui/FieldInfo'
import {
  TextField,
  Form,
  RequiredFieldLegend,
} from '../../../components/ui/FormFields'
import {
  CmsPublicationBlocked,
  CmsPublicationUncertain,
  preflightCmsPublication,
  publishCmsDraft,
  readCmsDraft,
  recoverCmsDraft,
  type CmsContent,
  type CmsPublicationReport,
} from '../../../services/cms'

import { publicationFindingView } from './publicationFindings'

export function PublicationReview({
  content,
  dirty,
  busy,
  perform,
  onPending,
  onPublished,
  onRecovered,
  onOpenScenario,
}: {
  content: CmsContent
  dirty: boolean
  busy: boolean
  perform: (action: () => Promise<void>) => Promise<void>
  onPending: (pending: boolean) => void
  onPublished: (loaded: CmsContent) => Promise<void>
  onRecovered: (id: string) => Promise<void>
  onOpenScenario: (id: string) => void
}) {
  const [report, setReport] = useState<CmsPublicationReport | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [request, setRequest] = useState<string | null>(null)
  const [uncertain, setUncertain] = useState(false)
  const [error, setError] = useState('')
  const [recovery, setRecovery] = useState(false)
  const [name, setName] = useState('')
  const [recoverPending, setRecoverPending] = useState(false)
  const [recoverRequest, setRecoverRequest] = useState<string | null>(null)
  async function review() {
    setError('')
    const loaded = await preflightCmsPublication(content.workspace.version_id)
    setReport(loaded)
    setRequest(null)
    setConfirm(false)
  }
  return (
    <>
      <div className="cms-publication-launch">
        <span className="cms-info-heading">
          Publication
          <FieldInfo
            label="Publication"
            text="Review the entire saved edition before publishing. Publication freezes this edition, makes it the canonical default for new starts, and preserves previous editions and existing games. Draft edits are saved only through Save Changes. Warnings do not authorize gameplay repairs."
          />
        </span>
        <Button
          variant="secondary"
          disabled={busy || dirty}
          onClick={() => void perform(review)}
        >
          Review publication
        </Button>
        {dirty && (
          <span className="cms-unsaved">
            Save or reload unsaved changes before reviewing publication.
          </span>
        )}
      </div>
      <Dialog
        open={report !== null && !confirm && !recovery}
        title="Publication review"
        description={`Review “${content.workspace.name}” · saved revision ${report?.revision ?? ''}. Fix blockers before publishing. Warnings are optional content concerns to review.`}
        dismissDisabled={busy || uncertain}
        onDismiss={() => setReport(null)}
      >
        {report && (
          <>
            <div className="cms-publication-report">
              <p>
                Edition {report.version_number} · Revision {report.revision}
              </p>
              {error && <p role="alert">{error}</p>}
              {report.revision !== content.workspace.revision && (
                <p role="alert">
                  The workspace revision changed. Close review and Reload draft,
                  then review again.
                </p>
              )}
              {(['blocker', 'warning'] as const).map((severity) => {
                const findings = [
                  ...new Map(
                    report.findings
                      .filter((f) => f.severity === severity)
                      .map((f) => {
                        const view = publicationFindingView(f, content)
                        return [
                          JSON.stringify([f.code, view.locations]),
                          f,
                        ] as const
                      }),
                  ).values(),
                ]
                return (
                  <details
                    key={severity}
                    className={`cms-publication-category cms-publication-category--${severity}`}
                    open={severity === 'blocker'}
                  >
                    <summary>
                      {severity === 'blocker' ? 'Blockers' : 'Warnings'} (
                      {findings.length})
                    </summary>
                    <div className="cms-publication-findings">
                      {!findings.length && <p>No {severity} findings.</p>}
                      {findings.map((finding, index) => {
                        const view = publicationFindingView(finding, content)
                        return (
                          <details
                            key={index}
                            className="cms-publication-finding"
                          >
                            <summary>
                              <strong>{view.title}</strong>
                              <span className="cms-publication-locations">
                                {view.locations.map((r) => r.label).join('; ')}
                              </span>
                            </summary>
                            <div className="cms-publication-explanation">
                              <p>{view.explanation}</p>
                              {[
                                ...new Set(
                                  view.locations
                                    .map((r) => r.scenarioId)
                                    .filter((id) => id !== undefined),
                                ),
                              ].map((id) => (
                                <Button
                                  key={id}
                                  variant="secondary"
                                  disabled={busy}
                                  onClick={() => {
                                    setReport(null)
                                    onOpenScenario(id)
                                  }}
                                >
                                  Open scenario:{' '}
                                  {
                                    content.scenarios.find(
                                      (s) => s.scenario_id === id,
                                    )?.title
                                  }
                                </Button>
                              ))}
                            </div>
                          </details>
                        )
                      })}
                    </div>
                  </details>
                )
              })}
            </div>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => void perform(review)}
            >
              Run review again
            </Button>
            {report.findings.some((f) => f.code === 'PUB-ORDER') &&
              report.heads.individual && (
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    setName('')
                    setRecoverRequest(null)
                    setRecovery(true)
                  }}
                >
                  Create fresh draft from latest edition
                </Button>
              )}
            <Button
              disabled={
                busy ||
                !report.can_publish ||
                report.revision !== content.workspace.revision
              }
              onClick={() => {
                setError('')
                setConfirm(true)
                setRequest(crypto.randomUUID())
              }}
            >
              Continue to confirmation
            </Button>
          </>
        )}
      </Dialog>
      <Dialog
        open={confirm}
        title="Publish this edition?"
        description={`Publish “${content.workspace.name}”, edition ${report?.version_number ?? ''}, saved revision ${report?.revision ?? ''}? This freezes its content and makes it the canonical default for new starts. Previous editions and existing games remain preserved.`}
        dismissLabel="Back to review"
        dismissDisabled={busy || uncertain}
        onDismiss={() => setConfirm(false)}
      >
        {error && <p role="alert">{error}</p>}
        {uncertain && (
          <p role="status">
            Publication awaiting confirmation. Retry the same request; editing
            is locked until its outcome is confirmed.
          </p>
        )}
        <Button
          loading={busy}
          onClick={() =>
            void perform(async () => {
              if (!report || !request) return
              setError('')
              try {
                const result = await publishCmsDraft(report, request)
                setUncertain(true)
                onPending(true)
                const loaded = await readCmsDraft(result.version_id)
                if (
                  loaded.edition?.status !== 'published' ||
                  loaded.publication?.version_id !== result.version_id
                )
                  throw new CmsPublicationUncertain(
                    'Publication may have completed, but readback could not confirm it. Retry the same request.',
                  )
                await onPublished(loaded)
                setConfirm(false)
                setReport(null)
                setUncertain(false)
                onPending(false)
              } catch (failure) {
                if (failure instanceof CmsPublicationBlocked) {
                  setReport(failure.report)
                  setConfirm(false)
                } else if (
                  failure instanceof CmsPublicationUncertain ||
                  uncertain
                ) {
                  setUncertain(true)
                  onPending(true)
                }
                // A failure after a confirmed RPC may be a failed readback; preserve its request.
                setError(
                  failure instanceof Error
                    ? failure.message
                    : 'Unable to confirm publication. Retry the same request.',
                )
                throw failure
              }
            })
          }
        >
          {uncertain ? 'Retry publication confirmation' : 'Publish edition'}
        </Button>
      </Dialog>
      <Dialog
        open={recovery}
        title="Create a fresh draft?"
        description={`Create a draft from the latest canonical published edition. “${content.workspace.name}” and its saved edits remain in the old workspace; they are not automatically copied or merged.`}
        dismissLabel="Cancel"
        dismissDisabled={busy || recoverPending}
        onDismiss={() => {
          setError('')
          setRecovery(false)
        }}
      >
        <div className="cms-publication-report">
          <Form
            requiredIndicator="asterisk"
            onSubmit={(e) => e.preventDefault()}
          >
            <TextField
              label="Fresh draft name"
              disabled={busy || recoverPending}
              value={name}
              maxLength={120}
              required
              onChange={(e) => {
                setName(e.target.value)
                setRecoverRequest(null)
              }}
            />
            <RequiredFieldLegend show={recovery} />
          </Form>
          {recoverPending && (
            <p role="status">
              Fresh-draft creation awaiting confirmation. Retry the same
              request.
            </p>
          )}
          {error && <p role="alert">{error}</p>}
        </div>
        <Button
          disabled={!name.trim()}
          loading={busy}
          onClick={() =>
            void perform(async () => {
              if (!report) return
              const id = recoverRequest ?? crypto.randomUUID()
              setRecoverRequest(id)
              try {
                const created = await recoverCmsDraft(report, name, id)
                setRecoverPending(true)
                onPending(true)
                await onRecovered(created)
                setRecoverPending(false)
                onPending(false)
                setRecovery(false)
                setReport(null)
              } catch (failure) {
                if (
                  failure instanceof CmsPublicationUncertain ||
                  recoverPending
                ) {
                  setRecoverPending(true)
                  onPending(true)
                }
                setError(
                  failure instanceof Error
                    ? failure.message
                    : 'Recovery could not be confirmed. Retry the same request.',
                )
                throw failure
              }
            })
          }
        >
          Create fresh draft
        </Button>
      </Dialog>
    </>
  )
}
