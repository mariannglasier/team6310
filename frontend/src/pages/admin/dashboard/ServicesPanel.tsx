import { useMemo, useState } from 'react'
import {
  Badge,
  EmptyState,
  SearchField,
} from '../../../components/admin/AdminBits'
import {
  MISSING,
  formatDate,
  formatFactValue,
  plural,
} from '../../../components/admin/format'
import type {
  AdminService,
  AdminServiceFact,
} from '../../../types/adminContent'

export function ServicesPanel({
  services,
  facts,
}: {
  services: readonly AdminService[]
  facts: readonly AdminServiceFact[]
}) {
  const [query, setQuery] = useState('')
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return services
      .map((service) => ({
        service,
        facts: facts.filter((fact) => fact.serviceKey === service.key),
      }))
      .filter(
        ({ service, facts: own }) =>
          !needle ||
          service.name.toLowerCase().includes(needle) ||
          service.key.toLowerCase().includes(needle) ||
          own.some((fact) => fact.title.toLowerCase().includes(needle)),
      )
      .sort((a, b) => a.service.name.localeCompare(b.service.name))
  }, [services, facts, query])

  if (services.length === 0)
    return (
      <EmptyState title="No CAC services are stored.">
        Confirmed CAC services and their reported facts appear here.
      </EmptyState>
    )

  return (
    <>
      <p className="admin-muted">
        Services and facts are shared across editions and come from CAC annual
        reporting.
      </p>
      <div className="admin-filters">
        <SearchField
          label="Search services and facts"
          value={query}
          onChange={setQuery}
          placeholder="Service or fact name"
        />
      </div>
      <p className="admin-count" role="status">
        Showing {rows.length} of {services.length} services ·{' '}
        {plural(facts.length, 'fact')} stored
      </p>
      {rows.length === 0 ? (
        <EmptyState title="No services or facts match this search." />
      ) : (
        <div className="admin-stack">
          {rows.map(({ service, facts: own }) => (
            <details
              key={service.key}
              className="admin-card admin-service"
              open={query.trim() !== '' || undefined}
            >
              <summary>
                <span className="admin-service__name">{service.name}</span>
                <Badge tone={own.length ? 'teal' : 'neutral'}>
                  {plural(own.length, 'fact')}
                </Badge>
              </summary>
              <p className="admin-muted">
                Key: <code>{service.key}</code> · Confirmed{' '}
                {formatDate(service.confirmedAt)}
              </p>
              {own.length === 0 ? (
                <p className="admin-muted">
                  No facts are stored for this service.
                </p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th scope="col">Fact</th>
                        <th scope="col">Value</th>
                        <th scope="col">Unit</th>
                        <th scope="col">Reporting year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {own.map((fact) => (
                        <tr key={fact.id}>
                          <th scope="row">{fact.title}</th>
                          <td className="admin-table__number">
                            {formatFactValue(fact.value, fact.unit)}
                          </td>
                          <td>{fact.unit ?? MISSING}</td>
                          <td>{fact.reportingYear ?? MISSING}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </details>
          ))}
        </div>
      )}
    </>
  )
}
