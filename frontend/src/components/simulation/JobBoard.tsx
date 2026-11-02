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
  return (
    <>
      <p>
        {reapplying
          ? 'Choose another job you qualify for. Your follow-up interview is on Day 3.'
          : 'Explore the postings. Choose a job to apply.'}
      </p>
      <fieldset className="employment-board">
        <legend>Job bulletin board</legend>
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
                key={job.id}
                type="button"
                aria-label={`Choose ${job.title}`}
                disabled={!eligible}
                onClick={() => onApply(job.id)}
                className={`employment-posting${eligible ? '' : ' is-locked'}`}
              >
                <span className="employment-posting__pin" aria-hidden="true" />
                <span className="employment-posting__status">
                  {eligible ? 'Now hiring' : 'Qualifications not met'}
                </span>
                <strong className="employment-posting__title">
                  {job.title}
                </strong>
                <strong className="employment-posting__income">
                  {formatUsd(job.weeklyGrossIncome)} / week
                </strong>
                <span>{job.hoursPerWeek} hours per week</span>
                {job.description && <span>{job.description}</span>}
                {requiredSkills.length > 0 && (
                  <span>{requiredSkills.join(' · ')}</span>
                )}
              </button>
            )
          })}
        </div>
      </fieldset>
      {eligibleIds.length === 0 && (
        <p role="alert">
          No eligible jobs are available for this step. Check the household’s
          skills and job requirements.
        </p>
      )}
      {onPrepare && (
        <section className="employment-preparation">
          <h2>Build skills with CAC</h2>
          <p>
            Choose relevant English or computer-skills preparation before Day 1.
            This compressed simulation does not imply that real programs take no
            time or guarantee work.
          </p>
          <Button variant="secondary" onClick={onPrepare}>
            Complete CAC preparation
          </Button>
        </section>
      )}
    </>
  )
}
