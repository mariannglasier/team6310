import { useId, type ComponentProps, type ReactNode } from 'react'
import './ui.css'

interface FieldDetails {
  label: string
  hint?: string
  error?: string
}
function FieldFrame({
  id,
  label,
  hint,
  error,
  required,
  children,
}: FieldDetails & { id: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="ui-field">
      <label htmlFor={id}>
        {label}
        {required && <span> (required)</span>}
      </label>
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

export function Form({ className = '', ...props }: ComponentProps<'form'>) {
  return <form {...props} className={`ui-form ${className}`} />
}
