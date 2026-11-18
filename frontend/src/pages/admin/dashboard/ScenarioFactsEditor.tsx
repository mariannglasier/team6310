import { useState } from 'react'
import { FieldInfo } from '../../../components/ui/FieldInfo'
import { Button } from '../../../components/ui/Button'
import { DeleteControl } from '../../../components/ui/DeleteControl'
import { Dialog } from '../../../components/ui/Dialog'
import {
  TextField,
  TextAreaField,
  SelectField,
} from '../../../components/ui/FormFields'
import '../../../components/simulation/scenarioFacts.css'
import type { CmsFact } from '../../../services/cms'

export function ScenarioFactsEditor({
  facts,
  onChange,
}: {
  facts: CmsFact[]
  onChange: (facts: CmsFact[]) => void
}) {
  const [removing, setRemoving] = useState<number | null>(null)
  const update = (index: number, patch: Partial<CmsFact>) =>
    onChange(facts.map((f, i) => (i === index ? { ...f, ...patch } : f)))
  const add = (role: 'general' | 'cac') =>
    onChange([
      ...facts,
      {
        original_role: null,
        fact_role: role,
        display_text: '',
        source_url: '',
        reporting_period: null,
        copy_kind: 'fact',
        verified: false,
      },
    ])
  return (
    <section
      className="cms-facts"
      aria-labelledby="scenario-facts-editor-heading"
    >
      <div className="cms-info-heading">
        <h3 id="scenario-facts-editor-heading">Scenario facts</h3>{' '}
        <FieldInfo
          label="Scenario facts"
          text="Supporting copy for this scenario. One general and one CAC impact entry are supported. These are separate from the CAC service facts registry."
        />
      </div>
      {facts
        .map((f, i) => ({ f, i }))
        .sort((a, b) =>
          a.f.fact_role === b.f.fact_role
            ? 0
            : a.f.fact_role === 'general'
              ? -1
              : 1,
        )
        .map(({ f, i }) => (
          <article
            className={`admin-card cms-fact scenario-facts__card ${f.fact_role === 'cac' && facts.some((item) => item.fact_role === 'general' && item.verified) ? 'cms-fact--second' : ''}`}
            key={f.fact_role}
          >
            <DeleteControl
              label={`Remove ${f.fact_role} scenario fact`}
              onClick={() => setRemoving(i)}
              className="cms-fact-remove"
            />
            <details
              className="cms-fact-details"
              onInvalidCapture={(e) => {
                const target = e.currentTarget
                target.open = true
              }}
            >
              <summary>
                <strong>
                  {f.fact_role === 'general'
                    ? 'General supporting copy'
                    : 'CAC impact supporting copy'}
                </strong>
                <span className="cms-fact-summary">
                  {f.copy_kind === 'context' ? 'Context' : 'Fact'} ·{' '}
                  {f.verified
                    ? 'Eligible for gameplay display'
                    : 'Not eligible for gameplay display'}
                  {f.reporting_period ? ` · ${f.reporting_period}` : ''}
                </span>
                <span className="cms-fact-preview">
                  {f.display_text || 'New scenario fact'}
                </span>
              </summary>
              <div className="cms-editor-fields">
                <TextAreaField
                  label={`${f.fact_role} fact text`}
                  required
                  maxLength={20000}
                  value={f.display_text}
                  onChange={(e) => update(i, { display_text: e.target.value })}
                  labelAction={
                    <FieldInfo
                      label={`${f.fact_role} fact text`}
                      text={`${f.fact_role === 'general' ? 'General supporting copy appears as Community fact for fact copy, or About this decision for context copy.' : 'CAC supporting copy appears as CAC impact in supported CAC-mode recaps.'} Enter final display text, without unresolved {placeholders}. Display eligibility is controlled separately; this text does not automatically bind to statistics.`}
                    />
                  }
                />
                <TextField
                  label={`${f.fact_role} source URL`}
                  labelAction={
                    <FieldInfo
                      label={`${f.fact_role} source URL`}
                      text="HTTPS source attribution for the displayed copy. It does not update the underlying statistics or financial amounts."
                    />
                  }
                  type="url"
                  pattern="https://[^\s]+"
                  required
                  value={f.source_url}
                  onChange={(e) => update(i, { source_url: e.target.value })}
                />
                <div className="cms-inline">
                  <TextField
                    label={`${f.fact_role} reporting period`}
                    labelAction={
                      <FieldInfo
                        label={`${f.fact_role} reporting period`}
                        text="Optional reporting-period attribution for this copy. It is stored separately from structured statistical observations."
                      />
                    }
                    value={f.reporting_period ?? ''}
                    onChange={(e) =>
                      update(i, { reporting_period: e.target.value || null })
                    }
                  />
                  <SelectField
                    label={`${f.fact_role} copy type`}
                    labelAction={
                      <FieldInfo
                        label={`${f.fact_role} copy type`}
                        text="Fact or authored context. General fact copy is headed Community fact; general context is headed About this decision. CAC copy uses CAC impact. This does not change eligibility or gameplay effects."
                      />
                    }
                    value={f.copy_kind}
                    onChange={(e) =>
                      update(i, {
                        copy_kind: e.target.value as CmsFact['copy_kind'],
                      })
                    }
                  >
                    <option value="fact">Fact</option>
                    <option value="context">Context</option>
                  </SelectField>
                </div>
                <div className="ui-field-label">
                  <label className="cms-fact-eligibility">
                    <input
                      type="checkbox"
                      checked={f.verified}
                      onChange={(e) =>
                        update(i, { verified: e.target.checked })
                      }
                    />{' '}
                    Eligible for gameplay display{' '}
                    <span className="admin-muted">({f.fact_role})</span>
                  </label>
                  <FieldInfo
                    label={`${f.fact_role} display eligibility`}
                    text="Eligible copy can be returned by gameplay recap functions. CAC copy also depends on CAC support for the run. New entries start ineligible; unrelated edits preserve the stored eligibility and evidence. This is not a separate approval workflow."
                  />
                </div>
                <details>
                  <summary>Technical details (read-only)</summary>
                  <p>Role: {f.fact_role}</p>
                  <p>Semantic key: {f.semantic_key ?? 'Assigned when saved'}</p>
                  <pre>{JSON.stringify(f.evidence ?? {}, null, 2)}</pre>
                </details>
              </div>
            </details>
          </article>
        ))}
      <div className="cms-choice-actions">
        {(['general', 'cac'] as const)
          .filter((role) => !facts.some((f) => f.fact_role === role))
          .map((role) => (
            <Button key={role} variant="secondary" onClick={() => add(role)}>
              Add {role} fact
            </Button>
          ))}
      </div>
      <Dialog
        open={removing !== null}
        title="Remove scenario fact?"
        description={`Remove the ${removing === null ? '' : facts[removing]?.fact_role} supporting copy from this scenario? The removal takes effect when you save changes.`}
        onDismiss={() => setRemoving(null)}
        dismissLabel="Cancel"
      >
        <Button
          variant="danger"
          onClick={() => {
            onChange(facts.filter((_, i) => i !== removing))
            setRemoving(null)
          }}
        >
          Remove fact
        </Button>
      </Dialog>
    </section>
  )
}
