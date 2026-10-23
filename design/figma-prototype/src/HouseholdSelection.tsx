import { useState } from "react"
import SimulationHeader from "./SimulationHeader"
import SimulationFooter from "./SimulationFooter"
import HouseholdAvatar from "./HouseholdAvatar"
import SetupProgress from "./SetupProgress"
import { householdFixtures } from "./householdFixtures"
import "./setup.css"

function PeopleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 20"><circle cx="8" cy="6" r="3" /><circle cx="16" cy="7" r="2.5" /><path d="M2 18c0-4 2-6 6-6s6 2 6 6M14 18c0-3 1-5 4-5 2.5 0 4 2 4 5" /></svg>
}

function WorkIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 20"><rect x="2" y="5" width="20" height="13" rx="2" /><path d="M8 5V3h8v2M2 10h20M10 10v2h4v-2" /></svg>
}

function BalanceIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 20"><ellipse cx="12" cy="4" rx="8" ry="3" /><path d="M4 4v6c0 2 16 2 16 0V4M4 10v6c0 2 16 2 16 0v-6" /></svg>
}

export default function HouseholdSelection({
  selectedHouseholdId,
  onSelect,
  onBack,
  onContinue,
}: {
  selectedHouseholdId: string | null
  onSelect: (id: string) => void
  onBack: () => void
  onContinue: () => void
}) {
  const [activeSlide, setActiveSlide] = useState(() => Math.max(0, householdFixtures.findIndex((household) => household.id === selectedHouseholdId)))
  const totalSlides = householdFixtures.length
  const showSlide = (index: number) => setActiveSlide((index + totalSlides) % totalSlides)

  return (
    <div className="setup-site setup-site--simulation">
      <SimulationHeader contentId="setup-content" />
      <main id="setup-content" className="setup-main setup-main--simulation">
        <SetupProgress step={1} />
        <section className="household-heading" aria-labelledby="household-title">
          <h1 id="household-title">Every household has a story.</h1>
          <p>Choose a household to begin your simulation.</p>
        </section>
        <fieldset className="household-carousel household-carousel--stacked" aria-roledescription="carousel" onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault()
            showSlide(activeSlide + (event.key === "ArrowRight" ? 1 : -1))
          }
        }}>
          <legend className="sr-only">Choose a household</legend>
          <div className="household-carousel__viewport">
            <div className="household-carousel__track">
              {householdFixtures.map((household, index) => {
                const selected = selectedHouseholdId === household.id
                const position = index === activeSlide ? "center" : index === (activeSlide + 1) % totalSlides ? "next" : "previous"
                return <div className={`household-carousel__slide is-${position}`} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${totalSlides}: ${household.name}`} key={household.id}>
                  <label className={`household-card${selected ? " is-selected" : ""}`} onClick={(event) => {
                    if (index !== activeSlide) {
                      event.preventDefault()
                      showSlide(index)
                    }
                  }}>
                    <input type="radio" name="household" value={household.id} checked={selected} disabled={index !== activeSlide} onChange={() => onSelect(household.id)} />
                    <span className={`household-photo household-photo--${household.photoTone}`}>
                      <HouseholdAvatar householdId={household.id} />
                    </span>
                    <span className="household-card__content">
                      <strong className="household-name">{household.name}</strong>
                      <span className="household-detail"><PeopleIcon />{household.composition}</span>
                      <span className="household-detail"><WorkIcon />{household.incomeDescription}</span>
                      <span className="household-detail"><BalanceIcon />Starting balance <b>${household.startingBalance}</b></span>
                      <span className="household-bio">{household.biography}</span>
                      <span className="household-choice">{selected && <svg className="household-choice__check" aria-hidden="true" viewBox="0 0 20 20"><path d="m4 10 4 4 8-8" /></svg>}{selected ? "Selected" : "Choose this household"}</span>
                    </span>
                  </label>
                </div>
              })}
            </div>
          </div>
          <div className="household-carousel__controls">
            <button type="button" className="household-carousel__arrow" onClick={() => showSlide(activeSlide - 1)} aria-label="Show previous household">‹</button>
            <div className="household-carousel__dots" aria-label="Household slides">
              {householdFixtures.map((household, index) => <button type="button" className={`household-carousel__dot${index === activeSlide ? " is-active" : ""}`} onClick={() => showSlide(index)} aria-label={`Show ${household.name}`} aria-current={index === activeSlide ? "true" : undefined} key={household.id} />)}
            </div>
            <button type="button" className="household-carousel__arrow" onClick={() => showSlide(activeSlide + 1)} aria-label="Show next household">›</button>
          </div>
          <span className="sr-only" aria-live="polite">{householdFixtures[activeSlide].name}, household {activeSlide + 1} of {totalSlides}</span>
        </fieldset>
        <div className="setup-actions household-selection-actions">
          <button type="button" className="setup-back" onClick={onBack}>‹ <span>Back</span></button>
          <button type="button" className="setup-continue" disabled={!selectedHouseholdId} onClick={onContinue}>Continue to CAC support <span>›</span></button>
        </div>
        <p className="setup-sample-note">Prototype · Sample content</p>
      </main>
      <SimulationFooter />
    </div>
  )
}
