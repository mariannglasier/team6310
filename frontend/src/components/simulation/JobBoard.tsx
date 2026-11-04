import { useState } from 'react'
import { Button } from '../ui/Button'
import { formatUsd } from '../../lib/money'
import type { WalkthroughJob } from '../../state/employmentWalkthrough'
import './employment.css'

export function JobBoard({
  jobs,
  eligibleIds,
  reapplying,
  onApply,
  onPrepare,
}: {
  jobs: readonly WalkthroughJob[]
  eligibleIds: readonly string[]
  reapplying: boolean
  onApply: (id: string) => void
  onPrepare?: () => void
}) {
  const [selected, select] = useState<string | null>(null)
  return (
    <>
      {reapplying && (
        <p>
          Choose another job you qualify for. Your follow-up interview is on Day
          3.
        </p>
      )}
      {onPrepare && (
        <section
          className="employment-preparation"
          aria-label="Build skills with CAC"
        >
          <Button variant="secondary" onClick={onPrepare}>
            Join CAC Adult Education classes
          </Button>
          <p>
            The CAC offers a variety of adult education programs. English as a
            Second or Other Language classes or computer skills classes could
            help you be more qualified for jobs.
          </p>
        </section>
      )}
      <div
        className="employment-board"
        role="group"
        aria-label="Available jobs"
      >
        <div className="employment-board__postings">
          {jobs.map(({ job }) => {
            const eligible = eligibleIds.includes(job.id)
            const requiredSkills = [
              ...(job.needsEnglishSkills === true
                ? ['English skills required']
                : []),
              ...(job.needsComputerSkills === true
                ? ['Computer skills required']
                : []),
            ]
            return (
              <button
                type="button"
                aria-label={`Choose ${job.title}`}
                aria-description={job.description ?? undefined}
                title={job.description ?? undefined}
                aria-pressed={selected === job.id}
                disabled={!eligible}
                onClick={() => select(job.id)}
                key={job.id}
                className={`employment-posting${eligible ? '' : ' is-locked'}`}
              >
                <span className="employment-posting__pin" aria-hidden="true" />
                <span className="employment-posting__status">
                  {selected === job.id
                    ? 'Selected'
                    : eligible
                      ? 'Now hiring'
                      : reapplying
                        ? 'Unavailable for this application'
                        : 'Qualifications not met'}
                </span>
                <strong className="employment-posting__title">
                  {job.title}
                </strong>
                <strong className="employment-posting__income">
                  {formatUsd(job.weeklyGrossIncome)} / week
                </strong>
                <span>{job.hoursPerWeek} hours per week</span>
                {job.description && (
                  <span className="employment-posting__description">
                    {job.description}
                  </span>
                )}
                {requiredSkills.length > 0 && (
                  <span>{requiredSkills.join(' · ')}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      <Button
        disabled={selected === null || !eligibleIds.includes(selected)}
        onClick={() => {
          if (selected !== null) onApply(selected)
        }}
      >
        Submit application
      </Button>
      {eligibleIds.length === 0 && (
        <p role="alert">
          No eligible jobs are available for this step. Check the household’s
          skills and job requirements.
        </p>
      )}
    </>
  )
}
