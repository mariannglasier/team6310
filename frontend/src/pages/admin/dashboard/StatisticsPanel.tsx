import {
  Badge,
  EmptyState,
  SourceLink,
} from '../../../components/admin/AdminBits'
import {
  MISSING,
  formatDate,
  formatFactValue,
  plural,
} from '../../../components/admin/format'
import type {
  AdminScenario,
  AdminScenarioStatistic,
  AdminStatistic,
} from '../../../types/adminContent'

export function StatisticsPanel({
  statistics,
  links,
  scenarios,
}: {
  statistics: readonly AdminStatistic[]
  links: readonly AdminScenarioStatistic[]
  scenarios: readonly AdminScenario[]
}) {
  const linkedScenarioIds = new Set(links.map((link) => link.scenarioId))
  return (
    <>
      <div className="admin-figures admin-figures--summary">
        <div>
          <span className="admin-figures__value">{statistics.length}</span>
          <span className="admin-figures__label">Statistics</span>
        </div>
        <div>
          <span className="admin-figures__value">{links.length}</span>
          <span className="admin-figures__label">Scenario links</span>
        </div>
        <div>
          <span className="admin-figures__value">
            {linkedScenarioIds.size} / {scenarios.length}
          </span>
          <span className="admin-figures__label">
            Scenarios with a linked statistic
          </span>
        </div>
      </div>

      <h3>Statistics</h3>
      {statistics.length === 0 ? (
        <EmptyState title="No statistics are stored for this edition yet.">
          Researched statistics and their sources will appear here once they are
          saved.
        </EmptyState>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Statistic</th>
                <th scope="col">Value</th>
                <th scope="col">Geography</th>
                <th scope="col">Data period</th>
                <th scope="col">Source</th>
                <th scope="col">Last reviewed</th>
                <th scope="col">Linked scenarios</th>
              </tr>
            </thead>
            <tbody>
              {statistics.map((statistic) => (
                <tr key={statistic.id}>
                  <th scope="row">{statistic.description}</th>
                  <td>
                    {formatFactValue(statistic.value, statistic.unit)}
                    {statistic.unit &&
                    statistic.unit.toLowerCase() !== 'dollars'
                      ? ` ${statistic.unit}`
                      : ''}
                  </td>
                  <td>{statistic.geography ?? MISSING}</td>
                  <td>{statistic.dataPeriod ?? MISSING}</td>
                  <td>
                    <SourceLink
                      href={statistic.sourceUrl}
                      label="Open source"
                    />
                  </td>
                  <td>{formatDate(statistic.lastReviewedAt)}</td>
                  <td>
                    {
                      links.filter((link) => link.statisticId === statistic.id)
                        .length
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3>Scenario statistics</h3>
      {links.length === 0 ? (
        <EmptyState title="No statistics are linked to scenarios yet.">
          Links between scenarios and statistics, with each fact&apos;s role,
          will appear here.
        </EmptyState>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Scenario</th>
                <th scope="col">Fact role</th>
                <th scope="col">Statistic</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={`${link.scenarioId}:${link.statisticId}`}>
                  <th scope="row">
                    {scenarios.find((entry) => entry.id === link.scenarioId)
                      ?.title ?? 'Scenario not found in this edition'}
                  </th>
                  <td>
                    {link.factRole ? (
                      <Badge tone="blue">{link.factRole}</Badge>
                    ) : (
                      MISSING
                    )}
                  </td>
                  <td>
                    {statistics.find((entry) => entry.id === link.statisticId)
                      ?.description ?? 'Statistic not found in this edition'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="admin-muted">
        {plural(links.length, 'scenario link')} stored for this edition.
      </p>
    </>
  )
}
