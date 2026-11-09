import { useMemo, useState } from 'react'
import {
  Badge,
  DetailList,
  EmptyState,
  FilterSelect,
  SearchField,
} from '../../../components/admin/AdminBits'
import {
  MISSING,
  categoryTone,
  scheduleLabel,
  signedMoney,
  money,
} from '../../../components/admin/format'
import type {
  AdminCategory,
  AdminChoice,
  AdminPersona,
  AdminScenario,
  AdminScenarioStatistic,
  AdminStatistic,
  AdminSupportEffect,
} from '../../../types/adminContent'

interface Props {
  scenarios: readonly AdminScenario[]
  categories: readonly AdminCategory[]
  personas: readonly AdminPersona[]
  choices: readonly AdminChoice[]
  supportEffects: readonly AdminSupportEffect[]
  statistics: readonly AdminStatistic[]
  links: readonly AdminScenarioStatistic[]
}

export function ScenariosPanel({
  scenarios,
  categories,
  personas,
  choices,
  supportEffects,
  statistics,
  links,
}: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [schedule, setSchedule] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const categoryIndex = useMemo(
    () => new Map(categories.map((entry, index) => [entry.id, index])),
    [categories],
  )
  const categoryName = (id: string | null) =>
    categories.find((entry) => entry.id === id)?.name ?? 'No category'

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return scenarios
      .filter(
        (scenario) =>
          (category === 'all' || scenario.categoryId === category) &&
          (schedule === 'all' || scenario.scheduleType === schedule) &&
          (!needle ||
            scenario.title.toLowerCase().includes(needle) ||
            (scenario.description ?? '').toLowerCase().includes(needle)),
      )
      .sort(
        (a, b) =>
          (a.defaultDay ?? 999) - (b.defaultDay ?? 999) ||
          a.title.localeCompare(b.title),
      )
  }, [scenarios, query, category, schedule])

  const active =
    filtered.find((scenario) => scenario.id === selectedId) ?? filtered[0]

  if (scenarios.length === 0)
    return (
      <EmptyState title="No scenarios are stored for this edition.">
        Scenarios appear here once they are added to the selected edition.
      </EmptyState>
    )

  return (
    <div className="admin-split">
      <div className="admin-split__list">
        <div className="admin-filters">
          <SearchField
            label="Search scenarios"
            value={query}
            onChange={setQuery}
            placeholder="Title or description"
          />
          <FilterSelect
            label="Category"
            value={category}
            onChange={setCategory}
            options={[
              { value: 'all', label: 'All categories' },
              ...categories.map((entry) => ({
                value: entry.id,
                label: entry.name,
              })),
            ]}
          />
          <FilterSelect
            label="Schedule"
            value={schedule}
            onChange={setSchedule}
            options={[
              { value: 'all', label: 'All schedules' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'non_scheduled', label: 'Non-scheduled' },
            ]}
          />
        </div>
        <p className="admin-count" role="status">
          Showing {filtered.length.toLocaleString('en-US')} of{' '}
          {scenarios.length.toLocaleString('en-US')} scenarios
        </p>
        {filtered.length === 0 ? (
          <EmptyState title="No scenarios match these filters." />
        ) : (
          <ul className="admin-list" aria-label="Scenarios">
            {filtered.map((scenario) => (
              <li key={scenario.id}>
                <button
                  type="button"
                  className="admin-list__item"
                  aria-current={scenario.id === active?.id ? 'true' : undefined}
                  onClick={() => setSelectedId(scenario.id)}
                >
                  <span className="admin-list__title">{scenario.title}</span>
                  <span className="admin-list__meta">
                    <Badge
                      tone={categoryTone(
                        categoryIndex.get(scenario.categoryId ?? '') ?? 0,
                      )}
                    >
                      {categoryName(scenario.categoryId)}
                    </Badge>
                    <span>
                      {scenario.defaultDay === null
                        ? 'Any day'
                        : `Day ${scenario.defaultDay}`}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {active ? (
        <ScenarioDetail
          key={active.id}
          scenario={active}
          categoryName={categoryName(active.categoryId)}
          tone={categoryTone(categoryIndex.get(active.categoryId ?? '') ?? 0)}
          personaName={
            personas.find((persona) => persona.id === active.personaId)?.name ??
            null
          }
          scenarios={scenarios}
          choices={choices.filter((choice) => choice.scenarioId === active.id)}
          supportEffects={supportEffects}
          statistics={statistics}
          links={links.filter((link) => link.scenarioId === active.id)}
        />
      ) : (
        <div className="admin-split__detail" />
      )}
    </div>
  )
}

function ScenarioDetail({
  scenario,
  categoryName,
  tone,
  personaName,
  scenarios,
  choices,
  supportEffects,
  statistics,
  links,
}: {
  scenario: AdminScenario
  categoryName: string
  tone: ReturnType<typeof categoryTone>
  personaName: string | null
  scenarios: readonly AdminScenario[]
  choices: readonly AdminChoice[]
  supportEffects: readonly AdminSupportEffect[]
  statistics: readonly AdminStatistic[]
  links: readonly AdminScenarioStatistic[]
}) {
  return (
    <article
      className="admin-split__detail admin-card"
      aria-label={`Scenario ${scenario.title}`}
    >
      <header className="admin-card__header">
        <h3>{scenario.title}</h3>
        <div className="admin-badges">
          <Badge tone={tone}>{categoryName}</Badge>
          <Badge
            tone={scenario.scheduleType === 'scheduled' ? 'amber' : 'neutral'}
          >
            {scheduleLabel(scenario.scheduleType)}
          </Badge>
          <Badge>
            {scenario.defaultDay === null
              ? 'Any day'
              : `Day ${scenario.defaultDay}`}
          </Badge>
        </div>
      </header>
      <p className="admin-card__lead">
        {scenario.description ?? 'No description stored.'}
      </p>
      <DetailList
        items={[
          { label: 'Persona', value: personaName ?? MISSING },
          { label: 'Choices', value: String(choices.length) },
        ]}
      />

      <h4>Choices</h4>
      {choices.length === 0 ? (
        <EmptyState title="No choices are stored for this scenario." />
      ) : (
        <ol className="admin-choices">
          {choices.map((choice, index) => {
            const effects = supportEffects.filter(
              (effect) => effect.choiceId === choice.id,
            )
            const next = scenarios.find(
              (entry) => entry.id === choice.nextScenarioId,
            )
            return (
              <li key={choice.id} className="admin-choice">
                <div className="admin-choice__top">
                  <span className="admin-choice__text">
                    <span className="admin-choice__index">{index + 1}</span>
                    {choice.text ?? 'No choice text stored.'}
                  </span>
                  <span
                    className="admin-choice__amount"
                    aria-label={`Balance change ${signedMoney(choice.balanceChange)}`}
                  >
                    {signedMoney(choice.balanceChange)}
                  </span>
                </div>
                {choice.responseText && (
                  <p className="admin-choice__response">
                    <strong>Response:</strong> {choice.responseText}
                  </p>
                )}
                {next && (
                  <p className="admin-choice__response">
                    <strong>Leads to:</strong> {next.title}
                  </p>
                )}
                {effects.map((effect) => (
                  <div key={effect.id} className="admin-choice__support">
                    <Badge tone="teal">CAC support</Badge>{' '}
                    <strong>{money(effect.assistanceAmount)}</strong> assistance
                    {effect.responseText && <p>{effect.responseText}</p>}
                    {effect.explanation && <p>{effect.explanation}</p>}
                  </div>
                ))}
              </li>
            )
          })}
        </ol>
      )}

      <h4>Linked statistics</h4>
      {links.length === 0 ? (
        <EmptyState title="No statistics are linked to this scenario." />
      ) : (
        <ul className="admin-plain-list">
          {links.map((link) => (
            <li key={link.statisticId}>
              {link.factRole && <Badge tone="blue">{link.factRole}</Badge>}{' '}
              {statistics.find((entry) => entry.id === link.statisticId)
                ?.description ?? 'Statistic not found in this edition'}
            </li>
          ))}
        </ul>
      )}

      <details className="admin-technical">
        <summary>Technical details</summary>
        <DetailList
          items={[
            { label: 'Scenario ID', value: <code>{scenario.id}</code> },
            {
              label: 'Edition ID',
              value: <code>{scenario.versionId ?? MISSING}</code>,
            },
          ]}
        />
      </details>
    </article>
  )
}
