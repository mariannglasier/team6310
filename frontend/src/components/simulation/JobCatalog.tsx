import { formatUsd } from '../../lib/money'
import type { Job } from '../../types/domain'
import './simulation.css'

// Read-only display of approved jobs. Hiring, preparation, and weekly pay are
// protected simulation operations and are not part of this component.
export function JobCatalog({ jobs }: { jobs: readonly Job[] }) {
  if (jobs.length === 0) return <p>No approved jobs are available yet.</p>
  return (
    <ul className="job-catalog" aria-label="Approved jobs">
      {jobs.map((job) => (
        <li key={job.id} className="job-card">
          <h3>{job.title}</h3>
          {job.description && <p>{job.description}</p>}
          <dl>
            <div>
              <dt>Median hourly wage</dt>
              <dd>{formatUsd(job.medianHourlyWage)}</dd>
            </div>
            <div>
              <dt>Hours per week</dt>
              <dd>{job.hoursPerWeek}</dd>
            </div>
            <div>
              <dt>Gross weekly income</dt>
              <dd>{formatUsd(job.weeklyGrossIncome)}</dd>
            </div>
          </dl>
          {job.requirementsNote && <p>{job.requirementsNote}</p>}
          <p className="job-card__source">
            Source:{' '}
            <a href={job.wageSourceUrl} rel="noreferrer">
              BLS OEWS May {job.wageYear}, {job.areaName}
            </a>
          </p>
        </li>
      ))}
    </ul>
  )
}
