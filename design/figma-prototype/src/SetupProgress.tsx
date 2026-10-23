export default function SetupProgress({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Household", "CAC support", "Review"]
  return <ol className="setup-progress" aria-label={`Setup step ${step} of 3`}>
    {labels.map((label, index) => {
      const itemStep = index + 1
      return <li aria-current={itemStep === step ? "step" : undefined} className={itemStep === step ? "is-current" : itemStep < step ? "is-complete" : ""} key={label}>
        <span>{itemStep}</span><strong>{label}</strong>
      </li>
    })}
  </ol>
}
