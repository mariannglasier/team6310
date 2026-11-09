import {
  Badge,
  DetailList,
  EmptyState,
} from '../../../components/admin/AdminBits'
import { MISSING, money, plural, yesNo } from '../../../components/admin/format'
import type {
  AdminJob,
  AdminPersona,
  AdminPersonaExpense,
  AdminScenario,
} from '../../../types/adminContent'

export function PersonasPanel({
  personas,
  expenses,
  scenarios,
  jobs,
}: {
  personas: readonly AdminPersona[]
  expenses: readonly AdminPersonaExpense[]
  scenarios: readonly AdminScenario[]
  jobs: readonly AdminJob[]
}) {
  if (personas.length === 0)
    return (
      <EmptyState title="No personas are stored for this edition.">
        Personas appear here once they are added to the selected edition.
      </EmptyState>
    )
  return (
    <div className="admin-grid admin-grid--wide">
      {personas.map((persona) => {
        const own = expenses.filter((entry) => entry.personaId === persona.id)
        const startingJob = jobs.find((job) => job.id === persona.startingJobId)
        return (
          <article
            key={persona.id}
            className="admin-card"
            aria-label={`Persona ${persona.name}`}
          >
            <header className="admin-card__header admin-card__header--persona">
              <span className="admin-monogram" aria-hidden="true">
                {persona.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <h3>{persona.name}</h3>
                <div className="admin-badges">
                  <Badge tone="blue">
                    {plural(
                      scenarios.filter(
                        (entry) => entry.personaId === persona.id,
                      ).length,
                      'linked scenario',
                    )}
                  </Badge>
                </div>
              </div>
            </header>
            <div className="admin-figures">
              <div>
                <span className="admin-figures__value">
                  {money(persona.startingBalance)}
                </span>
                <span className="admin-figures__label">Starting balance</span>
              </div>
              <div>
                <span className="admin-figures__value">
                  {money(persona.weeklyIncome)}
                </span>
                <span className="admin-figures__label">Weekly income</span>
              </div>
            </div>
            <p className="admin-card__lead">
              {persona.description ?? 'No description stored.'}
            </p>
            <DetailList
              items={[
                {
                  label: 'Starting job',
                  value: persona.startingJobId
                    ? (startingJob?.title ?? 'Job not found in this edition')
                    : 'None',
                },
                {
                  label: 'English skills',
                  value: yesNo(persona.hasEnglishSkills),
                },
                {
                  label: 'Computer skills',
                  value: yesNo(persona.hasComputerSkills),
                },
              ]}
            />
            <h4>Scheduled expenses</h4>
            {own.length === 0 ? (
              <p className="admin-muted">
                No scheduled expenses are stored for this persona.
              </p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th scope="col">Expense</th>
                      <th scope="col">Amount</th>
                      <th scope="col">First due</th>
                      <th scope="col">Repeats</th>
                      <th scope="col">Late fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {own.map((expense) => (
                      <tr key={expense.id}>
                        <th scope="row">{expense.name}</th>
                        <td>{money(expense.amount)}</td>
                        <td>
                          {expense.firstDueDay === null
                            ? MISSING
                            : `Day ${expense.firstDueDay}`}
                        </td>
                        <td>
                          {expense.repeatIntervalDays
                            ? `Every ${plural(expense.repeatIntervalDays, 'day')}`
                            : 'One time'}
                        </td>
                        <td>{money(expense.lateFee)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <details className="admin-technical">
              <summary>Technical details</summary>
              <DetailList
                items={[
                  { label: 'Persona ID', value: <code>{persona.id}</code> },
                  {
                    label: 'Edition ID',
                    value: <code>{persona.versionId ?? MISSING}</code>,
                  },
                ]}
              />
            </details>
          </article>
        )
      })}
    </div>
  )
}
