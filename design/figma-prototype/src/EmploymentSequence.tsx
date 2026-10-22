import {
  chooseInterviewClothing,
  continueEmployment,
  returnToJobBoard,
  selectTargetJob,
  startCacPreparation,
  type ClothingChoice,
  type GameSession,
} from "./gameSessionState"
import { jobOptions, PROFESSIONAL_CLOTHING_COST } from "./fixtures/employment"
import { GameButton, GameHeading } from "./GamePrimitives"
import SetupIcon from "./SetupIcon"

const money = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount)

function JobBoard({
  session,
  onChange,
}: {
  session: GameSession
  onChange: (next: GameSession) => void
}) {
  const reapplying = session.stage === "reapply"
  const availableJobs = reapplying
    ? jobOptions.filter(
        (job) => job.lowerRequirement && job.id !== session.initialTargetJobId,
      )
    : jobOptions
  return (
    <div className="employment-sequence">
      <div className="play-intro">
        <span className="setup-flow__eyebrow">
          {reapplying ? "Day 2 · Reapply" : "Before Day 1 · Job search"}
        </span>
        <GameHeading level={2}>
          {reapplying
            ? "Choose a different job to pursue."
            : "Find a job you can pursue."}
        </GameHeading>
        <p className="play-description">
          {reapplying
            ? "The first interview did not lead to an offer. Apply now for a different, lower-requirement role."
            : "The bulletin board shows weekly income and the skills each role asks for. Options match this scenario’s starting skills."}
        </p>
      </div>
      <div className="employment-board" aria-label="Job bulletin board">
        {availableJobs.map((job) => {
          const qualified = session.preparationCompleted
            ? job.qualifiedAfterPreparation
            : job.qualifiedInitially
          return (
            <article
              key={job.id}
              className={`employment-posting${qualified ? "" : " is-locked"}`}
            >
              <span className="setup-flow__label">
                {qualified ? "Now hiring" : "Not qualified"}
              </span>
              <GameHeading level={3}>{job.title}</GameHeading>
              <strong>{money(job.weeklyIncome)} per week</strong>
              <p>{job.requirements}</p>
              <GameButton
                variant="choice"
                disabled={!qualified}
                onClick={() => onChange(selectTargetJob(session, job.id))}
              >
                <span className="play-choice-copy">
                  <strong>
                    {qualified ? `Select ${job.title}` : "Not qualified"}
                  </strong>
                  <span>
                    {qualified
                      ? "Apply for this job"
                      : "More preparation is needed"}
                  </span>
                </span>
                {qualified && (
                  <span className="play-choice-arrow" aria-hidden="true">
                    →
                  </span>
                )}
              </GameButton>
            </article>
          )
        })}
      </div>
      {!reapplying &&
        session.mode === "with-cac" &&
        !session.preparationCompleted && (
          <section className="employment-preparation">
            <SetupIcon kind="support" />
            <div>
              <span className="setup-flow__label">CAC preparation option</span>
              <GameHeading level={3}>
                Build skills before choosing a job
              </GameHeading>
              <p>
                Visit CAC for relevant English learning, computer-skills
                support, and a job fair before Day 1.
              </p>
              <small>
                This simulated preparation happens before Day 1. Real programs
                take time and do not guarantee employment.
              </small>
              <GameButton
                onClick={() => onChange(startCacPreparation(session))}
              >
                Enter CAC preparation
              </GameButton>
            </div>
          </section>
        )}
    </div>
  )
}

function InterviewChoices({
  session,
  onChange,
}: {
  session: GameSession
  onChange: (next: GameSession) => void
}) {
  const followup = session.stage === "followup-interview"
  const ownsProfessionalClothing = session.clothingOwnership !== "none"
  const choices: {
    id: ClothingChoice
    title: string
    description: string
    cost: string
  }[] = ownsProfessionalClothing
    ? [
        {
          id: "owned",
          title: "Wear my professional clothes",
          description: "Use the interview clothing you already received.",
          cost: "Already paid",
        },
      ]
    : [
        {
          id: "purchase",
          title: "Buy professional clothes",
          description: "Purchase an interview outfit and keep it for later.",
          cost: money(PROFESSIONAL_CLOTHING_COST),
        },
        {
          id: "current",
          title: "Make my current clothes work",
          description: "Use what you already own for the interview.",
          cost: "No cost",
        },
        ...(session.mode === "with-cac"
          ? [
              {
                id: "cac" as const,
                title: "Use the CAC clothing closet",
                description:
                  "Choose professional clothing through CAC for this interview.",
                cost: "No cost",
              },
            ]
          : []),
      ]
  return (
    <div className="employment-sequence">
      <span className="setup-flow__eyebrow">
        Day {followup ? 3 : 2} ·{" "}
        {followup ? "Follow-up interview" : "First interview"}
      </span>
      <GameHeading level={2}>
        {followup
          ? "A different employer wants to meet."
          : "You have an interview."}
      </GameHeading>
      <p className="play-description">
        {followup
          ? "Your new application led to a follow-up interview. Decide what to wear."
          : "The employer invited you to interview for your selected target job. Decide how to prepare your clothing."}
      </p>
      <div
        className="play-choices"
        role="group"
        aria-label="Interview clothing"
      >
        {choices.map((choice) => (
          <GameButton
            key={choice.id}
            variant="choice"
            onClick={() =>
              onChange(chooseInterviewClothing(session, choice.id))
            }
          >
            <span className="play-choice-copy">
              <strong>{choice.title}</strong>
              <span>{choice.description}</span>
            </span>
            <strong className="play-choice-cost">{choice.cost}</strong>
            <span className="play-choice-arrow" aria-hidden="true">
              →
            </span>
          </GameButton>
        ))}
      </div>
      {followup && (
        <p className="play-hint">
          Previously acquired professional clothing will not be charged again.
        </p>
      )}
    </div>
  )
}

