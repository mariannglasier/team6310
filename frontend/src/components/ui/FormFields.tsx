import {
  createContext,
  useContext,
  useId,
  type ComponentProps,
  type ReactNode,
} from 'react'
import './ui.css'

const RequiredIndicator = createContext<'text' | 'asterisk'>('text')

interface FieldDetails {
  label: string
  labelAction?: ReactNode
  hint?: string
  error?: string
}
function FieldFrame({
  id,
  label,
  labelAction,
  hint,
  error,
  required,
  children,
}: FieldDetails & { id: string; required?: boolean; children: ReactNode }) {
  const indicator = useContext(RequiredIndicator)
  return (
    <div className="ui-field">
      <div className="ui-field-label">
        <label htmlFor={id}>
          {label}
          {required &&
            (indicator === 'asterisk' ? (
              <span className="ui-required-marker" aria-hidden="true">
                *
              </span>
            ) : (
              <span> (required)</span>
            ))}
        </label>
        {labelAction}
      </div>
      {hint && (
        <span className="ui-field__hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {children}
      {error && (
        <span className="ui-field__error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  )
}
function description(
  id: string,
  hint?: string,
  error?: string,
  existing?: string,
) {
  return (
    [existing, hint && `${id}-hint`, error && `${id}-error`]
      .filter(Boolean)
      .join(' ') || undefined
  )
}
export function TextField({
  label,
  labelAction,
  hint,
  error,
  id,
  required,
  'aria-describedby': describedBy,
  ...props
}: ComponentProps<'input'> & FieldDetails) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <FieldFrame
      id={fieldId}
      label={label}
      labelAction={labelAction}
      hint={hint}
      error={error}
      required={required}
    >
      <input
        {...props}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={description(fieldId, hint, error, describedBy)}
      />
    </FieldFrame>
  )
}
export function TextAreaField({
  label,
  labelAction,
  hint,
  error,
  id,
  required,
  'aria-describedby': describedBy,
  ...props
}: ComponentProps<'textarea'> & FieldDetails) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <FieldFrame
      id={fieldId}
      label={label}
      labelAction={labelAction}
      hint={hint}
      error={error}
      required={required}
    >
      <textarea
        rows={4}
        {...props}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={description(fieldId, hint, error, describedBy)}
      />
    </FieldFrame>
  )
}
export function SelectField({
  label,
  labelAction,
  hint,
  error,
  id,
  required,
  'aria-describedby': describedBy,
  children,
  ...props
}: ComponentProps<'select'> & FieldDetails) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <FieldFrame
      id={fieldId}
      label={label}
      labelAction={labelAction}
      hint={hint}
      error={error}
      required={required}
    >
      <select
        {...props}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={description(fieldId, hint, error, describedBy)}
      >
        {children}
      </select>
    </FieldFrame>
  )
}

export function Form({
  className = '',
  requiredIndicator = 'text',
  ...props
}: ComponentProps<'form'> & { requiredIndicator?: 'text' | 'asterisk' }) {
  return (
    <RequiredIndicator.Provider value={requiredIndicator}>
      <form {...props} className={`ui-form ${className}`} />
    </RequiredIndicator.Provider>
  )
}

export function RequiredFieldLegend({ show = true }: { show?: boolean }) {
  return show ? (
    <span className="ui-required-legend">
      <span className="ui-required-marker">*</span> is a required field
    </span>
  ) : null
}
