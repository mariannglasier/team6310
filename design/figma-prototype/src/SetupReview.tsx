import HouseholdAvatar from "./HouseholdAvatar"
import { householdFixtures } from "./householdFixtures"
import SetupFrame from "./SetupFrame"
import SetupIcon from "./SetupIcon"
import { supportOptions, type SupportId } from "./supportOptions"

export default function SetupReview({
  selectedHouseholdId,
  selectedSupportId,
  onBack,
  onEditHousehold,
  onStart,
  group = false,
}: {
  selectedHouseholdId: string | null
  selectedSupportId: SupportId | null
  onBack: () => void
  onEditHousehold: () => void
  onStart: () => void
  group?: boolean
}) {
  const household = householdFixtures.find(
    (item) => item.id === selectedHouseholdId,
  )
  const support = supportOptions.find((item) => item.id === selectedSupportId)
  if (!household || !support) return null

  return (
    <SetupFrame
      step={3}
      eyebrow="Final step · Ready when you are"
      title="Review your setup."
      description={
        group
          ? "Confirm your setup, then wait for your host. Settings lock when gameplay starts."
          : "Your household. Your game mode. One month of choices."
      }
      onBack={onBack}
      backLabel="Game mode"
      onContinue={onStart}
      continueLabel={group ? "Confirm setup & mark ready" : "Begin the game"}
    >
      <div className="setup-review-grid">
        <section className="setup-profile" aria-labelledby="review-household">
          <div
            className={`setup-profile__avatar household-photo--${household.photoTone}`}
          >
            <span className="setup-profile__badge">Household selected</span>
            <HouseholdAvatar householdId={household.id} />
          </div>
          <div className="setup-profile__body">
            <div className="setup-review-heading">
              <div>
                <span className="setup-flow__label">Playing as</span>
                <h2 id="review-household">{household.name}</h2>
              </div>
              <button
                type="button"
                className="setup-edit"
                onClick={onEditHousehold}
              >
                Change<span className="sr-only"> household</span>
              </button>
            </div>
            <p>
              {household.composition} · {household.incomeDescription}
            </p>
            <div className="setup-budget">
              <SetupIcon kind="wallet" />
              <div>
                <span className="setup-flow__label">
                  Available starting balance
                </span>
                <strong>${household.startingBalance}</strong>
              </div>
            </div>
            <p className="setup-profile__story">{household.biography}</p>
          </div>
        </section>
        <div className="setup-review-sidebar">
          <section
            className="setup-scenario-summary"
            aria-labelledby="review-scenario"
          >
            <div className="setup-review-heading">
              <span className="setup-flow__label">Your game mode</span>
              <button type="button" className="setup-edit" onClick={onBack}>
                Change<span className="sr-only"> game mode</span>
              </button>
            </div>
            <span
              className={`setup-scenario-summary__icon support-option--${support.id}`}
            >
              <SetupIcon
                kind={support.id === "with-cac" ? "support" : "independent"}
              />
            </span>
            <h2 id="review-scenario">{support.label}</h2>
            <p>{support.summary}</p>
            <span className="setup-scenario-summary__status">
              <SetupIcon kind="check" />
              Game mode selected
            </span>
          </section>
          <section
            className="setup-mission"
            aria-labelledby="setup-mission-title"
          >
            <span className="setup-flow__label">
              <SetupIcon kind="flag" />
              What happens next
            </span>
            <h2 id="setup-mission-title">
              {group
                ? "Your host starts the session."
                : "Your first day starts with a choice."}
            </h2>
            <p>
              Balance everyday needs, consider unexpected costs, and explore how
              community support can change the options available.
            </p>
            <div className="setup-mission__meta">
              <span>
                <SetupIcon kind="calendar" />
                Before Day 1 · Job selection and preparation
              </span>
            </div>
          </section>
        </div>
      </div>
      <p className="setup-flow__context">
        {group
          ? "Household and support settings remain editable in the lobby and become locked when gameplay starts. The sample month has two decisions spanning days 2–30."
          : "There is no perfect score. Check your choices above, then begin. This shortened prototype includes employment preparation and interviews, groceries, and utilities."}
      </p>
    </SetupFrame>
  )
}
