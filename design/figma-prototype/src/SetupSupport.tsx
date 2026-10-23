import { householdFixtures } from "./householdFixtures"
import HouseholdAvatar from "./HouseholdAvatar"
import SetupFrame from "./SetupFrame"
import SetupIcon from "./SetupIcon"
import { supportOptions, type SupportId } from "./supportOptions"

export default function SetupSupport({
  selectedHouseholdId, selectedSupportId, onSelect, onBack, onContinue,
}: {
  selectedHouseholdId: string | null
  selectedSupportId: SupportId | null
  onSelect: (id: SupportId) => void
  onBack: () => void
  onContinue: () => void
}) {
  const household = householdFixtures.find((item) => item.id === selectedHouseholdId)
  return <SetupFrame
    step={2}
    eyebrow="Choose your game mode"
    title="Same household. Different support."
    description="Choose the resources available for your month."
    onBack={onBack}
    onContinue={onContinue}
    continueLabel="Review your setup"
    disabled={!selectedSupportId}
  >
    {household && <div className="setup-player-strip">
      <span className={`setup-mini-avatar household-photo--${household.photoTone}`}><HouseholdAvatar householdId={household.id} /></span>
      <div><span className="setup-flow__label">Your household</span><strong>{household.name}</strong></div>
      <span className="setup-player-strip__balance"><span className="setup-flow__label">Starting balance</span><strong>${household.startingBalance}</strong></span>
    </div>}
    <fieldset className="support-options">
      <legend className="sr-only">Choose your game mode: with or without CAC support</legend>
      {supportOptions.map((option) => {
        const selected = option.id === selectedSupportId
        return <label className={`support-option support-option--${option.id}${selected ? " is-selected" : ""}`} key={option.id}>
          <input type="radio" name="cac-support" value={option.id} checked={selected} onChange={() => onSelect(option.id)} />
          <span className="support-option__top">
            <span className="support-option__icon"><SetupIcon kind={option.id === "with-cac" ? "support" : "independent"} /></span>
            <span className="support-option__radio">{selected && <SetupIcon kind="check" />}</span>
          </span>
          <span className="setup-flow__label">{option.eyebrow}</span>
          <strong className="support-option__title">{option.label}</strong>
          <span className="support-option__description">{option.description}</span>
          <span className="support-option__features">{option.features.map((feature) => <span key={feature}><SetupIcon kind="check" />{feature}</span>)}</span>
          <span className="support-option__choice">{selected ? <><SetupIcon kind="check" />Game mode selected</> : "Choose this game mode"}</span>
        </label>
      })}
    </fieldset>
    <p className="setup-flow__context">Two perspectives, not difficulty levels. Support is an illustrative scenario setting, not a guarantee of services or an addition to your cash balance.</p>
  </SetupFrame>
}
