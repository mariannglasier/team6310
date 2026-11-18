import { useId } from 'react'
import './ui.css'

interface Option {
  value: string
  label: string
  description?: string
  disabled?: boolean
  ariaLabel?: string
}
interface RadioGroupProps {
  label: string
  name: string
  options: readonly Option[]
  value: string | null
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  error?: string
}
export function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  required,
  disabled,
  error,
}: RadioGroupProps) {
  const id = useId()
  return (
    <fieldset
      className="ui-radio-group"
      disabled={disabled}
      aria-describedby={error ? `${id}-error` : undefined}
    >
      <legend>
        {label}
        {required && ' (required)'}
      </legend>
      <div className="ui-radio-options">
        {options.map((option) => (
          <button
            type="button"
            data-group={name}
            aria-pressed={value === option.value}
            aria-label={option.ariaLabel}
            disabled={option.disabled}
            aria-invalid={error ? true : undefined}
            onClick={() => onChange(option.value)}
            key={option.value}
            className={`ui-radio-card${value === option.value ? ' is-selected' : ''}`}
          >
            <span>
              <strong>{option.label}</strong>
              {option.description && (
                <span className="ui-field__hint">{option.description}</span>
              )}
              {value === option.value && (
                <span className="ui-radio-status">Selected</span>
              )}
            </span>
          </button>
        ))}
      </div>
      {error && (
        <p className="ui-field__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </fieldset>
  )
}