export default function EmploymentSequence({
  session,
  onChange,
}: {
  session: GameSession
  onChange: (next: GameSession) => void
}) {
  const target = jobOptions.find((job) => job.id === session.targetJobId)

  if (session.stage === "job-board" || session.stage === "reapply")
    return <JobBoard session={session} onChange={onChange} />

  if (session.stage === "preparation-fact")
    return (
      <div className="employment-fact" role="status">
        <span className="setup-flow__eyebrow">CAC impact · 2025</span>
        <strong>610 people</strong>
        <GameHeading level={2}>
          CAC helped 610 people with adult education in 2025.
        </GameHeading>
        <p>
          Your simulated preparation is complete. Return to the bulletin board
          to see which additional roles are now available.
        </p>
        <GameButton onClick={() => onChange(returnToJobBoard(session))}>
          Return to job board
        </GameButton>
      </div>
    )

  if (
    session.stage === "first-interview" ||
    session.stage === "followup-interview"
  )
    return <InterviewChoices session={session} onChange={onChange} />

  if (session.stage === "reapply-result")
    return (
      <div className="employment-result">
        <span className="play-confirmed">
          <SetupIcon kind="check" />
          Day 2 · Application recorded
        </span>
        <GameHeading level={2}>You reapplied for {target?.title}.</GameHeading>
        <p className="play-description">
          Your new application is in. The follow-up interview will happen on Day
          3.
        </p>
        <dl className="employment-summary">
          <div>
            <dt>New target job</dt>
            <dd>{target?.title}</dd>
          </div>
          <div>
            <dt>Weekly income</dt>
            <dd>{target ? money(target.weeklyIncome) : "—"}</dd>
          </div>
        </dl>
        <div className="play-actions">
          <GameButton onClick={() => onChange(continueEmployment(session))}>
            Continue to Day 3 <span aria-hidden="true">›</span>
          </GameButton>
        </div>
      </div>
    )

  const succeeded =
    session.stage === "followup-result" || session.firstInterviewSucceeded
  return (
    <div className="employment-result">
      <span className="play-confirmed">
        <SetupIcon kind={succeeded ? "check" : "calendar"} />
        Day {session.stage === "followup-result" ? 3 : 2} · Interview result
      </span>
      <GameHeading level={2}>
        {succeeded
          ? `You got the ${target?.title} job.`
          : "The first interview did not lead to an offer."}
      </GameHeading>
      <p className="play-description">
        {succeeded
          ? session.stage === "followup-result"
            ? "The lower-requirement employer offered you the job after the follow-up interview."
            : "Your preparation and professional interview clothing helped you secure the first job."
          : session.preparationCompleted
            ? "You completed preparation, but making your current clothes work was not enough for this first interview."
            : "Without the specified preparation before Day 1, the first interview was unsuccessful."}
      </p>
      <dl className="employment-summary">
        <div>
          <dt>Target job</dt>
          <dd>{target?.title}</dd>
        </div>
        <div>
          <dt>Professional clothing</dt>
          <dd>
            {session.clothingOwnership === "purchased"
              ? "Purchased"
              : session.clothingOwnership === "cac"
                ? "Provided through CAC"
                : "Not owned"}
          </dd>
        </div>
        {succeeded && (
          <div>
            <dt>Weekly income</dt>
            <dd>{target ? money(target.weeklyIncome) : "—"}</dd>
          </div>
        )}
      </dl>
      <div className="play-actions">
        <GameButton onClick={() => onChange(continueEmployment(session))}>
          {succeeded ? "Continue to groceries" : "Reapply for a different job"}
          <span aria-hidden="true">›</span>
        </GameButton>
      </div>
    </div>
  )
}
