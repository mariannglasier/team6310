import { useId } from 'react'
import './ui.css'

interface Option {
  value: string
  label: string
  description?: string
  disabled?: boolean
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
          <label
            key={option.value}
            className={`ui-radio-card${value === option.value ? ' is-selected' : ''}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              required={required}
              aria-invalid={error ? true : undefined}
              onChange={() => onChange(option.value)}
            />
            <span>
              <strong>{option.label}</strong>
              {option.description && (
                <span className="ui-field__hint">{option.description}</span>
              )}
              <span className="ui-radio-status">
                {value === option.value ? 'Selected' : 'Select option'}
              </span>
            </span>
          </label>
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
