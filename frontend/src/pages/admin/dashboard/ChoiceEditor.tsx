import { FieldInfo as Info } from '../../../components/ui/FieldInfo'
import { DeleteControl } from '../../../components/ui/DeleteControl'
import { Button } from '../../../components/ui/Button'
import {
  TextField,
  TextAreaField,
  SelectField,
} from '../../../components/ui/FormFields'
import type { CmsChoice, CmsScenario } from '../../../services/cms'
export function ChoiceEditor({
  choices,
  scenarios,
  onChange,
}: {
  choices: CmsChoice[]
  scenarios: CmsScenario[]
  onChange: (choices: CmsChoice[]) => void
}) {
  const update = (i: number, patch: Partial<CmsChoice>) =>
    onChange(choices.map((c, n) => (n === i ? { ...c, ...patch } : c)))
  const move = (i: number, d: number) => {
    const next = [...choices]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
  }
  return (
    <section className="cms-choice-section">
      <div className="cms-info-heading">
        <h3>Choices</h3>{' '}
        <Info
          label="Choices"
          text="Order is saved for the CMS. Gameplay currently orders choices by ID."
        />
      </div>
      {choices.map((c, i) => (
        <article
          className="admin-card cms-choice"
          key={c.choice_id ?? `new-${i}`}
        >
          <div className="cms-choice-moves">
            <Button
              variant="text"
              disabled={i === 0}
              onClick={() => move(i, -1)}
              aria-label={`Move choice ${i + 1} up`}
            >
              ↑
            </Button>
            <Button
              variant="text"
              disabled={i === choices.length - 1}
              onClick={() => move(i, 1)}
              aria-label={`Move choice ${i + 1} down`}
            >
              ↓
            </Button>
          </div>
          <details>
            <summary>
              <strong>{c.choice_text || 'New choice'}</strong>
              <span className="admin-muted">
                {' '}
                {Number(c.balance_change) >= 0 ? '+' : ''}${c.balance_change} ·
                Upfront ${c.upfront_cost}
                {c.requires_cac ? ' · CAC required' : ''}
              </span>
            </summary>
            <div className="cms-editor-fields">
              <TextField
                label={`Choice ${i + 1} text`}
                required
                value={c.choice_text}
                onChange={(e) => update(i, { choice_text: e.target.value })}
              />
              <div className="cms-inline">
                <TextField
                  label="Balance change (USD)"
                  type="number"
                  step="0.01"
                  required
                  value={c.balance_change}
                  onChange={(e) =>
                    update(i, { balance_change: e.target.value })
                  }
                />
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={c.requires_cac}
                      onChange={(e) =>
                        update(i, { requires_cac: e.target.checked })
                      }
                    />{' '}
                    Requires CAC
                  </label>
                  <Info
                    label="requires_cac"
                    text="Individual play only allows this choice with CAC support enabled and marks assistance used after commitment. Group voting does not apply the same guard."
                  />
                </div>
                <div>
                  <TextField
                    label="Upfront cost (USD)"
                    labelAction={
                      <Info
                        label="upfront_cost"
                        text="Individual play checks this amount is available before applying balance_change. It is not an additional deduction. Failing either affordability check ends the individual run."
                      />
                    }
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={c.upfront_cost}
                    onChange={(e) =>
                      update(i, { upfront_cost: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <TextAreaField
                  label={`Choice ${i + 1} response`}
                  labelAction={
                    <Info
                      label="response_text"
                      text="Authored feedback returned and restored for this choice. The current ordinary-scenario panel does not display this text. Saving it does not change finances or progression."
                    />
                  }
                  required
                  value={c.response_text}
                  onChange={(e) => update(i, { response_text: e.target.value })}
                />
              </div>
              <div>
                <SelectField
                  label={`Choice ${i + 1} next scenario`}
                  labelAction={
                    <Info
                      label="next_scenario_id"
                      text="Stored connection metadata. Existing individual and group gameplay progression do not follow this destination. None does not end the run."
                    />
                  }
                  value={c.next_scenario_id ?? ''}
                  onChange={(e) =>
                    update(i, { next_scenario_id: e.target.value || null })
                  }
                >
                  <option value="">None</option>
                  {scenarios.map((s) => (
                    <option key={s.scenario_id} value={s.scenario_id}>
                      {s.title}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>
          </details>
          <DeleteControl
            label={`Remove choice ${i + 1}`}
            onClick={() => onChange(choices.filter((_, n) => n !== i))}
          />
        </article>
      ))}
      <Button
        variant="secondary"
        onClick={() =>
          onChange([
            ...choices,
            {
              choice_id: null,
              choice_text: '',
              response_text: '',
              balance_change: '0',
              upfront_cost: '0',
              requires_cac: false,
              next_scenario_id: null,
            },
          ])
        }
      >
        Add choice
      </Button>
    </section>
  )
}
