import type { ReactNode } from "react"
import SimulationHeader from "./SimulationHeader"
import SimulationFooter from "./SimulationFooter"
import SetupProgress from "./SetupProgress"
import "./setup.css"
import "./setup-flow.css"

export default function SetupFrame({
  step, eyebrow, title, description, children, onBack, backLabel = "Back",
  onContinue, continueLabel, disabled = false,
}: {
  step: 2 | 3
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  onBack: () => void
  backLabel?: string
  onContinue: () => void
  continueLabel: string
  disabled?: boolean
}) {
  return <div className="setup-site setup-site--simulation">
    <SimulationHeader contentId="setup-flow-content" />
    <main id="setup-flow-content" className="setup-main setup-main--simulation setup-flow">
      <SetupProgress step={step} />
      <section className="household-heading" aria-labelledby="setup-flow-title">
        <span className="setup-flow__eyebrow">{eyebrow}</span>
        <h1 id="setup-flow-title">{title}</h1>
        <p>{description}</p>
      </section>
      {children}
      <div className="setup-actions setup-flow-actions">
        <button type="button" className="setup-back" onClick={onBack}>‹ <span>{backLabel}</span></button>
        <button type="button" className="setup-continue" disabled={disabled} onClick={onContinue}>{continueLabel}<span aria-hidden="true">›</span></button>
      </div>
      <p className="setup-sample-note">Prototype · Fictional households · Illustrative scenarios</p>
    </main>
    <SimulationFooter />
  </div>
}
