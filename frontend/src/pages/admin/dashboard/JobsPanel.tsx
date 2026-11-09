import { useMemo, useState } from 'react'
import {
  Badge,
  DetailList,
  EmptyState,
  SearchField,
  SourceLink,
} from '../../../components/admin/AdminBits'
import {
  MISSING,
  formatDate,
  humanize,
  money,
  yesNo,
} from '../../../components/admin/format'
import type { AdminJob } from '../../../types/adminContent'

export function JobsPanel({ jobs }: { jobs: readonly AdminJob[] }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return jobs
      .filter(
        (job) =>
          !needle ||
          job.title.toLowerCase().includes(needle) ||
          job.socCode.toLowerCase().includes(needle),
      )
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [jobs, query])

  if (jobs.length === 0)
    return (
      <EmptyState title="No jobs are stored for this edition.">
        Only approved, active jobs in published editions are visible here.
      </EmptyState>
    )

  return (
    <>
      <div className="admin-filters">
        <SearchField
          label="Search jobs"
          value={query}
          onChange={setQuery}
          placeholder="Job title or SOC code"
        />
      </div>
      <p className="admin-count" role="status">
        Showing {filtered.length} of {jobs.length} jobs
      </p>
      {filtered.length === 0 ? (
        <EmptyState title="No jobs match this search." />
      ) : (
        <div className="admin-grid admin-grid--wide">
          {filtered.map((job) => (
            <article
              key={job.id}
              className="admin-card"
              aria-label={`Job ${job.title}`}
            >
              <header className="admin-card__header">
                <h3>{job.title}</h3>
                <div className="admin-badges">
                  <Badge tone="blue">SOC {job.socCode}</Badge>
                  <Badge tone={job.isApproved ? 'green' : 'amber'}>
                    {job.isApproved ? 'Approved' : 'Not approved'}
                  </Badge>
                  <Badge tone={job.isActive ? 'green' : 'neutral'}>
                    {job.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </header>
              <div className="admin-figures">
                <div>
                  <span className="admin-figures__value">
                    {money(job.weeklyGrossIncome)}
                  </span>
                  <span className="admin-figures__label">Weekly gross</span>
                </div>
                <div>
                  <span className="admin-figures__value">
                    {money(job.medianHourlyWage)}
                  </span>
                  <span className="admin-figures__label">Median hourly</span>
                </div>
                <div>
                  <span className="admin-figures__value">
                    {job.hoursPerWeek ?? MISSING}
                  </span>
                  <span className="admin-figures__label">Hours per week</span>
                </div>
              </div>
              {job.description && (
                <p className="admin-card__lead">{job.description}</p>
              )}
              <DetailList
                items={[
                  { label: 'Area', value: job.areaName ?? MISSING },
                  { label: 'Wage year', value: job.wageYear ?? MISSING },
                  {
                    label: 'Needs English skills',
                    value: yesNo(job.needsEnglishSkills),
                  },
                  {
                    label: 'Needs computer skills',
                    value: yesNo(job.needsComputerSkills),
                  },
                  {
                    label: 'Entry education',
                    value: job.entryEducation ?? MISSING,
                  },
                  {
                    label: 'Related experience',
                    value: job.relatedExperience ?? MISSING,
                  },
                  {
                    label: 'On-the-job training',
                    value: job.onJobTraining ?? MISSING,
                  },
                  ...Object.entries(job.requirements).map(([key, value]) => ({
                    label: humanize(key),
                    value: key === 'notes' ? value : humanize(value),
                  })),
                  { label: 'Last reviewed', value: formatDate(job.reviewedAt) },
                  {
                    label: 'Wage source',
                    value: (
                      <SourceLink
                        href={job.wageSourceUrl}
                        label="Open wage source"
                      />
                    ),
                  },
                  {
                    label: 'Requirements source',
                    value: (
                      <SourceLink
                        href={job.requirementsSourceUrl}
                        label="Open requirements source"
                      />
                    ),
                  },
                ]}
              />
              <details className="admin-technical">
                <summary>Technical details</summary>
                <DetailList
                  items={[
                    { label: 'Job ID', value: <code>{job.id}</code> },
                    {
                      label: 'Edition ID',
                      value: <code>{job.versionId ?? MISSING}</code>,
                    },
                  ]}
                />
              </details>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
