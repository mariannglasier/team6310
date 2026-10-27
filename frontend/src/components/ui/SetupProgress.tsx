import './ui.css'

// CAC support is not part of setup yet; it returns as a later option.
const steps = ['Household', 'Review'] as const
export function SetupProgress({ step }: { step: 1 | 2 }) {
  return (
    <ol
      className="ui-progress"
      aria-label={`Setup step ${step} of ${steps.length}`}
    >
      {steps.map((label, index) => (
        <li
          key={label}
          className={index + 1 < step ? 'is-complete' : ''}
          aria-current={index + 1 === step ? 'step' : undefined}
        >
          <span className="ui-progress__number" aria-hidden="true">
            {index + 1 < step ? '✓' : index + 1}
          </span>
          <span>
            {label}
            <small>
              {index + 1 < step
                ? 'Completed'
                : index + 1 === step
                  ? 'Current step'
                  : 'Upcoming'}
            </small>
          </span>
        </li>
      ))}
    </ol>
  )
}
