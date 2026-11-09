import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button, ButtonLink } from '../../components/ui/Button'
import { JobBoard } from '../../components/simulation/JobBoard'
import { paths } from '../../app/paths'
import { formatUsd } from '../../lib/money'
import {
  availableJobs,
  clothingOptions,
  type Action,
  type Clothing,
  type Walkthrough,
} from '../../state/employmentWalkthrough'
import '../../components/simulation/employment.css'

const headings = {
  board: 'Find your next opportunity.',
  'preparation-result': 'Your preparation is complete.',
  'application-result': 'Your application is in.',
  day: 'One day at a time.',
  interview: 'What will you wear to the interview?',
  'interview-result': 'Your interview result.',
  reapply: 'A different opportunity.',
  'reapply-result': 'Your application is in.',
  income: 'Your weekly pay has arrived.',
  complete: 'You reached Day 30.',
  ended: 'Simulation ended early.',
} as const

export function EmploymentGame({
  state,
  dispatch,
  onReplay,
  recapFacts,
}: {
  state: Walkthrough
  dispatch: (action: Action) => void
  onReplay: (support: boolean) => void
  recapFacts?: ReactNode
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    const panel = heading.current?.closest('.stage__panel')
    if (panel) panel.scrollTop = 0
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0
    document.title = `${headings[state.stage]} | CAC Poverty Simulation`
  }, [state.stage, state.day])
  const advance = () => dispatch({ type: 'continue' })
  const target = state.jobs.find((item) => item.job.id === state.targetId)?.job
  const finished = state.stage === 'complete' || state.stage === 'ended'
  const result = [
    'preparation-result',
    'application-result',
    'interview-result',
    'reapply-result',
  ].includes(state.stage)
  const labels: Record<Clothing, string> = {
    purchase: 'Buy professional clothes',
    current: 'Make my current clothes work',
    cac: 'Use the CAC clothing closet',
    owned: 'Wear my professional clothes',
  }
  return (
    <div
      key={`${state.stage}:${state.day}:${state.targetId ?? ''}`}
      className="employment-game"
    >
      <div className="employment-layout">
        <section className="employment-content" aria-labelledby="page-heading">
          {state.stage !== 'day' && state.stage !== 'income' && (
            <p className="placeholder-label">
              {state.day === 0
                ? 'Before Day 1 · Job search'
                : `Day ${state.day} of 30`}
              {state.stage === 'reapply' && ' · Reapply'}
            </p>
          )}
          <h2
            className={
              state.stage === 'day' || state.stage === 'income'
                ? 'sr-only'
                : undefined
            }
            ref={heading}
            tabIndex={-1}
          >
            {headings[state.stage]}
          </h2>
          {(state.stage === 'board' || state.stage === 'reapply') && (
            <JobBoard
              key={state.stage}
              jobs={state.jobs}
              eligibleIds={availableJobs(state).map((item) => item.job.id)}
              reapplying={state.stage === 'reapply'}
              onApply={(jobId) => dispatch({ type: 'apply', jobId })}
              onPrepare={
                state.support && !state.prepared && state.stage === 'board'
                  ? () => dispatch({ type: 'prepare' })
                  : undefined
              }
            />
          )}
          {state.stage === 'preparation-result' && (
            <div className="employment-result">
              <h2>CAC preparation completed</h2>
              <p>
                You completed CAC Adult Education classes. Return to the job
                board to explore more opportunities.
              </p>
              <Button onClick={advance}>Return to job board</Button>
            </div>
          )}
          {state.stage === 'application-result' && (
            <div className="employment-result">
              <h2>You got an interview!</h2>
              <p>
                You received an email asking to come in-person for your
                interview on Day 2.
              </p>
              <Button onClick={advance}>Start Day 1</Button>
            </div>
          )}
          {state.stage === 'interview' && (
            <>
              <p>
                {state.day === 3
                  ? 'Day 3 · Follow-up interview'
                  : 'Day 2 · First interview'}{' '}
                for {target?.title}. Choose an outfit to continue.
              </p>
              <div
                className="employment-choices"
                role="group"
                aria-label="Interview clothing"
              >
                <ClothingDecision
                  key={`${state.day}:${state.targetId}`}
                  state={state}
                  labels={labels}
                  onSubmit={(choice) => dispatch({ type: 'interview', choice })}
                />
              </div>
            </>
          )}
          {state.stage === 'interview-result' && (
            <div className="employment-result" role="status">
              <h2>
                {state.hiredDay !== null
                  ? `You got the ${target?.title} job.`
                  : 'The interview did not lead to an offer'}
              </h2>
              {state.hiredDay !== null && (
                <p>Weekly pay: {formatUsd(state.weeklyIncome)}.</p>
              )}
              <Button onClick={advance}>
                {state.hiredDay === null
                  ? 'Search open jobs'
                  : `Continue to Day ${state.day + 1}`}
              </Button>
            </div>
          )}
          {state.stage === 'reapply-result' && (
            <div className="employment-result">
              <h2>You got an interview!</h2>
              <p>
                You received an email asking you to come in-person for your
                interview on Day 3.
              </p>
              <Button onClick={advance}>Continue to Day 3</Button>
            </div>
          )}
          {(state.stage === 'day' || state.stage === 'income') && (
            <div className="employment-placeholder">
              <span className="placeholder-label">
                Day {state.day} · End-of-day scenario
              </span>
              <h2>Placeholder</h2>
              <p>
                This day’s remaining scenarios have not been implemented.
                Continuing does not charge any expenses or record a scenario
                response.
              </p>
              <Button onClick={advance}>
                {state.day === 30 ? 'Finish Day 30' : 'Next'}
              </Button>
            </div>
          )}
          {result && state.stage !== 'preparation-result' && recapFacts}
          {finished && (
            <>
              <p>{state.reason ?? 'You reached the end of the month.'}</p>
              <p>
                Ending balance: <strong>{formatUsd(state.balance)}</strong>
              </p>
              <div className="employment-actions">
                <Button onClick={() => onReplay(false)}>
                  Replay from household selection
                </Button>
                {state.stage === 'complete' && !state.support && (
                  <Button variant="secondary" onClick={() => onReplay(true)}>
                    Try again with CAC support
                  </Button>
                )}
                <ButtonLink to={paths.home}>Return home</ButtonLink>
              </div>
            </>
          )}
          {!finished && (
            <div className="employment-actions">
              <Button variant="text" onClick={() => dispatch({ type: 'end' })}>
                End walkthrough
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function ClothingDecision({
  state,
  labels,
  onSubmit,
}: {
  state: Walkthrough
  labels: Record<Clothing, string>
  onSubmit: (choice: Clothing) => void
}) {
  const [selected, select] = useState<Clothing | null>(null)
  return (
    <>
      {clothingOptions(state).map((choice) => (
        <button
          type="button"
          key={choice}
          className="employment-choice"
          aria-pressed={selected === choice}
          onClick={() => select(choice)}
        >
          <strong>
            {labels[choice]}
            {selected === choice && (
              <span className="employment-selected"> · Selected</span>
            )}
          </strong>
          <span>
            {choice === 'purchase'
              ? formatUsd(state.clothingCost)
              : choice === 'owned'
                ? 'Reuse your outfit. No additional charge.'
                : 'No cost'}
          </span>
        </button>
      ))}
      <Button
        disabled={selected === null}
        onClick={() => {
          if (selected !== null) onSubmit(selected)
        }}
      >
        Submit clothing decision
      </Button>
    </>
  )
}
