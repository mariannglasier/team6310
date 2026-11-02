import { useEffect, useRef, useState } from 'react'
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

function Facts({ support }: { support: boolean }) {
  return (
    <aside className="employment-facts" aria-label="Scenario facts">
      <h3>General fact</h3>
      <p>Placeholder — approved employment fact and source pending.</p>
      {support && (
        <>
          <h3>CAC impact fact</h3>
          <p>
            Placeholder — approved scenario-linked CAC fact and source pending.
          </p>
        </>
      )}
    </aside>
  )
}

const headings = {
  board: 'Find your next opportunity.',
  'preparation-result': 'Your preparation is complete.',
  'application-result': 'Your application is in.',
  day: 'One day at a time.',
  interview: 'What will you wear to the interview?',
  'interview-result': 'Your interview result.',
  reapply: 'A different opportunity.',
  'reapply-result': 'Your follow-up application is in.',
  income: 'Your weekly pay has arrived.',
  complete: 'You reached Day 30.',
  ended: 'Your walkthrough ended early.',
} as const

export function EmploymentGame({
  state,
  dispatch,
  onReplay,
}: {
  state: Walkthrough
  dispatch: (action: Action) => void
  onReplay: (support: boolean) => void
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
    <div className="employment-game">
      <p className="employment-notice">
        Provisional employment gameplay · Changes are not saved to Supabase.
        Refresh discards local progress. Other scenarios, bills and approved
        facts are placeholders.
      </p>
      <p className="employment-state">
        {state.hiredDay === null
          ? 'Not employed'
          : `Hired Day ${state.hiredDay}`}{' '}
        · Weekly income: {formatUsd(state.weeklyIncome)} · CAC{' '}
        {state.support ? 'available' : 'unavailable'} · Assistance{' '}
        {state.assistanceUsed ? 'used' : 'not used'}
      </p>
      <div className="employment-layout">
        <section className="employment-content" aria-labelledby="page-heading">
          <p className="placeholder-label">
            {state.day === 0
              ? 'Before Day 1 · Job search'
              : `Day ${state.day} of 30`}
            {state.stage === 'reapply' && ' · Reapply'}
          </p>
          <h2 ref={heading} tabIndex={-1}>
            {headings[state.stage]}
          </h2>
          {(state.stage === 'board' || state.stage === 'reapply') && (
            <JobBoard
              key={state.stage}
              jobs={
                state.stage === 'reapply' ? availableJobs(state) : state.jobs
              }
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
                You chose simulated preparation. Return to the bulletin board to
                review eligible opportunities. Real programs take time and do
                not guarantee employment.
              </p>
              <Button onClick={advance}>Return to job board</Button>
            </div>
          )}
          {state.stage === 'application-result' && (
            <div className="employment-result">
              <h2>Target job: {target?.title}</h2>
              <p>
                Your first interview takes place on Day 2. You are not employed
                yet; weekly income remains $0.
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
                  : 'The first interview did not lead to an offer.'}
              </h2>
              <p>
                {state.hiredDay === 3
                  ? 'The follow-up employer offered you the new job, regardless of your clothing choice.'
                  : state.hiredDay === 2
                    ? 'You completed CAC preparation and used professional clothing, meeting this simulation’s scripted conditions.'
                    : 'This scripted first interview requires both the specified CAC preparation and professional clothing. You can reapply today.'}
              </p>
              <p>
                These educational rules are not a real-world prediction or a
                judgment of a person’s worth.
              </p>
              {state.hiredDay !== null && (
                <p>
                  Weekly pay: {formatUsd(state.weeklyIncome)}. First payday: Day{' '}
                  {state.hiredDay + 7}. No pay is credited on hiring day.
                </p>
              )}
              <Button onClick={advance}>
                {state.hiredDay === null
                  ? 'Reapply today'
                  : `Continue Day ${state.day}`}
              </Button>
            </div>
          )}
          {state.stage === 'reapply-result' && (
            <div className="employment-result">
              <h2>Applied for {target?.title}</h2>
              <p>
                Your follow-up interview is scheduled for Day 3. You are still
                on Day 2.
              </p>
              <Button onClick={advance}>Continue Day 2</Button>
            </div>
          )}
          {state.stage === 'income' && (
            <div className="employment-result" role="status">
              <h2>+{formatUsd(state.weeklyIncome)} received</h2>
              <p>
                Weekly pay has been added once, before today’s scenarios. The
                simulation does not deduct income taxes from wages.
              </p>
              <Button onClick={advance}>Continue to today’s scenarios</Button>
            </div>
          )}
          {state.stage === 'day' && (
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
          {result && <Facts support={state.support} />}
          {finished && (
            <>
              <p>
                {state.reason ??
                  'The 30-day walkthrough is complete. Only employment choices and weekly income were simulated; placeholder days did not include household bills.'}
              </p>
              <p>
                Ending balance: <strong>{formatUsd(state.balance)}</strong>
              </p>
              <h2>Employment and financial history</h2>
              <ol className="employment-history">
                {state.history.map((entry, index) => (
                  <li key={index}>
                    {entry.day === 0 ? 'Pre-game' : `Day ${entry.day}`} ·{' '}
                    {entry.text}
                    {entry.change !== 0 &&
                      ` · ${entry.change > 0 ? '+' : ''}${formatUsd(entry.change)}`}
                  </li>
                ))}
              </ol>
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
        <label key={choice} className="employment-choice">
          <input
            type="radio"
            name="interview-clothing"
            checked={selected === choice}
            onChange={() => select(choice)}
          />
          <strong>{labels[choice]}</strong>
          <span>
            {choice === 'purchase'
              ? `${formatUsd(state.clothingCost)} · keep the outfit for later interviews`
              : choice === 'owned'
                ? 'Reuse your outfit. No additional charge.'
                : 'No cost'}
          </span>
        </label>
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
